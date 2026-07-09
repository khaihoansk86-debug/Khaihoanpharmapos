-- Migration 040: Include legacy/customer-profile debts in debt management.
-- Order debts stay the source of truth. If customers.debt_amount still contains
-- an extra/manual balance, expose only the excess amount to avoid double count.

CREATE OR REPLACE VIEW public.view_customer_debts AS
WITH order_debts AS (
    SELECT
        o.id AS order_id,
        o.order_code,
        o.total,
        o.amount_received,
        CASE
            WHEN o.order_type = 'internal' THEN (ABS(o.total) - o.amount_received)
            ELSE (o.total - o.amount_received)
        END AS debt_amount,
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
      )
),
order_debt_totals AS (
    SELECT customer_id, SUM(debt_amount) AS total_order_debt
    FROM order_debts
    WHERE customer_id IS NOT NULL
    GROUP BY customer_id
),
profile_debts AS (
    SELECT
        NULL::uuid AS order_id,
        'KHCD-' || COALESCE(c.customer_code, LEFT(c.id::text, 8)) AS order_code,
        GREATEST(COALESCE(c.debt_amount, 0) - COALESCE(od.total_order_debt, 0), 0) AS total,
        0::numeric AS amount_received,
        GREATEST(COALESCE(c.debt_amount, 0) - COALESCE(od.total_order_debt, 0), 0) AS debt_amount,
        COALESCE(c.updated_at, c.created_at) AS created_at,
        c.id AS customer_id,
        c.full_name AS customer_name,
        c.phone AS customer_phone,
        c.customer_code
    FROM public.customers c
    LEFT JOIN order_debt_totals od ON od.customer_id = c.id
    WHERE GREATEST(COALESCE(c.debt_amount, 0) - COALESCE(od.total_order_debt, 0), 0) > 0
)
SELECT * FROM order_debts
UNION ALL
SELECT * FROM profile_debts;

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
