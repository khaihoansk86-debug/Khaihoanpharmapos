-- Migration 037: Create a view for customers list with aggregated debt
-- This view left joins the customers table with view_customer_debts to provide accurate, real-time debt calculation for the UI.

CREATE OR REPLACE VIEW public.view_customers_list AS
SELECT 
    c.id,
    c.customer_code,
    c.full_name,
    c.phone,
    c.email,
    c.gender,
    c.birth_date,
    c.address,
    c.tax_code,
    c.customer_group,
    c.note,
    c.total_spent,
    c.order_count,
    c.last_purchase_at,
    c.is_active,
    c.created_at,
    c.updated_at,
    COALESCE(d.total_debt, 0) AS debt_amount
FROM public.customers c
LEFT JOIN (
    SELECT customer_id, SUM(debt_amount) AS total_debt
    FROM public.view_customer_debts
    GROUP BY customer_id
) d ON c.id = d.customer_id;
