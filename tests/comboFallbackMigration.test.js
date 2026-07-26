const fs = require('fs');
const path = require('path');

describe('combo fallback batch allocation migration', () => {
    const migration = fs.readFileSync(
        path.join(
            process.cwd(),
            'supabase/migrations/057_coalesce_order_item_batch_allocations.sql'
        ),
        'utf8'
    );

    test('coalesces transport-level null allocations before order item constraints run', () => {
        expect(migration).toMatch(
            /NEW\.batch_allocations\s*:=\s*COALESCE\(NEW\.batch_allocations,\s*'\[\]'::jsonb\)/
        );
        expect(migration).toMatch(/BEFORE INSERT OR UPDATE OF batch_allocations/);
        expect(migration).toMatch(/ON public\.order_items/);
    });
});
