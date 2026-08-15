-- Queue an authoritative Zalo notification whenever a stocktake document is
-- confirmed in PharmaPOS. The Zalo bot consumes this trusted command and
-- sends the completion notice to the configured administrator.

ALTER TABLE public.zalo_bot_settings
    ALTER COLUMN cron_out_of_stock SET DEFAULT '30 11 * * *';

UPDATE public.zalo_bot_settings
SET cron_out_of_stock = '30 11 * * *',
    updated_at = now();

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
        'notify_expense_transaction',
        'notify_stocktake_document',
        'check_connection'
    ));

CREATE OR REPLACE FUNCTION public.queue_confirmed_stocktake_for_zalo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.document_type = 'stocktake_adjustment'
       AND NEW.status = 'confirmed'
       AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'confirmed') THEN
        INSERT INTO public.zalo_bot_commands (
            command_type,
            payload,
            status,
            dedupe_key
        ) VALUES (
            'notify_stocktake_document',
            jsonb_build_object('document_id', NEW.id),
            'queued',
            'stocktake_document:' || NEW.id::TEXT
        )
        ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.queue_confirmed_stocktake_for_zalo()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_queue_confirmed_stocktake_for_zalo
    ON public.inventory_documents;
CREATE TRIGGER tr_queue_confirmed_stocktake_for_zalo
AFTER INSERT OR UPDATE OF status ON public.inventory_documents
FOR EACH ROW
EXECUTE FUNCTION public.queue_confirmed_stocktake_for_zalo();
