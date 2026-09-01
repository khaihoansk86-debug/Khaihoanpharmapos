const fs = require('fs');
const path = require('path');

describe('SKU stock limit persistence contract', () => {
    const service = fs.readFileSync(
        path.join(process.cwd(), 'js/features/products/productVariantPersistenceService.js'),
        'utf8'
    );
    const migration = fs.readFileSync(
        path.join(process.cwd(), 'supabase/migrations/099_add_sku_stock_limits.sql'),
        'utf8'
    );

    test('uses one RPC transaction for the SKU and its limits', () => {
        expect(service).toContain("rpc('save_product_variant_with_limits_atomic'");
        expect(service).not.toContain("from('products')");
        expect(migration).toContain('public.save_product_variant_atomic(p_payload)');
        expect(migration).toContain('UPDATE public.products');
    });

    test('never writes limits to a product-group payload', () => {
        const controller = fs.readFileSync(
            path.join(process.cwd(), 'js/features/products/productController.js'),
            'utf8'
        );
        expect(controller).toContain('min_stock_quantity: hasVariants ? null');
        expect(controller).toContain('max_stock_quantity: hasVariants ? null');
    });
});
