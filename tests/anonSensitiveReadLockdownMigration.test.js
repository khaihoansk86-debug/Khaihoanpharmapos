const fs = require('fs');
const path = require('path');

describe('anonymous sensitive-read lockdown migration', () => {
    const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '069_revoke_anon_sensitive_reads.sql'
    );

    test('revokes anonymous reads from business and identity tables', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        const sensitiveTables = [
            'branch_settings',
            'cashbook_transactions',
            'customer_groups',
            'customers',
            'ecommerce_return_items',
            'ecommerce_returns',
            'employee_shifts',
            'employees',
            'order_items',
            'orders',
            'purchase_order_items',
            'purchase_orders',
            'sepay_webhooks',
            'suppliers'
        ];

        sensitiveTables.forEach(table => {
            expect(sql).toMatch(new RegExp(
                `REVOKE SELECT ON public\\.${table} FROM anon`,
                'i'
            ));
        });
    });

    test('does not break the current read-only bot and desktop sync bridge', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        [
            'products',
            'product_units',
            'product_batches',
            'inventory_documents',
            'inventory_movements',
            'bot_daily_inventory_tasks',
            'daily_inventory_tasks',
            'ads_exports',
            'ads_plans',
            'sync_logs',
            'sync_settings'
        ].forEach(table => {
            expect(sql).not.toMatch(new RegExp(
                `REVOKE SELECT ON public\\.${table} FROM anon`,
                'i'
            ));
        });
    });

    test('prevents future tables from becoming publicly readable by default', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        expect(sql).toMatch(
            /ALTER DEFAULT PRIVILEGES[\s\S]*REVOKE SELECT ON TABLES FROM anon/i
        );
    });
});
