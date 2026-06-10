-- Migration 015_create_cashbook.sql
-- Create cashbook_transactions table and automation triggers.

CREATE TABLE IF NOT EXISTS public.cashbook_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_code TEXT NOT NULL UNIQUE, -- PT0001 (Phiếu thu), PC0001 (Phiếu chi)
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')), -- income / expense
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
    category TEXT NOT NULL, -- Doanh thu bán lẻ, Chi phí nhập hàng, Dịch vụ y tế...
    ref_type TEXT NOT NULL CHECK (ref_type IN ('sales', 'purchase', 'manual')), -- Nguồn phát sinh
    ref_id UUID, -- Link to orders.id or inventory_documents.id
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'other')),
    description TEXT,
    performer TEXT, -- Người thực hiện
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for searching and filtering
CREATE INDEX IF NOT EXISTS idx_cashbook_date ON public.cashbook_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_cashbook_type_status ON public.cashbook_transactions(type, status);
CREATE INDEX IF NOT EXISTS idx_cashbook_ref ON public.cashbook_transactions(ref_type, ref_id);

-- RLS policies matching other tables
ALTER TABLE public.cashbook_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read cashbook" ON public.cashbook_transactions;
CREATE POLICY "Allow anon read cashbook"
ON public.cashbook_transactions FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Allow anon insert cashbook" ON public.cashbook_transactions;
CREATE POLICY "Allow anon insert cashbook"
ON public.cashbook_transactions FOR INSERT
TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update cashbook" ON public.cashbook_transactions;
CREATE POLICY "Allow anon update cashbook"
ON public.cashbook_transactions FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Trigger to automatically record POS order sales as cashbook income
CREATE OR REPLACE FUNCTION public.fn_auto_cashbook_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed'
       AND COALESCE(NEW.order_type, 'retail') = 'retail'
       AND (OLD IS NULL OR OLD.status <> 'completed') THEN
        INSERT INTO public.cashbook_transactions (
            transaction_code, type, amount, category, ref_type, ref_id, payment_method, status, transaction_date
        ) VALUES (
            'PT-' || NEW.order_code,
            'income',
            NEW.total,
            'Doanh thu bán lẻ',
            'sales',
            NEW.id,
            'cash',
            'completed',
            NEW.created_at
        ) ON CONFLICT (transaction_code) DO UPDATE
        SET status = 'completed', amount = EXCLUDED.amount, updated_at = now();
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


-- Trigger to automatically record Supplier Purchase imports as cashbook expense
CREATE OR REPLACE FUNCTION public.fn_auto_cashbook_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_total_cost NUMERIC(14, 2) := 0;
BEGIN
    IF NEW.document_type = 'purchase' AND NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status <> 'confirmed') THEN
        -- Calculate total cost from items
        SELECT COALESCE(SUM(quantity_base * cost_price), 0) INTO v_total_cost
        FROM public.inventory_document_items
        WHERE document_id = NEW.id;

        INSERT INTO public.cashbook_transactions (
            transaction_code, type, amount, category, ref_type, ref_id, payment_method, status, transaction_date
        ) VALUES (
            'PC-' || NEW.document_code,
            'expense',
            v_total_cost,
            'Chi phí nhập hàng',
            'purchase',
            NEW.id,
            'bank_transfer',
            'completed',
            NEW.confirmed_at
        ) ON CONFLICT (transaction_code) DO UPDATE
        SET status = 'completed', amount = EXCLUDED.amount, updated_at = now();
    ELSIF NEW.document_type = 'purchase' AND NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
        UPDATE public.cashbook_transactions
        SET status = 'cancelled', updated_at = now()
        WHERE ref_type = 'purchase' AND ref_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_auto_cashbook_inventory ON public.inventory_documents;
CREATE TRIGGER tr_auto_cashbook_inventory
AFTER UPDATE ON public.inventory_documents
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_cashbook_inventory();
