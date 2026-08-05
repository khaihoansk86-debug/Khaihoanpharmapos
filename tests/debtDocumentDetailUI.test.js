const fs = require('fs');
const path = require('path');

describe('debt document detail interaction', () => {
    const controller = fs.readFileSync(
        path.join(process.cwd(), 'js/features/pos/invoicesController.js'),
        'utf8'
    );
    const page = fs.readFileSync(
        path.join(process.cwd(), 'pages/invoices.html'),
        'utf8'
    );

    test('opens the source document from a supplier debt row', () => {
        expect(controller).toContain('data-action="view-supplier-debt-document"');
        expect(controller).toContain("'view-supplier-debt-document': () => {");
        expect(controller).toContain('openSupplierDebtDocumentDetail(');
    });

    test('loads both the document header and its persisted item snapshots', () => {
        expect(controller).toContain('async function openSupplierDebtDocumentDetail');
        expect(controller).toContain(".from('inventory_documents')");
        expect(controller).toContain(".from('inventory_document_items')");
        expect(controller).toContain("item.products?.name || item.product_name || 'Sản phẩm đã xóa'");
        expect(controller).toContain('Đã xóa khỏi hàng hóa');
    });

    test('only requests supplier columns that exist in the deployed schema', () => {
        expect(controller).toContain(".select('name, supplier_code')");
        expect(controller).not.toContain(".select('name, supplier_code, phone')");
    });

    test('provides loading, error and content states in the detail modal', () => {
        expect(page).toContain('id="supplierDebtDetailModal"');
        expect(page).toContain('id="supplierDebtDetailLoading"');
        expect(page).toContain('id="supplierDebtDetailError"');
        expect(page).toContain('id="supplierDebtDetailContent"');
        expect(page).toContain('id="supplierDebtDetailItems"');
    });
});
