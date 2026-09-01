const fs = require('fs');
const path = require('path');

describe('product stock limits migration', () => {
    test('adds nullable validated limits in base stock units', () => {
        const migration = fs.readFileSync(
            path.join(process.cwd(), 'supabase/migrations/099_add_sku_stock_limits.sql'),
            'utf8'
        );
        expect(migration).toMatch(/add column if not exists min_stock_quantity numeric/i);
        expect(migration).toMatch(/add column if not exists max_stock_quantity numeric/i);
        expect(migration).toMatch(/min_stock_quantity is null or min_stock_quantity >= 0/i);
        expect(migration).toMatch(/max_stock_quantity >= min_stock_quantity/i);
        expect(migration).toMatch(/optional minimum stock threshold/i);
        expect(migration).toMatch(/save_product_variant_with_limits_atomic/i);
        expect(migration).toMatch(/save_product_variant_atomic\(p_payload\)/i);
        expect(migration).toMatch(/same database transaction/i);
    });
});
