-- Preserve salary, allowance and commission contracts independently per month.
CREATE TABLE IF NOT EXISTS public.employee_payroll_period_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    payroll_month DATE NOT NULL,
    monthly_salary NUMERIC NOT NULL CHECK (monthly_salary >= 0),
    monthly_allowance NUMERIC NOT NULL DEFAULT 0 CHECK (monthly_allowance >= 0),
    commission_rate NUMERIC NOT NULL DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    note TEXT NULL CHECK (char_length(note) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE (employee_id, payroll_month),
    CHECK (payroll_month = date_trunc('month', payroll_month)::date)
);

CREATE INDEX IF NOT EXISTS idx_employee_payroll_period_settings_month
    ON public.employee_payroll_period_settings(payroll_month, employee_id);

CREATE OR REPLACE FUNCTION public.set_employee_payroll_period_audit_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at := now();
    NEW.updated_by := auth.uid();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_employee_payroll_period_audit_fields
    ON public.employee_payroll_period_settings;
CREATE TRIGGER set_employee_payroll_period_audit_fields
    BEFORE INSERT OR UPDATE ON public.employee_payroll_period_settings
    FOR EACH ROW EXECUTE FUNCTION public.set_employee_payroll_period_audit_fields();

ALTER TABLE public.employee_payroll_period_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payroll period settings read" ON public.employee_payroll_period_settings;
CREATE POLICY "Payroll period settings read"
    ON public.employee_payroll_period_settings
    FOR SELECT TO authenticated
    USING (
        public.current_employee_has_permission('access_payroll')
        OR public.current_employee_has_permission('access_employees')
    );

DROP POLICY IF EXISTS "Payroll period settings insert" ON public.employee_payroll_period_settings;
CREATE POLICY "Payroll period settings insert"
    ON public.employee_payroll_period_settings
    FOR INSERT TO authenticated
    WITH CHECK (public.current_employee_has_permission('access_employees'));

DROP POLICY IF EXISTS "Payroll period settings update" ON public.employee_payroll_period_settings;
CREATE POLICY "Payroll period settings update"
    ON public.employee_payroll_period_settings
    FOR UPDATE TO authenticated
    USING (public.current_employee_has_permission('access_employees'))
    WITH CHECK (public.current_employee_has_permission('access_employees'));

DROP POLICY IF EXISTS "Payroll period settings delete" ON public.employee_payroll_period_settings;
CREATE POLICY "Payroll period settings delete"
    ON public.employee_payroll_period_settings
    FOR DELETE TO authenticated
    USING (public.current_employee_has_permission('access_employees'));

REVOKE ALL ON public.employee_payroll_period_settings FROM anon;
GRANT SELECT ON public.employee_payroll_period_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.employee_payroll_period_settings TO authenticated;

COMMENT ON TABLE public.employee_payroll_period_settings IS
    'Immutable-by-period compensation inputs used by the existing payroll formula.';
