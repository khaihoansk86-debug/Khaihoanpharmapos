-- Optional fixed monthly allowance configured per employee.
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS monthly_allowance NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.employees
DROP CONSTRAINT IF EXISTS employees_monthly_allowance_nonnegative;

ALTER TABLE public.employees
ADD CONSTRAINT employees_monthly_allowance_nonnegative
CHECK (monthly_allowance >= 0);
