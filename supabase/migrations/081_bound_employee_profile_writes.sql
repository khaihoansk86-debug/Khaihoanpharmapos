-- Complete the safe employee profile write grant and mirror browser validation.
-- This does not change any salary or commission formula.
GRANT INSERT (updated_at) ON public.employees TO authenticated;

ALTER TABLE public.employees
    DROP CONSTRAINT IF EXISTS employees_daily_rate_bounds,
    DROP CONSTRAINT IF EXISTS employees_commission_rate_bounds,
    DROP CONSTRAINT IF EXISTS employees_monthly_salary_upper_bound,
    DROP CONSTRAINT IF EXISTS employees_monthly_allowance_upper_bound;

ALTER TABLE public.employees
    ADD CONSTRAINT employees_daily_rate_bounds
        CHECK (daily_rate >= 0 AND daily_rate <= 1000000000000),
    ADD CONSTRAINT employees_commission_rate_bounds
        CHECK (commission_rate >= 0 AND commission_rate <= 100),
    ADD CONSTRAINT employees_monthly_salary_upper_bound
        CHECK (monthly_salary <= 1000000000000),
    ADD CONSTRAINT employees_monthly_allowance_upper_bound
        CHECK (monthly_allowance <= 1000000000000);
