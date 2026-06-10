-- Migration 017: Update order_items quantity check constraint to allow negative values for returns

-- 1. Drop the old constraint
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_quantity_check;

-- 2. Add new constraint allowing negative values but not zero
ALTER TABLE public.order_items ADD CONSTRAINT order_items_quantity_check CHECK (quantity <> 0);
