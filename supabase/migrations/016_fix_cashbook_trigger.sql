-- Migration 016: Fix cashbook trigger for POS retail, ecommerce, internal use, and returns.

CREATE OR REPLACE FUNCTION public.fn_auto_cashbook_order()
RETURNS TRIGGER AS $$
DECLARE
    v_order_type TEXT := COALESCE(NEW.order_type, 'retail');
    v_type TEXT := 'income';
    v_amount NUMERIC(14, 2) := NEW.total;
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
