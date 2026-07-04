-- Migration 035: Update customer debt view to include internal staff debt
-- Drops and recreates the view_customer_debts to capture internal orders with a specific customer_id

CREATE OR REPLACE VIEW public.view_customer_debts AS
SELECT 
    o.id AS order_id,
    o.order_code,
    o.total,
    o.amount_received,
    (CASE 
        WHEN o.order_type = 'internal' THEN (ABS(o.total) - o.amount_received)
        ELSE (o.total - o.amount_received)
    END) AS debt_amount,
    o.created_at,
    o.customer_id,
    o.customer_name,
    o.customer_phone,
    c.customer_code
FROM public.orders o
LEFT JOIN public.customers c ON o.customer_id = c.id
WHERE o.status = 'completed' 
  AND COALESCE(o.order_type, 'retail') IN ('retail', 'internal')
  AND (
    (COALESCE(o.order_type, 'retail') = 'retail' AND o.total > o.amount_received) OR
    (o.order_type = 'internal' AND ABS(o.total) > o.amount_received AND o.customer_id IS NOT NULL)
  );
