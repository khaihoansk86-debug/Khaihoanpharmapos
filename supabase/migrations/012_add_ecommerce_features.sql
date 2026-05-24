-- Migration 012: Add e-commerce features

-- 1. Add ecommerce_price to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ecommerce_price numeric NOT NULL DEFAULT 0;

-- 2. Add order_type to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'retail' CHECK (order_type IN ('retail', 'ecommerce'));

-- 3. (Optional) Create index on order_type for faster reporting
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
