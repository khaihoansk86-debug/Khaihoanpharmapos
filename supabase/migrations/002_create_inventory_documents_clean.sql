create table if not exists inventory_documents (
    id uuid primary key default gen_random_uuid(),
    document_code text not null unique,
    document_type text not null check (document_type in ('purchase', 'internal_use', 'stocktake_adjustment')),
    status text not null default 'draft' check (status in ('draft', 'confirmed', 'cancelled')),
    note text,
    created_by uuid,
    confirmed_by uuid,
    confirmed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists inventory_document_items (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null references inventory_documents(id) on delete cascade,
    line_no integer not null default 1,
    product_id uuid not null references products(id),
    batch_id uuid references product_batches(id),
    batch_number text,
    expiry_date date,
    quantity_base numeric(14, 3) not null default 0,
    counted_quantity_base numeric(14, 3),
    cost_price numeric(14, 2) not null default 0,
    reason text,
    note text,
    created_at timestamptz not null default now()
);

create table if not exists inventory_movements (
    id uuid primary key default gen_random_uuid(),
    document_id uuid references inventory_documents(id),
    product_id uuid not null references products(id),
    batch_id uuid references product_batches(id),
    movement_type text not null,
    quantity_base numeric(14, 3) not null,
    cost_price numeric(14, 2) not null default 0,
    reason text,
    note text,
    created_by uuid,
    created_at timestamptz not null default now()
);

alter table product_batches add column if not exists cost_price numeric(14, 2) not null default 0;

create index if not exists idx_inventory_documents_type_status on inventory_documents(document_type, status);
create index if not exists idx_inventory_documents_created_at on inventory_documents(created_at desc);
create index if not exists idx_inventory_document_items_document on inventory_document_items(document_id);
create index if not exists idx_inventory_document_items_product_batch on inventory_document_items(product_id, batch_id);
create index if not exists idx_inventory_movements_product_batch on inventory_movements(product_id, batch_id);
create index if not exists idx_inventory_movements_created_at on inventory_movements(created_at desc);
