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

    test('never replaces a status-tab search source with the full catalog', () => {
        expect(controller).not.toContain('setupSearch(window.currentProductsList);');
    });

    test('clears the previous search before rendering a newly selected status tab', () => {
        const handlerStart = controller.indexOf('window.setProductsStatusView =');
        const handlerEnd = controller.indexOf('window.focusProductForAI', handlerStart);
        const statusViewHandler = controller.slice(handlerStart, handlerEnd);

        expect(statusViewHandler).toContain('resetProductSearchForStatusChange();');
        expect(statusViewHandler.indexOf('resetProductSearchForStatusChange();'))
            .toBeLessThan(statusViewHandler.indexOf('window.applyFilters();'));
    });

    test('does not offer manual product creation in an empty inactive tab', () => {
        expect(productUI).toContain("import { getProductEmptyState } from './productStatusRules.js';");
        expect(productUI).toContain('const createActionHtml = emptyState.allowCreate');
        expect(controller).toContain('syncProductCreateControls(normalizedView);');
        expect(controller).toContain("if (!canCreateProductInStatusView(window.currentProductStatusView))");
    });

    test('removes a deleted inactive product without restoring it from cache', () => {
        const handlerStart = controller.indexOf('window.deleteProduct =');
        const handlerEnd = controller.indexOf('window.quickIssueInactiveProductStock', handlerStart);
        const deleteHandler = controller.slice(handlerStart, handlerEnd);

        expect(deleteHandler).toContain(".select('id')");
        expect(deleteHandler).toContain('removeProductFromCatalog(');
        expect(deleteHandler).not.toContain('loadProductsData();');
    });

    test('keeps actions visible for discontinued products', () => {
        expect(productUI).toContain('${actionVisibilityClass} transition-opacity duration-200');
    });
});
