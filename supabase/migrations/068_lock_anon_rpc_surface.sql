-- 068_lock_anon_rpc_surface.sql
-- Second lockdown stage: remove the default Postgres function EXECUTE grant
-- from unauthenticated callers, then explicitly keep only the migration login,
-- bot inventory and token-validated desktop-sync entry points.

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.authenticate_employee_legacy(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.bot_generate_daily_inventory_tasks() TO anon;
GRANT EXECUTE ON FUNCTION public.bot_get_daily_inventory_tasks(DATE) TO anon;
GRANT EXECUTE ON FUNCTION public.is_valid_desktop_sync() TO anon;

-- Desktop sync is authenticated independently by x-sync-token inside its RLS
-- policies. Restore only the operations those policies explicitly guard.
GRANT INSERT, UPDATE ON public.ads_exports TO anon;
GRANT INSERT, UPDATE ON public.ads_plans TO anon;
GRANT INSERT ON public.sync_logs TO anon;
