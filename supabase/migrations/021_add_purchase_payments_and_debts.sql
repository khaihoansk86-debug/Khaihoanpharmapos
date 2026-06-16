-- Migration 021_add_purchase_payments_and_debts.sql
-- Add paid_amount and debt_amount to inventory_documents, update cashbook triggers, and create debt views.

-- 1. Add columns to inventory_documents
ALTER TABLE public.inventory_documents 
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS debt_amount NUMERIC(14, 2) NOT NULL DEFAULT 0;

-- 2. Update cashbook trigger function for inventory document purchases
CREATE OR REPLACE FUNCTION public.fn_auto_cashbook_inventory()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.document_type = 'purchase' AND NEW.status = 'confirmed' THEN
        -- Only insert/update cashbook if paid_amount > 0
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
        ELSE
            -- If paid_amount is 0 or less, cancel the transaction if it exists
            UPDATE public.cashbook_transactions
            SET status = 'cancelled', updated_at = now()
            WHERE ref_type = 'purchase' AND ref_id = NEW.id;
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

-- 3. Ensure the trigger runs AFTER INSERT OR UPDATE on inventory_documents
DROP TRIGGER IF EXISTS tr_auto_cashbook_inventory ON public.inventory_documents;
CREATE TRIGGER tr_auto_cashbook_inventory
AFTER INSERT OR UPDATE ON public.inventory_documents
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_cashbook_inventory();

-- 4. Update fn_auto_cashbook_order to record amount_received instead of total for initial retail sales
CREATE OR REPLACE FUNCTION public.fn_auto_cashbook_order()
RETURNS TRIGGER AS $$
DECLARE
    v_order_type TEXT := COALESCE(NEW.order_type, 'retail');
    v_type TEXT := 'income';
    v_amount NUMERIC(14, 2) := CASE WHEN NEW.total < 0 THEN ABS(NEW.total) ELSE NEW.amount_received END;
    v_category TEXT := 'Doanh thu ban le';
    v_code TEXT := 'PT-' || NEW.order_code;
BEGIN
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status <> 'completed') THEN
        -- Ecommerce exports are tracked in their own order report, not pharmacy cashbook.
        IF v_order_type = 'ecommerce' THEN
            UPDATE public.cashbook_transactions
            SET status = 'cancelled', updated_at = now()
            WHERE ref_type = 'sales' AND ref_id = NEW.id;
            RETURN NEW;
        END IF;

        IF v_order_type = 'internal' THEN
            v_type := 'expense';
            v_amount := ABS(NEW.total);
            v_category := 'Xuat noi bo tu POS';
            v_code := 'PC-' || NEW.order_code;
        ELSIF NEW.total < 0 THEN
            v_type := 'expense';
            v_amount := ABS(NEW.total);
            v_category := 'Tra khach (Huy/Tra hang)';
            v_code := 'PC-' || NEW.order_code;
        END IF;

        UPDATE public.cashbook_transactions
        SET status = 'cancelled', updated_at = now()
        WHERE ref_type = 'sales'
          AND ref_id = NEW.id
          AND transaction_code <> v_code;

        INSERT INTO public.cashbook_transactions (
            transaction_code, type, amount, category, ref_type, ref_id, payment_method, status, transaction_date
        ) VALUES (
            v_code,
            v_type,
            v_amount,
            v_category,
            'sales',
            NEW.id,
            'cash',
            'completed',
            NEW.created_at
        ) ON CONFLICT (transaction_code) DO UPDATE
        SET status = 'completed',
            amount = EXCLUDED.amount,
            type = EXCLUDED.type,
            category = EXCLUDED.category,
            ref_id = EXCLUDED.ref_id,
            updated_at = now();

    ELSIF NEW.status = 'cancelled' AND OLD.status = 'completed' THEN
        UPDATE public.cashbook_transactions
        SET status = 'cancelled', updated_at = now()
        WHERE ref_type = 'sales' AND ref_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_auto_cashbook_order ON public.orders;
CREATE TRIGGER tr_auto_cashbook_order
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_cashbook_order();

-- 5. Create customer debt view
CREATE OR REPLACE VIEW public.view_customer_debts AS
SELECT 
    o.id AS order_id,
    o.order_code,
    o.total,
    o.amount_received,
    (o.total - o.amount_received) AS debt_amount,
    o.created_at,
    o.customer_id,
    o.customer_name,
    o.customer_phone,
    c.customer_code
FROM public.orders o
LEFT JOIN public.customers c ON o.customer_id = c.id
WHERE o.status = 'completed' 
  AND COALESCE(o.order_type, 'retail') = 'retail' 
  AND o.total > o.amount_received;

-- 6. Create supplier debt view
CREATE OR REPLACE VIEW public.view_supplier_debts AS
SELECT 
    id AS document_id,
    document_code,
    paid_amount,
    debt_amount,
    confirmed_at,
    supplier_id,
    (SELECT name FROM public.suppliers WHERE id = supplier_id) AS supplier_name,
    (SELECT supplier_code FROM public.suppliers WHERE id = supplier_id) AS supplier_code,
    (SELECT note FROM public.suppliers WHERE id = supplier_id) AS supplier_note
FROM public.inventory_documents
WHERE document_type = 'purchase' 
  AND status = 'confirmed' 
  AND debt_amount > 0;
