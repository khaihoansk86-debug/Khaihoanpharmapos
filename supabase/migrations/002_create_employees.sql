-- Employee scheduling and quick payroll tables.
-- Run this in Supabase SQL Editor if you want employee data stored in Supabase.
-- The app also works with localStorage before this migration is applied.

create table if not exists public.employees (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    phone text,
    daily_rate numeric not null default 0,
    commission_rate numeric not null default 0,
    status text not null default 'active'
        check (status in ('active', 'inactive')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.employee_shifts (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid not null references public.employees(id) on delete cascade,
    shift_date date not null,
    shift_name text not null default 'Sáng',
    start_time time,
    end_time time,
    cash_amount numeric not null default 0,
    bank_amount numeric not null default 0,
    cash_exchange_amount numeric not null default 0,
    sales_amount numeric not null default 0,
    status text not null default 'worked'
        check (status in ('worked', 'off')),
    note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_employees_status
    on public.employees(status);

create index if not exists idx_employee_shifts_date
    on public.employee_shifts(shift_date desc);

create index if not exists idx_employee_shifts_employee_id
    on public.employee_shifts(employee_id);

drop trigger if exists set_employees_updated_at on public.employees;
create trigger set_employees_updated_at
before update on public.employees
for each row
execute function public.set_updated_at();

drop trigger if exists set_employee_shifts_updated_at on public.employee_shifts;
create trigger set_employee_shifts_updated_at
before update on public.employee_shifts
for each row
execute function public.set_updated_at();

alter table public.employees enable row level security;
alter table public.employee_shifts enable row level security;

drop policy if exists "Allow anon read employees" on public.employees;
create policy "Allow anon read employees"
on public.employees for select
to anon
using (true);

drop policy if exists "Allow anon insert employees" on public.employees;
create policy "Allow anon insert employees"
on public.employees for insert
to anon
with check (true);

drop policy if exists "Allow anon update employees" on public.employees;
create policy "Allow anon update employees"
on public.employees for update
to anon
using (true)
with check (true);

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
