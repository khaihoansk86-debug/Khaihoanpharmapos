const fs = require('fs');
const path = require('path');

const readMigration = name => fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations', name),
    'utf8'
);

describe('inventory data repairs', () => {
    test('repairs only verified unit costs and zero-valued snapshots', () => {
        const migration = readMigration('083_repair_inventory_cost_snapshots.sql');

        expect(migration).toContain("'SP000886'::TEXT, 250::NUMERIC");
        expect(migration).toContain("'SP0007480'::TEXT, 500::NUMERIC");
        expect(migration).toContain("'SP001243'::TEXT, 1060::NUMERIC");
        expect(migration).toMatch(/batch\.stock_quantity > 0/i);
        expect(migration).toMatch(/coalesce\(batch\.cost_price, 0\) <= 0/i);
        expect(migration).toMatch(/movement\.movement_type = 'internal_use'/i);
    });

    test('rebuilds missing stocktake lines from their bounded movement windows', () => {
        const migration = readMigration('084_backfill_stocktake_document_lines.sql');

        expect(migration).toMatch(/NOT EXISTS[\s\S]*inventory_document_items/i);
        expect(migration).toMatch(/movement\.document_id IS NULL/i);
        expect(migration).toContain("interval '15 minutes'");
        expect(migration).toMatch(/INSERT INTO public\.inventory_document_items/i);
        expect(migration).toMatch(/UPDATE public\.inventory_movements/i);
    });
});
