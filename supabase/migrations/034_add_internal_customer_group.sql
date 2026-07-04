create table if not exists public.customer_groups (
      id uuid primary key default gen_random_uuid(),
      group_code text not null unique,
      group_name text not null,
      description text,
      discount_percent numeric default 0,
      is_active boolean default true,
      created_at timestamp with time zone default timezone('utc'::text, now()),
      updated_at timestamp with time zone default timezone('utc'::text, now())
);

insert into public.customer_groups (group_code, group_name, description, discount_percent, is_active)
values ('internal', 'Nội bộ', 'Nhân sự lấy hàng nội bộ', 0, true)
on conflict (group_code) do update set
    group_name = excluded.group_name,
    description = excluded.description,
    updated_at = now();
