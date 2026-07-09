-- Migration 041_fix_supplier_debt_cashbook.sql
-- Fix the trigger to only create the initial cashbook entry for purchase documents,
-- and NOT auto-update the cashbook on subsequent debt payments to prevent overwriting past cashbook entries.

CREATE OR REPLACE FUNCTION public.fn_auto_cashbook_inventory()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.document_type = 'purchase' AND NEW.status = 'confirmed' THEN
        -- Only insert/update cashbook if this is the initial confirmation
        IF OLD IS NULL OR OLD.status <> 'confirmed' THEN
            IF NEW.paid_amount > 0 THEN
                INSERT INTO public.cashbook_transactions (
                    transaction_code, type, amount, category, ref_type, ref_id, payment_method, status, transaction_date
                ) VALUES (
                    'PC-' || NEW.document_code,
                    'expense',
                    NEW.paid_amount,
                    'Chi phí nhập hàng',
                    'purchase',
                    NEW.id,
                    'bank_transfer',
                    'completed',
                    NEW.confirmed_at
                ) ON CONFLICT (transaction_code) DO UPDATE
                SET status = 'completed', amount = EXCLUDED.amount, updated_at = now();
            END IF;
        END IF;
    ELSIF NEW.document_type = 'purchase' AND NEW.status = 'cancelled' THEN
        -- Cancel the cashbook transaction
        UPDATE public.cashbook_transactions
        SET status = 'cancelled', updated_at = now()
        WHERE ref_type = 'purchase' AND ref_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
