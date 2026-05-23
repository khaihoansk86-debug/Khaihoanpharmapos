-- Migration: Update Employees Roles and Permissions
-- Adds permissions column and drops constraint on role to allow admin, manager, staff

-- 1. Drop check constraint on role to allow manager
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_role_check;
ALTER TABLE public.employees ADD CONSTRAINT employees_role_check CHECK (role IN ('admin', 'manager', 'staff'));

-- 2. Add permissions column as jsonb
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb;
