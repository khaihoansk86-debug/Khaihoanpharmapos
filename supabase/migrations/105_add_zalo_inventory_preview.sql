-- Preview-only control plane. Approved production migration 2026-09-09.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
ALTER TABLE public.zalo_bot_commands DROP CONSTRAINT zalo_bot_commands_command_type_check;
ALTER TABLE public.zalo_bot_commands ADD CONSTRAINT zalo_bot_commands_command_type_check CHECK(command_type IN (
    'send_admin_agenda','run_inventory_audit','send_out_of_stock_report','send_low_stock_report',
    'send_missing_cost_report','send_expiring_report','send_daily_sales_report','check_connection',
    'notify_purchase_document','notify_expense_transaction','notify_stocktake_document','preview_inventory_health_v1'
));

CREATE OR REPLACE FUNCTION public.enqueue_zalo_bot_command(p_command_type text, p_payload jsonb DEFAULT '{}')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid;
BEGIN
    IF public.is_current_employee_admin() IS NOT TRUE THEN
        RAISE EXCEPTION 'Admin access required' USING ERRCODE='42501';
    END IF;
    IF coalesce(p_command_type,'') NOT IN ('send_admin_agenda','run_inventory_audit','send_out_of_stock_report',
        'send_low_stock_report','send_missing_cost_report','send_expiring_report','send_daily_sales_report',
        'check_connection','preview_inventory_health_v1') THEN
        RAISE EXCEPTION 'Unsupported Zalo command' USING ERRCODE='22023';
    END IF;
    IF p_payload IS NULL OR jsonb_typeof(p_payload)<>'object' OR octet_length(p_payload::text)>2048 THEN
        RAISE EXCEPTION 'Invalid command payload' USING ERRCODE='22023';
    END IF;
    IF p_command_type='preview_inventory_health_v1' AND p_payload<>'{}'::jsonb THEN
        RAISE EXCEPTION 'Invalid preview payload' USING ERRCODE='22023';
    END IF;
    -- Serialize preview admissions only; leave old send workflow semantics unchanged.
    IF p_command_type='preview_inventory_health_v1' THEN
        PERFORM pg_advisory_xact_lock(3900,1);
        IF EXISTS(SELECT 1 FROM public.zalo_bot_commands WHERE command_type=p_command_type
            AND requested_at>now()-interval '30 seconds') THEN
            RAISE EXCEPTION 'Command already queued or recently requested' USING ERRCODE='P0001';
        END IF;
    END IF;
    IF EXISTS(SELECT 1 FROM public.zalo_bot_commands WHERE command_type=p_command_type
        AND status IN ('queued','processing') AND requested_at>now()-interval '5 minutes') THEN
        RAISE EXCEPTION 'Command already queued or running' USING ERRCODE='P0001';
    END IF;
    INSERT INTO public.zalo_bot_commands(command_type,payload,requested_by,status)
        VALUES(p_command_type,p_payload,public.current_employee_id(),'queued') RETURNING id INTO v_id;
    RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.enqueue_zalo_bot_command(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.enqueue_zalo_bot_command(text,jsonb) TO authenticated;

CREATE TABLE public.zalo_inventory_preview_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    command_id uuid NOT NULL UNIQUE REFERENCES public.zalo_bot_commands(id) ON DELETE CASCADE,
    dto jsonb NOT NULL CHECK(jsonb_typeof(dto)='object' AND octet_length(dto::text)<=1048576),
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes',
    CHECK(expires_at>created_at AND expires_at<=created_at+interval '15 minutes')
);
CREATE INDEX zalo_inventory_preview_expiry ON public.zalo_inventory_preview_results(expires_at);
ALTER TABLE public.zalo_inventory_preview_results ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.zalo_inventory_preview_results FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.zalo_inventory_preview_results TO authenticated;
CREATE POLICY preview_admin_read ON public.zalo_inventory_preview_results FOR SELECT TO authenticated
    USING(public.is_current_employee_admin() IS TRUE AND expires_at>now());
-- Worker uses definer RPCs, never direct table writes.

