-- 077_create_zalo_bot_control_center.sql
-- Admin-only control plane for the private Zalo bot server.

CREATE TABLE IF NOT EXISTS public.zalo_bot_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cron_morning TEXT NOT NULL DEFAULT '0 7 * * *',
    cron_audit TEXT NOT NULL DEFAULT '0 12 * * *',
    cron_report TEXT NOT NULL DEFAULT '0 18 * * *',
    report_receivers JSONB NOT NULL DEFAULT '[]'::JSONB,
    staff_list JSONB NOT NULL DEFAULT '[]'::JSONB,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    expiring_days INTEGER NOT NULL DEFAULT 90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.zalo_bot_settings
    ADD COLUMN IF NOT EXISTS cron_admin_agenda TEXT NOT NULL DEFAULT '0 8 * * *',
    ADD COLUMN IF NOT EXISTS cron_out_of_stock TEXT NOT NULL DEFAULT '0 15 * * *',
    ADD COLUMN IF NOT EXISTS cron_low_stock TEXT NOT NULL DEFAULT '0 16 * * *',
    ADD COLUMN IF NOT EXISTS cron_missing_cost TEXT NOT NULL DEFAULT '0 17 * * *',
    ADD COLUMN IF NOT EXISTS cron_expiring TEXT NOT NULL DEFAULT '0 18 * * *',
    ADD COLUMN IF NOT EXISTS audit_group_name TEXT,
    ADD COLUMN IF NOT EXISTS audit_admin_name TEXT,
    ADD COLUMN IF NOT EXISTS audit_required_staff JSONB NOT NULL DEFAULT '["Long","Hùng"]'::JSONB,
    ADD COLUMN IF NOT EXISTS audit_target_sessions INTEGER NOT NULL DEFAULT 15
        CHECK (audit_target_sessions BETWEEN 1 AND 31),
    ADD COLUMN IF NOT EXISTS audit_activation_date DATE DEFAULT DATE '2026-07-31';

INSERT INTO public.zalo_bot_settings (
    report_receivers,
    staff_list,
    audit_group_name,
    audit_admin_name
)
SELECT
    '["Lê Đoàn Khanh"]'::JSONB,
    '["Long","Hùng"]'::JSONB,
    'Khải Hoàn Pharma Team',
    'Lê Đoàn Khanh'
WHERE NOT EXISTS (SELECT 1 FROM public.zalo_bot_settings);

CREATE OR REPLACE FUNCTION public.is_current_employee_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.employees employee
        WHERE employee.auth_user_id = auth.uid()
          AND employee.status = 'active'
          AND employee.role = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_current_employee_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_employee_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.zalo_bot_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_type TEXT NOT NULL CHECK (command_type IN (
        'send_admin_agenda',
        'run_inventory_audit',
        'send_out_of_stock_report',
        'send_low_stock_report',
        'send_missing_cost_report',
        'send_expiring_report',
        'check_connection'
    )),
    payload JSONB NOT NULL DEFAULT '{}'::JSONB
        CHECK (jsonb_typeof(payload) = 'object'),
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    requested_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    result JSONB,
    error_message TEXT,
    CONSTRAINT zalo_bot_command_timestamps_check CHECK (
        (started_at IS NULL OR started_at >= requested_at)
        AND (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
    )
);

CREATE INDEX IF NOT EXISTS idx_zalo_bot_commands_queue
    ON public.zalo_bot_commands(status, requested_at);
CREATE INDEX IF NOT EXISTS idx_zalo_bot_commands_recent
    ON public.zalo_bot_commands(requested_at DESC);

