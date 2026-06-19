-- Migration 024: Add out_of_shift_sales column for tracking sales made outside shift hours.
ALTER TABLE public.employee_shifts
ADD COLUMN IF NOT EXISTS out_of_shift_sales numeric not null default 0;