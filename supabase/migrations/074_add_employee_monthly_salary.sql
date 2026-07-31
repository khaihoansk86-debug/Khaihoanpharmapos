-- Store the salary contract explicitly as a monthly amount.
-- Existing daily rates are converted once using the pharmacy's 27-day month.
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC NOT NULL DEFAULT 0;

UPDATE public.employees
SET monthly_salary = GREATEST(COALESCE(daily_rate, 0), 0) * 27
WHERE COALESCE(monthly_salary, 0) = 0
  AND COALESCE(daily_rate, 0) > 0;

ALTER TABLE public.employees
DROP CONSTRAINT IF EXISTS employees_monthly_salary_nonnegative;

ALTER TABLE public.employees
ADD CONSTRAINT employees_monthly_salary_nonnegative
CHECK (monthly_salary >= 0);
