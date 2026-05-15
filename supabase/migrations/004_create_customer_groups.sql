create table if not exists customer_groups (
    id uuid primary key default gen_random_uuid(),
    group_code text not null unique,
    group_name text not null unique,
    description text,
    discount_percent numeric(5, 2) not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

insert into customer_groups (group_code, group_name, description, discount_percent, is_active)
values
    ('retail', 'Khách lẻ', 'Khách mua lẻ thông thường', 0, true),
    ('vip', 'VIP', 'Khách hàng thân thiết hoặc chi tiêu cao', 0, true),
    ('wholesale', 'Bán sỉ', 'Khách mua số lượng lớn hoặc đại lý', 0, true),
    ('clinic', 'Phòng khám', 'Khách hàng là phòng khám hoặc cơ sở y tế', 0, true)
on conflict (group_code) do update set
    group_name = excluded.group_name,
    description = excluded.description,
    updated_at = now();

create index if not exists idx_customer_groups_active on customer_groups(is_active);
create index if not exists idx_customer_groups_name on customer_groups(group_name);