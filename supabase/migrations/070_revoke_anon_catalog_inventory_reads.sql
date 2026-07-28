-- 070_revoke_anon_catalog_inventory_reads.sql
-- Final anonymous read lockdown after the local Zalo bot was moved to a
-- server-only service-role key. Signed-in POS users and service processes
-- retain their existing access; token-validated desktop-sync writes are not
-- changed by this migration.

REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE SELECT ON TABLES FROM anon;

REVOKE EXECUTE ON FUNCTION public.bot_generate_daily_inventory_tasks()
    FROM anon;
REVOKE EXECUTE ON FUNCTION public.bot_get_daily_inventory_tasks(DATE)
    FROM anon;

-- Remove the two explicit bot-era read policies as defense in depth. Table
-- privileges above are still the primary barrier for any other legacy policy.
DROP POLICY IF EXISTS "Allow anon select daily tasks"
    ON public.daily_inventory_tasks;
DROP POLICY IF EXISTS "Allow anon select bot daily tasks"
    ON public.bot_daily_inventory_tasks;
