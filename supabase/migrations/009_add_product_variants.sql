-- Migration: Add Product Variants Support
-- Tạo tính năng Phân loại/Biến thể sản phẩm (Cha - Con)

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS variant_label text;

-- Index để truy vấn biến thể nhanh hơn
CREATE INDEX IF NOT EXISTS idx_products_parent_id ON public.products(parent_id);
