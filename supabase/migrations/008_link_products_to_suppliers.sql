-- Link each product to a default supplier for purchase planning.
-- Run this in Supabase SQL Editor after suppliers/products exist.

alter table public.products
add column if not exists supplier_id uuid references public.suppliers(id) on delete set null;

create index if not exists idx_products_supplier_id
    on public.products(supplier_id);
