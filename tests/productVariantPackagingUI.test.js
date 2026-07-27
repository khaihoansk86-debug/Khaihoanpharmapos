const fs = require('fs');
const path = require('path');

describe('product variant packaging UI', () => {
    const productPage = fs.readFileSync(path.join(process.cwd(), 'pages/products.html'), 'utf8');
    const productUI = fs.readFileSync(path.join(process.cwd(), 'js/features/products/productUI.js'), 'utf8');
    const productController = fs.readFileSync(path.join(process.cwd(), 'js/features/products/productController.js'), 'utf8');
    const posController = fs.readFileSync(path.join(process.cwd(), 'js/features/pos/posController.js'), 'utf8');

    test('captures clinical identity and calculates package conversion', () => {
        expect(productPage).toContain('id="add_dosage_form"');
        expect(productController).toMatch(
            /dosage_form:\s*hasVariants\s*\?\s*null\s*:\s*\(document\.getElementById\('add_dosage_form'\)/
        );
        expect(productUI).toContain("buildPackagingPlan");
        expect(productUI).toContain("inline_inner_count_");
        expect(productUI).toContain("inline_base_per_inner_");
        expect(productUI).toContain("inline_packaging_preview_");
        expect(productUI).toMatch(/packaging_spec:\s*packagingPlan\.packagingSpec/);
        expect(productUI).toMatch(/packagingPlan\.units\.map/);
    });

    test('groups physical SKUs by clinical variant and searches child packaging', () => {
        expect(posController).toContain('groupVariantsByClinicalIdentity');
        expect(posController).toContain('buildParentVariantSearchText');
        expect(posController).toContain('variant.packaging_spec');
        expect(posController).toContain('variantsByParent');
        expect(productUI).toContain('clinicalGroupByVariantId');
        expect(productUI).toContain('v.packaging_spec');
    });

    test('shows management-friendly packaging, converted stock and data warnings', () => {
        expect(productUI).toContain('sortClinicalVariantGroups');
        expect(productUI).toContain('buildStockBreakdown');
        expect(productUI).toContain('SKU / Barcode');
        expect(productUI).toContain('Giá bán theo đơn vị');
        expect(productUI).toContain('Tồn quy đổi');
        expect(productUI).toContain('stockDisplay.breakdownLabel');
        expect(productUI).toContain('lô có tồn thiếu giá vốn');
        expect(productUI).toContain('overflow-x-auto');
    });
});
