const fs = require('fs');
const path = require('path');

describe('Zalo stocktake completion notification migration', () => {
    test('queues one deduplicated notification for each confirmed stocktake', () => {
        const migration = fs.readFileSync(
            path.join(process.cwd(), 'supabase/migrations/096_create_zalo_stocktake_notifications.sql'),
            'utf8'
        );

        expect(migration).toMatch(/notify_stocktake_document/);
        expect(migration).toMatch(/NEW\.document_type = 'stocktake_adjustment'/);
        expect(migration).toMatch(/NEW\.status = 'confirmed'/);
        expect(migration).toMatch(/OLD\.status IS DISTINCT FROM 'confirmed'/);
        expect(migration).toMatch(/stocktake_document:' \|\| NEW\.id::TEXT/);
        expect(migration).toMatch(/ON CONFLICT \(dedupe_key\)/);
        expect(migration).toMatch(/tr_queue_confirmed_stocktake_for_zalo/);
    });
});
