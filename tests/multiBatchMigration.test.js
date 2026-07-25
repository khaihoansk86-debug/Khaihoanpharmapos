const fs = require('fs');
const path = require('path');

describe('multi-batch POS migration', () => {
    const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '053_create_multi_batch_pos_checkout.sql'
    );

    test('persists immutable allocation snapshots and atomically consumes FEFO batches', () => {
        const migration = fs.readFileSync(migrationPath, 'utf8');

        expect(migration).toMatch(/add column if not exists batch_allocations jsonb/i);
        expect(migration).toMatch(/create or replace function public\.create_pos_order_atomic/i);
        expect(migration).toMatch(/for update/i);
        expect(migration).toMatch(/order by[\s\S]*expiry_date/i);
        expect(migration).toMatch(/least\s*\(/i);
        expect(migration).toMatch(/batch_allocations/i);
        expect(migration).toMatch(/cost_price_snapshot/i);
        expect(migration).toMatch(/INSUFFICIENT_TOTAL_BATCH_STOCK/i);
    });

    test('upgrades mixed combo checkout so its standard lines can also span lots', () => {
        const migration = fs.readFileSync(migrationPath, 'utf8');

        expect(migration).toMatch(/create_pos_combo_order_atomic/i);
        expect(migration).toMatch(/pg_get_functiondef/i);
        expect(migration).toMatch(/standard[\s\S]*batch_allocations/i);
        expect(migration).toMatch(/CASE WHEN batch\.id = v_demand\.preferred_batch_id/i);
    });
});
