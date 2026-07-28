const fs = require('fs');
const path = require('path');

describe('anonymous catalog and inventory lockdown migration', () => {
    const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '070_revoke_anon_catalog_inventory_reads.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    test('revokes every remaining anonymous table read and keeps the default closed', () => {
        expect(sql).toMatch(
            /REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon/i
        );
        expect(sql).toMatch(
            /ALTER DEFAULT PRIVILEGES[\s\S]*REVOKE SELECT ON TABLES FROM anon/i
        );
    });

    test('removes anonymous execution of the two bot inventory RPCs', () => {
        expect(sql).toMatch(
            /REVOKE EXECUTE ON FUNCTION public\.bot_generate_daily_inventory_tasks\(\)\s+FROM anon/i
        );
        expect(sql).toMatch(
            /REVOKE EXECUTE ON FUNCTION public\.bot_get_daily_inventory_tasks\(DATE\)\s+FROM anon/i
        );
    });

    test('removes the legacy anonymous task read policies', () => {
        expect(sql).toMatch(
            /DROP POLICY IF EXISTS "Allow anon select daily tasks"\s+ON public\.daily_inventory_tasks/i
        );
        expect(sql).toMatch(
            /DROP POLICY IF EXISTS "Allow anon select bot daily tasks"\s+ON public\.bot_daily_inventory_tasks/i
        );
    });

    test('does not alter legacy login or desktop-sync access', () => {
        expect(sql).not.toMatch(/authenticate_employee_legacy/i);
        expect(sql).not.toMatch(/ads_exports|ads_plans|sync_logs/i);
    });
});
