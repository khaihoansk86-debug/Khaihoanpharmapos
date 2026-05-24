-- Migration 013: Multi-platform ecommerce pricing

-- 1. Add toggle and JSONB platforms to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_ecommerce boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ecommerce_platforms jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Add ecommerce_platform to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ecommerce_platform text;

-- 3. (Optional) Create index on is_ecommerce for filtering
CREATE INDEX IF NOT EXISTS idx_products_is_ecommerce ON public.products(is_ecommerce);
