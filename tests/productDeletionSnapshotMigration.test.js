const fs = require('fs');
const path = require('path');

describe('deleted product document snapshots', () => {
    const migration020 = fs.readFileSync(
        path.join(process.cwd(), 'supabase/migrations/020_snapshot_deleted_products.sql'),
        'utf8'
    );
    const migration087Path = path.join(
        process.cwd(),
        'supabase/migrations/087_snapshot_deleted_products_in_ecommerce_returns.sql'
    );
    const inventoryController = fs.readFileSync(
        path.join(process.cwd(), 'js/features/inventory/inventoryController.js'),
        'utf8'
    );

    test('keeps legacy inventory document identity after catalog deletion', () => {
        expect(migration020).toMatch(/add column if not exists product_name text/i);
        expect(migration020).toMatch(/add column if not exists product_code text/i);
        expect(migration020).toMatch(/foreign key \(product_id\)[\s\S]*on delete set null/i);
        expect(inventoryController).toContain('Đã xóa khỏi hàng hóa');
    });

    test('extends the same snapshot contract to ecommerce return documents', () => {
        expect(fs.existsSync(migration087Path)).toBe(true);
        const migration087 = fs.readFileSync(migration087Path, 'utf8');
        expect(migration087).toMatch(/ecommerce_return_items[\s\S]*product_id drop not null/i);
        expect(migration087).toMatch(/ecommerce_return_items[\s\S]*batch_id drop not null/i);
        expect(migration087).toMatch(/foreign key \(product_id\)[\s\S]*on delete set null/i);
        expect(migration087).toMatch(/foreign key \(batch_id\)[\s\S]*on delete set null/i);
    });
});
