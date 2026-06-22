-- Migration 026: Add is_closed and closed_at columns to employee_shifts table to support ending shifts.
ALTER TABLE public.employee_shifts ADD COLUMN IF NOT EXISTS is_closed boolean NOT NULL DEFAULT false;
ALTER TABLE public.employee_shifts ADD COLUMN IF NOT EXISTS closed_at timestamptz;
