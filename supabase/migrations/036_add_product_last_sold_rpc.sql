CREATE OR REPLACE FUNCTION public.fn_get_product_last_sold()
RETURNS TABLE (product_id uuid, last_sold_at timestamp with time zone) AS $$
BEGIN
    RETURN QUERY
    SELECT oi.product_id, MAX(o.created_at) as last_sold_at
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'completed' AND (o.order_type = 'retail' OR o.order_type IS NULL)
    GROUP BY oi.product_id;
END;
$$ LANGUAGE plpgsql;
