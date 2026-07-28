-- 071_retire_legacy_employee_auth.sql
-- All active employee accounts are linked to Supabase Auth. Retire the
-- SHA-256 legacy credential bridge from browser and signed-in client roles.

REVOKE EXECUTE ON FUNCTION public.authenticate_employee_legacy(TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.authenticate_employee_legacy(TEXT, TEXT)
    TO service_role;
