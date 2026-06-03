-- Migration 014: Update order_type check constraint to include 'internal'

-- 1. Drop the old constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_type_check;

-- 2. Add the updated constraint including 'internal'
ALTER TABLE public.orders ADD CONSTRAINT orders_order_type_check CHECK (order_type IN ('retail', 'ecommerce', 'internal'));
