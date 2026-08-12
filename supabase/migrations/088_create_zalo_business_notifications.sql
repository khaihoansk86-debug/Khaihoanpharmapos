-- Queue trusted PharmaPOS business notifications for the private Zalo bot.

ALTER TABLE public.zalo_bot_settings
    ADD COLUMN IF NOT EXISTS cron_daily_sales TEXT NOT NULL DEFAULT '0 20 * * *';

ALTER TABLE public.zalo_bot_commands
    ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_zalo_bot_commands_dedupe_key
    ON public.zalo_bot_commands(dedupe_key)
    WHERE dedupe_key IS NOT NULL;

ALTER TABLE public.zalo_bot_commands
    DROP CONSTRAINT IF EXISTS zalo_bot_commands_command_type_check;
ALTER TABLE public.zalo_bot_commands
    ADD CONSTRAINT zalo_bot_commands_command_type_check CHECK (command_type IN (
        'send_admin_agenda',
        'run_inventory_audit',
        'send_out_of_stock_report',
        'send_low_stock_report',
        'send_missing_cost_report',
        'send_expiring_report',
        'send_daily_sales_report',
        'notify_purchase_document',
        'check_connection'
    ));

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
        'send_daily_sales_report',
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
        requested_by,
        status
    ) VALUES (
        p_command_type,
        p_payload,
        public.current_employee_id(),
        'queued'
    )
    RETURNING id INTO v_command_id;
    RETURN v_command_id;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_zalo_bot_command(TEXT, JSONB)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enqueue_zalo_bot_command(TEXT, JSONB)
    TO authenticated;

CREATE OR REPLACE FUNCTION public.queue_confirmed_purchase_for_zalo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.document_type = 'purchase'
       AND NEW.status = 'confirmed'
       AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'confirmed') THEN
        INSERT INTO public.zalo_bot_commands (
            command_type,
            payload,
            status,
            dedupe_key
        ) VALUES (
            'notify_purchase_document',
            jsonb_build_object('document_id', NEW.id),
            'queued',
            'purchase_document:' || NEW.id::TEXT
        )
        ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.queue_confirmed_purchase_for_zalo()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_queue_confirmed_purchase_for_zalo
    ON public.inventory_documents;
CREATE TRIGGER tr_queue_confirmed_purchase_for_zalo
AFTER INSERT OR UPDATE OF status ON public.inventory_documents
FOR EACH ROW
EXECUTE FUNCTION public.queue_confirmed_purchase_for_zalo();
