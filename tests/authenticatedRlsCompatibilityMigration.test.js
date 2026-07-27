const fs = require('fs');
const path = require('path');

describe('authenticated RLS compatibility migration', () => {
    const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '065_add_authenticated_compatibility_policies.sql'
    );

    test('preserves the POS operations that were previously available to anon', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        const expectedPolicies = {
            bot_daily_inventory_tasks: ['SELECT'],
            branch_settings: ['SELECT', 'INSERT', 'UPDATE'],
            cashbook_transactions: ['SELECT', 'INSERT', 'UPDATE'],
            daily_inventory_tasks: ['SELECT'],
            device_sync_status: ['SELECT', 'INSERT', 'UPDATE'],
            employee_shifts: ['ALL'],
            employees: ['ALL'],
            order_items: ['SELECT', 'INSERT', 'DELETE'],
            orders: ['ALL'],
            purchase_order_items: ['SELECT', 'INSERT'],
            purchase_orders: ['SELECT', 'INSERT', 'UPDATE']
        };

        Object.entries(expectedPolicies).forEach(([table, commands]) => {
            commands.forEach(command => {
                expect(sql).toMatch(new RegExp(
                    `ON public\\.${table}[\\s\\S]*?FOR ${command}[\\s\\S]*?TO authenticated`,
                    'i'
                ));
            });
        });
    });

    test('does not revoke legacy anon access during the transition', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        expect(sql).not.toMatch(/REVOKE[\s\S]*\bFROM\s+anon\b/i);
        expect(sql).not.toMatch(/DROP POLICY[\s\S]*Allow anon/i);
    });
});