CREATE FUNCTION public.bot_authorize_inventory_preview(p_command_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
    SELECT EXISTS(SELECT 1 FROM public.zalo_bot_commands c JOIN public.employees e ON e.id=c.requested_by
        WHERE c.id=p_command_id AND c.command_type='preview_inventory_health_v1' AND c.status='processing'
        AND c.payload='{}'::jsonb AND e.role='admin' AND e.status='active');
$$;
REVOKE ALL ON FUNCTION public.bot_authorize_inventory_preview(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bot_authorize_inventory_preview(uuid) TO service_role;

CREATE FUNCTION public.bot_store_inventory_preview(p_command_id uuid,p_dto jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_row public.zalo_inventory_preview_results; v_key text;
BEGIN
    IF public.bot_authorize_inventory_preview(p_command_id) IS NOT TRUE THEN
        RAISE EXCEPTION 'preview_forbidden' USING ERRCODE='42501';
    END IF;
    IF p_dto IS NULL OR jsonb_typeof(p_dto)<>'object'
        OR (p_dto->>'contractVersion') IS DISTINCT FROM '1'
        OR jsonb_typeof(p_dto->'counts') IS DISTINCT FROM 'object'
        OR jsonb_typeof(p_dto->'sections') IS DISTINCT FROM 'object'
        OR jsonb_typeof(p_dto->'messages') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'preview_invalid_data' USING ERRCODE='22023';
    END IF;
    IF octet_length(p_dto::text)>1048576 THEN
        RAISE EXCEPTION 'preview_too_large' USING ERRCODE='22023';
    END IF;
    FOREACH v_key IN ARRAY ARRAY['outOfStock','belowMin','aboveMax','withoutMin','needsReview'] LOOP
        IF jsonb_typeof(p_dto->'sections'->v_key) IS DISTINCT FROM 'array' THEN
            RAISE EXCEPTION 'preview_invalid_data' USING ERRCODE='22023';
        END IF;
        IF (p_dto->'counts'->>v_key) IS DISTINCT FROM jsonb_array_length(p_dto->'sections'->v_key)::text THEN
            RAISE EXCEPTION 'preview_invalid_data' USING ERRCODE='22023';
        END IF;
    END LOOP;
    DELETE FROM public.zalo_inventory_preview_results WHERE expires_at<=now();
    INSERT INTO public.zalo_inventory_preview_results(command_id,dto) VALUES(p_command_id,p_dto)
        ON CONFLICT(command_id) DO NOTHING;
    SELECT * INTO STRICT v_row FROM public.zalo_inventory_preview_results WHERE command_id=p_command_id;
    RETURN jsonb_build_object('status','preview_ready','contractVersion',1,'result_id',v_row.id,
        'expires_at',v_row.expires_at,'byte_count',octet_length(v_row.dto::text));
END; $$;
REVOKE ALL ON FUNCTION public.bot_store_inventory_preview(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bot_store_inventory_preview(uuid,jsonb) TO service_role;

CREATE FUNCTION public.get_zalo_inventory_preview(p_result_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_row public.zalo_inventory_preview_results;
BEGIN
    IF public.is_current_employee_admin() IS NOT TRUE THEN
        RAISE EXCEPTION 'Admin access required' USING ERRCODE='42501';
    END IF;
    SELECT * INTO v_row FROM public.zalo_inventory_preview_results WHERE id=p_result_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'preview_not_found' USING ERRCODE='P0002'; END IF;
    IF v_row.expires_at<=now() THEN RAISE EXCEPTION 'preview_expired' USING ERRCODE='P0002'; END IF;
    RETURN v_row.dto;
END; $$;
REVOKE ALL ON FUNCTION public.get_zalo_inventory_preview(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_zalo_inventory_preview(uuid) TO authenticated;

CREATE TABLE public.zalo_preview_contract_verification (
    contract_version integer PRIMARY KEY CHECK(contract_version=1), fingerprint text NOT NULL
);
ALTER TABLE public.zalo_preview_contract_verification ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.zalo_preview_contract_verification FROM PUBLIC,anon,authenticated,service_role;

-- Detect drift in deployed SQL definitions, privileges, table constraints and RLS.
CREATE FUNCTION public.zalo_preview_contract_fingerprint()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
    SELECT md5(string_agg(value,E'\n' ORDER BY value)) FROM (
        SELECT p.oid::regprocedure::text||pg_get_functiondef(p.oid)||coalesce(p.proacl::text,'DEFAULT') AS value
        FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
        WHERE n.nspname='public' AND p.proname IN ('enqueue_zalo_bot_command','bot_authorize_inventory_preview',
            'bot_store_inventory_preview','get_zalo_inventory_preview','zalo_preview_contract_fingerprint',
            'bot_get_zalo_preview_contract','is_current_employee_admin','current_employee_id')
        UNION ALL
        SELECT c.relname||c.relrowsecurity::text||coalesce(c.relacl::text,'DEFAULT') FROM pg_class c
        WHERE c.oid IN ('public.zalo_inventory_preview_results'::regclass,'public.zalo_bot_commands'::regclass,
            'public.zalo_preview_contract_verification'::regclass)
        UNION ALL
        SELECT conname||pg_get_constraintdef(oid) FROM pg_constraint
        WHERE conrelid IN ('public.zalo_inventory_preview_results'::regclass,'public.zalo_bot_commands'::regclass)
        UNION ALL
        SELECT tablename||policyname||coalesce(qual,'')||coalesce(with_check,'')||roles::text||cmd||permissive
        FROM pg_policies WHERE schemaname='public' AND tablename IN
            ('zalo_inventory_preview_results','zalo_bot_commands','zalo_preview_contract_verification')
    ) state;
$$;
REVOKE ALL ON FUNCTION public.zalo_preview_contract_fingerprint() FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.bot_get_zalo_preview_contract()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
    SELECT jsonb_build_object('contractVersion',1,'verified',EXISTS(
        SELECT 1 FROM public.zalo_preview_contract_verification WHERE contract_version=1
        AND fingerprint=public.zalo_preview_contract_fingerprint()),
        'commands',jsonb_build_array('preview_inventory_health_v1'),
        'storage','zalo_inventory_preview_results','maxBytes',1048576,'ttlSeconds',900);
$$;
REVOKE ALL ON FUNCTION public.bot_get_zalo_preview_contract() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bot_get_zalo_preview_contract() TO service_role;
INSERT INTO public.zalo_preview_contract_verification VALUES(1,public.zalo_preview_contract_fingerprint());
COMMIT;
