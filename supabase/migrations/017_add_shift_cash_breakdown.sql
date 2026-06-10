-- Migration 017: Add payment breakdown fields for employee shift close.

ALTER TABLE public.employee_shifts
ADD COLUMN IF NOT EXISTS cash_amount numeric not null default 0,
ADD COLUMN IF NOT EXISTS bank_amount numeric not null default 0,
ADD COLUMN IF NOT EXISTS cash_exchange_amount numeric not null default 0;
