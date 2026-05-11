-- Create POS invoice tables for Khai Hoan Pharma POS.
-- Run this in Supabase SQL Editor after the product catalog tables exist.

create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    order_code text not null unique,
    customer_name text not null default 'Khách lẻ',
    customer_phone text,
    subtotal numeric not null default 0,
    discount numeric not null default 0,
    total numeric not null default 0,
    amount_received numeric not null default 0,
    change_amount numeric not null default 0,
    note text,
    status text not null default 'completed'
        check (status in ('draft', 'completed', 'cancelled')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders(id) on delete cascade,
    product_id uuid references public.products(id) on delete set null,
    batch_id uuid references public.product_batches(id) on delete set null,
    product_name text not null,
    product_code text,
    unit_name text not null,
    unit_price numeric not null default 0,
    quantity int4 not null check (quantity > 0),
    total_price numeric not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists idx_orders_created_at
    on public.orders(created_at desc);

create index if not exists idx_orders_order_code
    on public.orders(order_code);

create index if not exists idx_orders_customer_phone
    on public.orders(customer_phone);

create index if not exists idx_order_items_order_id
    on public.order_items(order_id);

create index if not exists idx_order_items_product_id
    on public.order_items(product_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Development policies for a client-side static app using the anon key.
-- Tighten these before production if you add authentication/roles.
drop policy if exists "Allow anon read orders" on public.orders;
create policy "Allow anon read orders"
on public.orders for select
to anon
using (true);

drop policy if exists "Allow anon insert orders" on public.orders;
create policy "Allow anon insert orders"
on public.orders for insert
to anon
with check (true);

drop policy if exists "Allow anon update orders" on public.orders;
create policy "Allow anon update orders"
on public.orders for update
to anon
using (true)
with check (true);

drop policy if exists "Allow anon read order_items" on public.order_items;
create policy "Allow anon read order_items"
on public.order_items for select
to anon
using (true);

drop policy if exists "Allow anon insert order_items" on public.order_items;
create policy "Allow anon insert order_items"
on public.order_items for insert
to anon
with check (true);
