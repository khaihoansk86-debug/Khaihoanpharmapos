const fs = require('fs');

describe('atomic combo checkout migration contract', () => {
    const migration = fs.readFileSync(
        'supabase/migrations/052_create_atomic_combo_checkout.sql',
        'utf8'
    );

    test('persists component cost and exact batch snapshots', () => {
        expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS cost_price_snapshot/i);
        expect(migration).toMatch(/line_type[\s\S]*'combo_component'/i);
        expect(migration).toMatch(/v_allocation\.batch_id/i);
        expect(migration).toMatch(/v_allocation\.cost_price/i);
    });

    test('locks stock, allocates FEFO, and rejects insufficient combo stock atomically', () => {
        expect(migration).toMatch(/ORDER BY batch\.id[\s\S]*FOR UPDATE/i);
        expect(migration).toMatch(/ORDER BY expiry_date ASC NULLS LAST, id/i);
        expect(migration).toMatch(/INSUFFICIENT_COMBO_COMPONENT_STOCK/i);
        expect(migration).toMatch(/pg_advisory_xact_lock/i);
    });

    test('replays a completed idempotent order without deducting stock again', () => {
        const replayIndex = migration.indexOf("'idempotent_replay', true");
        const deductionIndex = migration.indexOf('SET stock_quantity = stock_quantity -');
        expect(replayIndex).toBeGreaterThan(0);
        expect(deductionIndex).toBeGreaterThan(replayIndex);
    });
});
