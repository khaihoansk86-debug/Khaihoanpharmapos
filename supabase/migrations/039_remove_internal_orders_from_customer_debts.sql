-- Migration 039: Remove internal orders from customer debts
-- Reverts the view_customer_debts view to only capture retail orders, excluding internal issues (xuất nội bộ) which do not generate customer debt.

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
