-- Salary and payroll data are private: admins see all, employees see self.

CREATE OR REPLACE FUNCTION public.current_employee_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.employees employee
        WHERE employee.auth_user_id = auth.uid()
          AND employee.status = 'active'
          AND employee.role = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.current_employee_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_employee_is_admin() TO authenticated;

-- Non-admin screens only need names for shift attribution and selectors.
CREATE OR REPLACE FUNCTION public.get_employee_directory()
RETURNS TABLE (
    id UUID,
    name TEXT,
    status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT employee.id, employee.name, employee.status
    FROM public.employees employee
    WHERE public.current_employee_id() IS NOT NULL
      AND employee.status = 'active'
    ORDER BY employee.name;
$$;

REVOKE ALL ON FUNCTION public.get_employee_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_employee_directory() TO authenticated;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth bridge employees" ON public.employees;
DROP POLICY IF EXISTS "Allow authenticated delete employees" ON public.employees;
DROP POLICY IF EXISTS "Allow anon read employees" ON public.employees;
DROP POLICY IF EXISTS "Allow anon insert employees" ON public.employees;
DROP POLICY IF EXISTS "Allow anon update employees" ON public.employees;
DROP POLICY IF EXISTS "Allow anon delete employees" ON public.employees;

CREATE POLICY "Employees read admin or self"
    ON public.employees
    FOR SELECT TO authenticated
    USING (
        public.current_employee_is_admin()
        OR id = public.current_employee_id()
    );

CREATE POLICY "Employees insert admin"
    ON public.employees
    FOR INSERT TO authenticated
    WITH CHECK (public.current_employee_is_admin());

CREATE POLICY "Employees update admin"
    ON public.employees
    FOR UPDATE TO authenticated
    USING (public.current_employee_is_admin())
    WITH CHECK (public.current_employee_is_admin());

CREATE POLICY "Employees delete admin"
    ON public.employees
    FOR DELETE TO authenticated
    USING (public.current_employee_is_admin());

REVOKE ALL ON public.employees FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;

ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth bridge employee shifts" ON public.employee_shifts;
DROP POLICY IF EXISTS "Allow anon read employee_shifts" ON public.employee_shifts;
DROP POLICY IF EXISTS "Allow anon insert employee_shifts" ON public.employee_shifts;
DROP POLICY IF EXISTS "Allow anon update employee_shifts" ON public.employee_shifts;
DROP POLICY IF EXISTS "Allow anon delete employee_shifts" ON public.employee_shifts;

CREATE POLICY "Employee shifts read authorized scope"
    ON public.employee_shifts
    FOR SELECT TO authenticated
    USING (
        public.current_employee_is_admin()
        OR public.current_employee_has_permission('manage_shifts')
        OR employee_id = public.current_employee_id()
    );

CREATE POLICY "Employee shifts insert authorized scope"
    ON public.employee_shifts
    FOR INSERT TO authenticated
    WITH CHECK (
        public.current_employee_is_admin()
        OR public.current_employee_has_permission('manage_shifts')
        OR employee_id = public.current_employee_id()
    );

CREATE POLICY "Employee shifts update authorized scope"
    ON public.employee_shifts
    FOR UPDATE TO authenticated
    USING (
        public.current_employee_is_admin()
        OR public.current_employee_has_permission('manage_shifts')
        OR employee_id = public.current_employee_id()
    )
    WITH CHECK (
        public.current_employee_is_admin()
        OR public.current_employee_has_permission('manage_shifts')
        OR employee_id = public.current_employee_id()
    );

CREATE POLICY "Employee shifts delete managers"
    ON public.employee_shifts
    FOR DELETE TO authenticated
    USING (
        public.current_employee_is_admin()
        OR public.current_employee_has_permission('manage_shifts')
    );

REVOKE ALL ON public.employee_shifts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_shifts TO authenticated;

ALTER TABLE public.employee_payroll_period_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payroll period settings read"
    ON public.employee_payroll_period_settings;
DROP POLICY IF EXISTS "Payroll period settings insert"
    ON public.employee_payroll_period_settings;
DROP POLICY IF EXISTS "Payroll period settings update"
    ON public.employee_payroll_period_settings;
DROP POLICY IF EXISTS "Payroll period settings delete"
    ON public.employee_payroll_period_settings;

CREATE POLICY "Payroll period settings read admin or self"
    ON public.employee_payroll_period_settings
    FOR SELECT TO authenticated
    USING (
        public.current_employee_is_admin()
        OR employee_id = public.current_employee_id()
    );

CREATE POLICY "Payroll period settings insert admin"
    ON public.employee_payroll_period_settings
    FOR INSERT TO authenticated
    WITH CHECK (public.current_employee_is_admin());

CREATE POLICY "Payroll period settings update admin"
    ON public.employee_payroll_period_settings
    FOR UPDATE TO authenticated
    USING (public.current_employee_is_admin())
    WITH CHECK (public.current_employee_is_admin());

CREATE POLICY "Payroll period settings delete admin"
    ON public.employee_payroll_period_settings
    FOR DELETE TO authenticated
    USING (public.current_employee_is_admin());

REVOKE ALL ON public.employee_payroll_period_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.employee_payroll_period_settings TO authenticated;
