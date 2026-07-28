const fs = require('fs');
const path = require('path');

describe('anonymous RPC lockdown migration', () => {
    const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '068_lock_anon_rpc_surface.sql'
    );

    test('removes default anonymous function execution and preserves signed-in/server access', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        expect(sql).toMatch(
            /REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC,\s*anon/i
        );
        expect(sql).toMatch(
            /GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated,\s*service_role/i
        );
        expect(sql).toMatch(
            /ALTER DEFAULT PRIVILEGES[\s\S]*REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,\s*anon/i
        );
    });

    test('whitelists only login, bot inventory and token-validated desktop sync RPCs for anon', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        [
            'authenticate_employee_legacy\\(TEXT, TEXT\\)',
            'bot_generate_daily_inventory_tasks\\(\\)',
            'bot_get_daily_inventory_tasks\\(DATE\\)',
            'is_valid_desktop_sync\\(\\)'
        ].forEach(signature => {
            expect(sql).toMatch(new RegExp(
                `GRANT EXECUTE ON FUNCTION public\\.${signature} TO anon`,
                'i'
            ));
        });

        [
            'create_pos_order_atomic',
            'create_pos_combo_order_atomic',
            'create_ecommerce_return',
            'cancel_ecommerce_return',
            'delete_employee_profile',
            'save_product_variant_atomic',
            'save_combo_catalog_atomic',
            'archive_combo_catalog_atomic'
        ].forEach(functionName => {
            expect(sql).not.toMatch(new RegExp(
                `GRANT EXECUTE[\\s\\S]*?${functionName}[\\s\\S]*?TO anon`,
                'i'
            ));
        });
    });

    test('restores only token-guarded desktop sync table writes for anon', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        expect(sql).toMatch(/GRANT INSERT, UPDATE ON public\.ads_exports TO anon/i);
        expect(sql).toMatch(/GRANT INSERT, UPDATE ON public\.ads_plans TO anon/i);
        expect(sql).toMatch(/GRANT INSERT ON public\.sync_logs TO anon/i);
        expect(sql).not.toMatch(/GRANT[\s\S]*ON public\.(orders|employees|products)\s+TO anon/i);
    });
});
