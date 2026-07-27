const fs = require('fs');
const path = require('path');

describe('Hapacol packaging migration', () => {
    const sql = fs.readFileSync(
        path.join(process.cwd(), 'supabase/migrations/056_add_product_dosage_form_and_hapacol_packaging.sql'),
        'utf8'
    );

    test('adds clinical grouping metadata without merging physical SKUs', () => {
        expect(sql).toMatch(/add column if not exists dosage_form text/i);
        expect(sql).toMatch(/idx_products_parent_clinical_variant/i);
        expect(sql).toMatch(/product_code\s*=\s*'SP000910'/i);
        expect(sql).toMatch(/Hộp 10 vỉ × 5 viên/i);
        expect(sql).toMatch(/product_code\s*=\s*'SP187965'/i);
        expect(sql).toMatch(/Hộp 10 vỉ × 10 viên/i);
        expect(sql).not.toMatch(/update\s+public\.product_batches/i);
        expect(sql).not.toMatch(/update\s+public\.product_units/i);
    });
});
