-- 069_revoke_anon_sensitive_reads.sql
-- Third lockdown stage: unauthenticated clients no longer read identity,
-- customer, sales, finance, purchasing or webhook data. Catalog/inventory
-- reads required by the current local reporting bot remain temporarily open.

REVOKE SELECT ON public.branch_settings FROM anon;
REVOKE SELECT ON public.cashbook_transactions FROM anon;
REVOKE SELECT ON public.customer_groups FROM anon;
REVOKE SELECT ON public.customers FROM anon;
REVOKE SELECT ON public.ecommerce_return_items FROM anon;
REVOKE SELECT ON public.ecommerce_returns FROM anon;
REVOKE SELECT ON public.employee_shifts FROM anon;
REVOKE SELECT ON public.employees FROM anon;
REVOKE SELECT ON public.order_items FROM anon;
REVOKE SELECT ON public.orders FROM anon;
REVOKE SELECT ON public.purchase_order_items FROM anon;
REVOKE SELECT ON public.purchase_orders FROM anon;
REVOKE SELECT ON public.sepay_webhooks FROM anon;
REVOKE SELECT ON public.suppliers FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE SELECT ON TABLES FROM anon;
