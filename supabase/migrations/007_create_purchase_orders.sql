-- Purchase ordering workflow for Khai Hoan Pharma POS.
-- Supports staff-created supplier purchase requests before stock is received.

create table if not exists public.purchase_orders (
    id uuid primary key default gen_random_uuid(),
    order_code text not null unique,
    supplier_id uuid references public.suppliers(id) on delete set null,
    supplier_name text,
    status text not null default 'draft'
        check (status in ('draft', 'sent', 'received', 'cancelled')),
    expected_date date,
    note text,
    total_estimated numeric(14, 2) not null default 0,
    created_by uuid references public.employees(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.purchase_order_items (
    id uuid primary key default gen_random_uuid(),
    purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
    line_no int4 not null default 1,
    product_id uuid references public.products(id) on delete set null,
    product_code text,
    product_name text not null,
    unit_name text not null,
    current_stock numeric(14, 2) not null default 0,
    suggested_quantity numeric(14, 2) not null default 0,
    ordered_quantity numeric(14, 2) not null default 0,
    estimated_cost numeric(14, 2) not null default 0,
    last_7d_sold numeric(14, 2) not null default 0,
    note text,
    created_at timestamptz not null default now()
);

create index if not exists idx_purchase_orders_created_at on public.purchase_orders(created_at desc);
create index if not exists idx_purchase_orders_status on public.purchase_orders(status);
create index if not exists idx_purchase_orders_supplier_id on public.purchase_orders(supplier_id);
create index if not exists idx_purchase_order_items_order_id on public.purchase_order_items(purchase_order_id);
create index if not exists idx_purchase_order_items_product_id on public.purchase_order_items(product_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_purchase_orders_updated_at on public.purchase_orders;
create trigger set_purchase_orders_updated_at
before update on public.purchase_orders
for each row
execute function public.set_updated_at();

alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

drop policy if exists "Allow anon read purchase_orders" on public.purchase_orders;
create policy "Allow anon read purchase_orders"
on public.purchase_orders for select
to anon
using (true);

drop policy if exists "Allow anon insert purchase_orders" on public.purchase_orders;
create policy "Allow anon insert purchase_orders"
on public.purchase_orders for insert
to anon
with check (true);

drop policy if exists "Allow anon update purchase_orders" on public.purchase_orders;
create policy "Allow anon update purchase_orders"
on public.purchase_orders for update
to anon
using (true)
with check (true);

drop policy if exists "Allow anon read purchase_order_items" on public.purchase_order_items;
create policy "Allow anon read purchase_order_items"
on public.purchase_order_items for select
to anon
using (true);

drop policy if exists "Allow anon insert purchase_order_items" on public.purchase_order_items;
create policy "Allow anon insert purchase_order_items"
on public.purchase_order_items for insert
to anon
with check (true);
