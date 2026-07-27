-- 066_add_authenticated_employee_profile.sql
-- Return the employee profile bound to the verified Supabase Auth JWT.
-- Password hashes and technical auth identifiers are intentionally excluded.

CREATE OR REPLACE FUNCTION public.get_current_employee_profile()
RETURNS TABLE (
    id UUID,
    name TEXT,
    username TEXT,
    role TEXT,
    status TEXT,
    permissions JSONB
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
        employee.status,
        COALESCE(employee.permissions, '[]'::JSONB)
    FROM public.employees employee
    WHERE employee.auth_user_id = auth.uid()
      AND employee.status = 'active'
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_current_employee_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_current_employee_profile() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_current_employee_profile() TO authenticated;
