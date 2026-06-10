-- Migration 016: Fix cashbook trigger for internal use and negative return orders

CREATE OR REPLACE FUNCTION public.fn_auto_cashbook_order()
RETURNS TRIGGER AS $$
DECLARE
    v_type TEXT := 'income';
    v_amount NUMERIC(14, 2) := NEW.total;
    v_category TEXT := 'Doanh thu bán lẻ';
BEGIN
    -- Skip internal use orders (Xuất nội bộ) as they don't involve cash transactions
    IF NEW.order_type = 'internal' THEN
        -- If a cashbook entry already exists for this internal order (e.g. from previous edit), cancel it
        UPDATE public.cashbook_transactions
        SET status = 'cancelled', updated_at = now()
        WHERE ref_type = 'sales' AND ref_id = NEW.id;
        RETURN NEW;
    END IF;

    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status <> 'completed') THEN
        -- For return orders or negative totals, record as expense with positive amount
        IF NEW.total < 0 THEN
            v_type := 'expense';
            v_amount := ABS(NEW.total);
            v_category := 'Trả khách (Hủy/Trả hàng)';
        END IF;

        INSERT INTO public.cashbook_transactions (
            transaction_code, type, amount, category, ref_type, ref_id, payment_method, status, transaction_date
        ) VALUES (
            'PT-' || NEW.order_code,
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
