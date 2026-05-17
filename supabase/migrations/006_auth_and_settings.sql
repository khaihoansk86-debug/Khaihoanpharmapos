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

-- Đảm bảo có ít nhất 1 tài khoản Admin mặc định để bạn đăng nhập
INSERT INTO public.employees (name, status, username, password_hash, role)
SELECT 'Admin', 'active', 'admin', 'admin123', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM public.employees WHERE username = 'admin');
