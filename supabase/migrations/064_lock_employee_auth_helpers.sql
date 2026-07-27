-- 064_lock_employee_auth_helpers.sql
-- Default function privileges in this legacy project can grant EXECUTE directly
-- to anon. These identity helpers are only meaningful for an authenticated JWT.

REVOKE ALL ON FUNCTION public.current_employee_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_employee_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_employee_id() TO authenticated;

REVOKE ALL ON FUNCTION public.current_employee_has_permission(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_employee_has_permission(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.current_employee_has_permission(TEXT)
    TO authenticated;
