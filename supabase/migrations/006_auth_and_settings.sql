-- Migration: Create Auth fields and Branch Settings
-- Run this in Supabase SQL Editor

-- 1. Tạo bảng nhân viên nếu chưa tồn tại (Từ file 002)
create table if not exists public.employees (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    phone text,
    daily_rate numeric not null default 0,
    commission_rate numeric not null default 0,
    status text not null default 'active' check (status in ('active', 'inactive')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 1b. Thêm cột Đăng nhập và Phân quyền
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS username text unique,
ADD COLUMN IF NOT EXISTS password_hash text,
ADD COLUMN IF NOT EXISTS role text default 'staff' check (role in ('admin', 'staff'));

-- 1c. Bảng lịch ca nhân viên
create table if not exists public.employee_shifts (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid not null references public.employees(id) on delete cascade,
    shift_date date not null,
    shift_name text not null default 'Sáng',
    start_time time,
    end_time time,
    sales_amount numeric not null default 0,
    status text not null default 'worked' check (status in ('worked', 'off')),
    note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_employee_shifts_date
    on public.employee_shifts(shift_date desc);

create index if not exists idx_employee_shifts_employee_id
    on public.employee_shifts(employee_id);

drop trigger if exists set_employee_shifts_updated_at on public.employee_shifts;
create trigger set_employee_shifts_updated_at
before update on public.employee_shifts
for each row
execute function public.set_updated_at();

alter table public.employee_shifts enable row level security;

drop policy if exists "Allow anon read employee_shifts" on public.employee_shifts;
create policy "Allow anon read employee_shifts"
on public.employee_shifts for select
to anon
using (true);

drop policy if exists "Allow anon insert employee_shifts" on public.employee_shifts;
create policy "Allow anon insert employee_shifts"
on public.employee_shifts for insert
to anon
with check (true);

drop policy if exists "Allow anon update employee_shifts" on public.employee_shifts;
create policy "Allow anon update employee_shifts"
on public.employee_shifts for update
to anon
using (true)
with check (true);

drop policy if exists "Allow anon delete employee_shifts" on public.employee_shifts;
create policy "Allow anon delete employee_shifts"
on public.employee_shifts for delete
to anon
using (true);

-- 2. Bảng cài đặt thông tin chi nhánh
create table if not exists public.branch_settings (
    id uuid primary key default gen_random_uuid(),
    branch_name text not null default 'Khải Hoàn Pharma',
    address text,
    phone text,
    receipt_header text,
    receipt_footer text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Trigger cập nhật thời gian
drop trigger if exists set_branch_settings_updated_at on public.branch_settings;
create trigger set_branch_settings_updated_at
before update on public.branch_settings
for each row
execute function public.set_updated_at();

-- RLS policies cho bảng cài đặt
alter table public.branch_settings enable row level security;

drop policy if exists "Allow anon read branch_settings" on public.branch_settings;
create policy "Allow anon read branch_settings"
on public.branch_settings for select
to anon
using (true);

drop policy if exists "Allow anon insert branch_settings" on public.branch_settings;
create policy "Allow anon insert branch_settings"
on public.branch_settings for insert
to anon
with check (true);

drop policy if exists "Allow anon update branch_settings" on public.branch_settings;
create policy "Allow anon update branch_settings"
on public.branch_settings for update
to anon
using (true)
with check (true);

-- Insert dữ liệu mẫu mặc định nếu chưa có
INSERT INTO public.branch_settings (branch_name, address, phone)
SELECT 'Nhà thuốc Khải Hoàn', 'Địa chỉ của bạn', '0123456789'
WHERE NOT EXISTS (SELECT 1 FROM public.branch_settings);

-- Đảm bảo có ít nhất 1 tài khoản Admin mặc định để bạn đăng nhập (Pass: admin123)
INSERT INTO public.employees (name, status, username, password_hash, role)
SELECT 'Admin', 'active', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM public.employees WHERE username = 'admin');
