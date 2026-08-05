const fs = require('fs');
const path = require('path');

describe('product business status transition UI', () => {
    const controller = fs.readFileSync(
        path.join(process.cwd(), 'js/features/products/productController.js'),
        'utf8'
    );
    const productUI = fs.readFileSync(
        path.join(process.cwd(), 'js/features/products/productUI.js'),
        'utf8'
    );

    test('refreshes through the defined catalog loader after status update', () => {
        expect(controller).not.toContain('await loadProducts();');
        expect(controller).toContain('await syncProductsBackground();');
    });

    test('moves the updated product to the matching status view immediately', () => {
        expect(controller).toContain('applyProductBusinessStatus(');
        expect(controller).toContain('filterProductStatusView(');
        expect(controller).toContain("window.setProductsStatusView(newStatus ? 'active' : 'inactive')");
        expect(controller).toContain('setupSearch(filtered);');
    });

    test('keeps actions visible for discontinued products', () => {
        expect(productUI).toContain('${actionVisibilityClass} transition-opacity duration-200');
    });
});
