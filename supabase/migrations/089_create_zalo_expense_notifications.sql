-- Queue completed PharmaPOS cashbook expenses for the private Zalo bot.
-- Purchase cashbook rows are excluded because migration 088 already sends the
-- richer purchase notification (total, paid amount and supplier debt).

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
        'check_connection'
    ));

CREATE OR REPLACE FUNCTION public.queue_completed_expense_for_zalo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.type = 'expense'
       AND NEW.status = 'completed'
       AND NEW.ref_type IS DISTINCT FROM 'purchase'
       AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
        INSERT INTO public.zalo_bot_commands (
            command_type,
            payload,
            status,
            dedupe_key
        ) VALUES (
            'notify_expense_transaction',
            jsonb_build_object('transaction_id', NEW.id),
            'queued',
            'expense_transaction:' || NEW.id::TEXT
        )
        ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.queue_completed_expense_for_zalo()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_queue_completed_expense_for_zalo
    ON public.cashbook_transactions;
CREATE TRIGGER tr_queue_completed_expense_for_zalo
AFTER INSERT OR UPDATE OF status ON public.cashbook_transactions
FOR EACH ROW
EXECUTE FUNCTION public.queue_completed_expense_for_zalo();
