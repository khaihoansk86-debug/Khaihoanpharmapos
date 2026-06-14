-- Migration 020_snapshot_deleted_products.sql
-- Preserve invoice and inventory history after deleting products/batches.

alter table public.inventory_document_items
    add column if not exists product_name text,
    add column if not exists product_code text;

alter table public.inventory_movements
    add column if not exists product_name text,
    add column if not exists product_code text,
    add column if not exists batch_number text;

update public.inventory_document_items idi
set
    product_name = coalesce(idi.product_name, p.name, 'Sản phẩm'),
    product_code = coalesce(idi.product_code, p.product_code)
from public.products p
where idi.product_id = p.id
  and (idi.product_name is null or idi.product_code is null);

update public.inventory_movements im
set
    product_name = coalesce(im.product_name, p.name, 'Sản phẩm'),
    product_code = coalesce(im.product_code, p.product_code)
from public.products p
where im.product_id = p.id
  and (im.product_name is null or im.product_code is null);

update public.inventory_movements im
set batch_number = coalesce(im.batch_number, pb.batch_number)
from public.product_batches pb
where im.batch_id = pb.id
  and im.batch_number is null;

alter table public.inventory_document_items
    alter column product_id drop not null;

alter table public.inventory_movements
    alter column product_id drop not null;

alter table public.inventory_document_items
    drop constraint if exists inventory_document_items_product_id_fkey,
    add constraint inventory_document_items_product_id_fkey
        foreign key (product_id) references public.products(id) on delete set null;

alter table public.inventory_document_items
    drop constraint if exists inventory_document_items_batch_id_fkey,
    add constraint inventory_document_items_batch_id_fkey
        foreign key (batch_id) references public.product_batches(id) on delete set null;

alter table public.inventory_movements
    drop constraint if exists inventory_movements_product_id_fkey,
    add constraint inventory_movements_product_id_fkey
        foreign key (product_id) references public.products(id) on delete set null;

alter table public.inventory_movements
    drop constraint if exists inventory_movements_batch_id_fkey,
    add constraint inventory_movements_batch_id_fkey
        foreign key (batch_id) references public.product_batches(id) on delete set null;