CREATE TABLE IF NOT EXISTS public.zalo_bot_runtime_status (
    instance_id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'offline'
        CHECK (status IN ('online', 'degraded', 'offline')),
    version TEXT,
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    zalo_connected BOOLEAN NOT NULL DEFAULT false,
    current_command_id UUID REFERENCES public.zalo_bot_commands(id) ON DELETE SET NULL,
    last_error TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB
        CHECK (jsonb_typeof(metadata) = 'object'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.zalo_bot_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zalo_bot_runtime_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin reads Zalo commands" ON public.zalo_bot_commands;
CREATE POLICY "Admin reads Zalo commands"
    ON public.zalo_bot_commands FOR SELECT TO authenticated
    USING (public.is_current_employee_admin());

DROP POLICY IF EXISTS "Admin reads Zalo runtime status" ON public.zalo_bot_runtime_status;
CREATE POLICY "Admin reads Zalo runtime status"
    ON public.zalo_bot_runtime_status FOR SELECT TO authenticated
    USING (public.is_current_employee_admin());

DROP POLICY IF EXISTS "Allow anon read zalo_bot_settings" ON public.zalo_bot_settings;
DROP POLICY IF EXISTS "Allow anon insert zalo_bot_settings" ON public.zalo_bot_settings;
DROP POLICY IF EXISTS "Allow anon update zalo_bot_settings" ON public.zalo_bot_settings;
DROP POLICY IF EXISTS "Admin reads Zalo settings" ON public.zalo_bot_settings;
CREATE POLICY "Admin reads Zalo settings"
    ON public.zalo_bot_settings FOR SELECT TO authenticated
    USING (public.is_current_employee_admin());
DROP POLICY IF EXISTS "Admin updates Zalo settings" ON public.zalo_bot_settings;
CREATE POLICY "Admin updates Zalo settings"
    ON public.zalo_bot_settings FOR UPDATE TO authenticated
    USING (public.is_current_employee_admin())
    WITH CHECK (public.is_current_employee_admin());

REVOKE ALL ON public.zalo_bot_commands FROM anon, authenticated;
REVOKE ALL ON public.zalo_bot_runtime_status FROM anon, authenticated;
REVOKE ALL ON public.zalo_bot_settings FROM anon;
GRANT SELECT ON public.zalo_bot_commands TO authenticated;
GRANT SELECT ON public.zalo_bot_runtime_status TO authenticated;
GRANT SELECT, UPDATE ON public.zalo_bot_settings TO authenticated;

CREATE OR REPLACE FUNCTION public.enqueue_zalo_bot_command(
    p_command_type TEXT,
    p_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_command_id UUID;
    v_allowed_commands CONSTANT TEXT[] := ARRAY[
        'send_admin_agenda',
        'run_inventory_audit',
        'send_out_of_stock_report',
        'send_low_stock_report',
        'send_missing_cost_report',
        'send_expiring_report',
        'check_connection'
    ];
BEGIN
    IF NOT public.is_current_employee_admin() THEN
        RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
    END IF;
    IF NOT (COALESCE(p_command_type, '') = ANY(v_allowed_commands)) THEN
        RAISE EXCEPTION 'Unsupported Zalo command' USING ERRCODE = '22023';
    END IF;
    IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object'
       OR octet_length(p_payload::TEXT) > 2048 THEN
        RAISE EXCEPTION 'Invalid command payload' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM public.zalo_bot_commands command
        WHERE command.command_type = p_command_type
          AND command.status IN ('queued', 'processing')
          AND command.requested_at > now() - INTERVAL '5 minutes'
    ) THEN
        RAISE EXCEPTION 'Command already queued or running' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.zalo_bot_commands (
        command_type,
        payload,
        requested_by
    )
    VALUES (
        p_command_type,
        p_payload,
        public.current_employee_id()
    )
    RETURNING id INTO v_command_id;
    RETURN v_command_id;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_zalo_bot_command(TEXT, JSONB)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enqueue_zalo_bot_command(TEXT, JSONB)
    TO authenticated;

CREATE OR REPLACE FUNCTION public.bot_claim_next_zalo_command()
RETURNS SETOF public.zalo_bot_commands
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    WITH next_command AS (
        SELECT command.id
        FROM public.zalo_bot_commands command
        WHERE command.status = 'queued'
        ORDER BY command.requested_at
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    UPDATE public.zalo_bot_commands command
    SET status = 'processing',
        started_at = now(),
        error_message = NULL
    FROM next_command
    WHERE command.id = next_command.id
    RETURNING command.*;
END;
$$;

REVOKE ALL ON FUNCTION public.bot_claim_next_zalo_command()
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_claim_next_zalo_command()
    TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.zalo_bot_commands TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.zalo_bot_runtime_status TO service_role;
GRANT SELECT ON public.zalo_bot_settings TO service_role;
