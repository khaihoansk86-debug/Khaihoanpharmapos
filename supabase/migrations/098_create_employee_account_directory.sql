-- Safe account directory for the shared POS account switcher.
-- Payroll-bearing employee rows remain protected by the 079 RLS policy.

CREATE OR REPLACE FUNCTION public.get_employee_account_directory()
RETURNS TABLE (
    id UUID,
    name TEXT,
    username TEXT,
    role TEXT,
    status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        employee.id,
        employee.name,
        employee.username,
        employee.role,
        employee.status
    FROM public.employees employee
    WHERE public.current_employee_id() IS NOT NULL
      AND employee.status = 'active'
      AND NULLIF(BTRIM(employee.username), '') IS NOT NULL
    ORDER BY employee.name;
$$;

REVOKE ALL ON FUNCTION public.get_employee_account_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_employee_account_directory() TO authenticated;
