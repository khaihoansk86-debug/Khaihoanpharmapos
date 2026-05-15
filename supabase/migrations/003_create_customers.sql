create table if not exists customers (
    id uuid primary key default gen_random_uuid(),
    customer_code text not null unique,
    full_name text not null,
    phone text unique,
    email text,
    gender text check (gender in ('male', 'female', 'other') or gender is null),
    birth_date date,
    address text,
    tax_code text,
    customer_group text not null default 'retail',
    note text,
    total_spent numeric(14, 2) not null default 0,
    order_count integer not null default 0,
    debt_amount numeric(14, 2) not null default 0,
    last_purchase_at timestamptz,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_customers_full_name on customers using gin (to_tsvector('simple', coalesce(full_name, '')));
create index if not exists idx_customers_phone on customers(phone);
create index if not exists idx_customers_group_active on customers(customer_group, is_active);
create index if not exists idx_customers_last_purchase_at on customers(last_purchase_at desc);

alter table orders add column if not exists customer_id uuid references customers(id);
