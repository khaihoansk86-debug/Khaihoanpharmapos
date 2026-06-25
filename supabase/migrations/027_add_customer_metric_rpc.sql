-- Migration 027: Adjust customer POS metrics atomically.
CREATE OR REPLACE FUNCTION public.adjust_customer_metrics(
    p_customer_id uuid,
    p_total_delta numeric DEFAULT 0,
    p_order_count_delta integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_customer_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.customers
    SET
        total_spent = GREATEST(0, COALESCE(total_spent, 0) + COALESCE(p_total_delta, 0)),
        order_count = GREATEST(0, COALESCE(order_count, 0) + COALESCE(p_order_count_delta, 0)),
        last_purchase_at = CASE
            WHEN COALESCE(p_total_delta, 0) > 0 THEN now()
            ELSE last_purchase_at
        END,
        updated_at = now()
    WHERE id = p_customer_id;
END;
$$;
