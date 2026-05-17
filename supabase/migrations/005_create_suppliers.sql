-- Migration: Create suppliers table and link to inventory_documents
create table if not exists suppliers (
    id uuid primary key default gen_random_uuid(),
    supplier_code text not null unique,
    name text not null,
    contact_type text not null default 'phone' check (contact_type in ('phone', 'web', 'internal', 'other')),
    contact_info text, -- Stores phone number or URL or contact name
    address text,
    note text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Add supplier_id to inventory_documents
do $$
begin
    if not exists (select 1 from INFORMATION_SCHEMA.COLUMNS where table_name = 'inventory_documents' and column_name = 'supplier_id') then
        alter table inventory_documents add column supplier_id uuid references suppliers(id);
    end if;
end $$;

-- Add indexes
create index if not exists idx_suppliers_code on suppliers(supplier_code);
create index if not exists idx_inventory_documents_supplier on inventory_documents(supplier_id);
