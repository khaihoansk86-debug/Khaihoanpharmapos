const fs = require('fs');
const path = require('path');

describe('product catalog entry UI', () => {
    const productsPage = fs.readFileSync(
        path.join(process.cwd(), 'pages/products.html'),
        'utf8'
    );
    const productUI = fs.readFileSync(
        path.join(process.cwd(), 'js/features/products/productUI.js'),
        'utf8'
    );
    const productController = fs.readFileSync(
        path.join(process.cwd(), 'js/features/products/productController.js'),
        'utf8'
    );

    test('presents the four-step product and SKU workflow', () => {
        expect(productsPage).toContain('aria-label="Các bước tạo hàng hóa"');
        expect(productsPage).toContain('Tên và nhóm hàng');
        expect(productsPage).toContain('Hàm lượng và dạng');
        expect(productsPage).toContain('Quy cách và SKU');
        expect(productsPage).toContain('Giá, lô và kiểm tra');
        expect(productsPage).toContain('id="productEntryModeNotice"');
    });

    test('keeps physical identity and inventory fields out of parent mode', () => {
        expect(productUI).toContain('buildCatalogEntryPlan({ hasVariants })');
        expect(productUI).toContain("unitsSection.classList.toggle('hidden', !plan.usesPhysicalUnits)");
        expect(productUI).toContain("section3.classList.toggle('hidden', !plan.usesBatches)");
        expect(productUI).toContain("document.getElementById('productBarcodeField')?.classList.toggle('hidden', hasVariants)");
        expect((productsPage.match(/class="sku-specific-field"/g) || [])).toHaveLength(3);
        expect(productController).toContain('is_direct_sale: entryPlan.isDirectSale');
    });

    test('supports blister and direct-to-base packaging with duplicate checks', () => {
        expect(productUI).toContain('<option value="with_inner">Hộp → Vỉ → Viên</option>');
        expect(productUI).toContain('<option value="direct">Hộp → Gói/đơn vị nhỏ</option>');
        expect(productUI).toContain("document.getElementById('inline_base_per_package_' + id)");
        expect(productUI).toContain('findCatalogIdentityConflict({');
        expect(productUI).toContain("window.applyVariantPackagingPreset(tempId, 'box_10x5')");
    });

    test('reads a newly saved parent directly instead of waiting for stale cache', () => {
        expect(productController).toContain('async function fetchFreshCatalogProduct(productCode)');
        expect(productController).toContain('fetchCatalogProductSnapshot(supabaseClient, { productCode })');
        expect(productController).toContain('mergeCatalogProductSnapshot(');
        expect(productController).toContain('const createdParent = await fetchFreshCatalogProduct(productData.product_code)');
        expect(productController).not.toMatch(
            /if \(hasVariants\) \{\s*await loadProductsData\(\);\s*const createdParent/
        );
    });

    test('uses touch-friendly controls in the inline SKU editor', () => {
        expect(productUI).toMatch(/id="inline_name_\$\{tempId\}"[^>]*min-h-11/);
        expect(productUI).toMatch(/id="inline_packaging_mode_\$\{tempId\}"[^>]*min-h-11/);
        expect(productUI).toMatch(/onclick="window\.saveInlineVariant\('\$\{tempId\}'\)"[^>]*min-h-11/);
        expect(productUI).toContain('aria-label="Xóa lô này"');
    });

    test('refreshes and highlights the exact SKU after saving', () => {
        expect(productUI).toContain('const freshVariant = await fetchCatalogProductSnapshot(');
        expect(productUI).toContain('window.currentProductsList = mergeCatalogProductSnapshot(');
        expect(productUI).toContain('openAddProductModal(parentProduct)');
        expect(productUI).toContain("document.getElementById('modal_display_' + actualVariantId)");
        expect(productUI).toContain("window.matchMedia?.('(prefers-reduced-motion: reduce)').matches");
        expect(productUI).toContain('data-save-inline-variant');
        expect(productUI).toContain('ĐANG LƯU SKU...');
    });

    test('offers quick packaging presets and save-then-add-next workflow', () => {
        expect(productUI).toContain('listVariantPackagingPresets().map');
        expect(productUI).toContain('window.applyVariantPackagingPreset = function');
        expect(productUI).toContain("window.applyVariantPackagingPreset(tempId, 'box_10x5')");
        expect(productUI).toContain("window.saveInlineVariant('${tempId}', { addAnother: true })");
        expect(productUI).toContain('LƯU & THÊM SKU TIẾP');
        expect(productUI).toContain('if (addAnother) {');
        expect(productUI).toContain('window.addNewVariantInline(continuationSeed)');
    });

    test('shows a live pre-save review with unit prices and data warnings', () => {
        expect(productUI).toContain('window.updateInlineVariantDraftReview = function');
        expect(productUI).toContain('buildVariantDraftReview({');
        expect(productUI).toContain('id="inline_draft_review_${tempId}"');
        expect(productUI).toContain('aria-label="Kiểm tra SKU trước khi lưu"');
        expect(productUI).toContain('${formatCurrency(unit.costPrice)} vốn');
        expect(productUI).toContain('${formatCurrency(unit.retailPrice)} bán');
        expect(productUI).toContain('SKU sắp tạo');
        expect(productUI).toContain('${escapeHTML(warning.label)}');
    });

    test('suggests a readable SKU code while preserving manual entry', () => {
        expect(productUI).toContain('function buildInlineVariantIdentitySuggestion');
        expect(productUI).toContain('buildVariantIdentitySuggestion({');
        expect(productUI).toContain('Mã đề xuất:');
        expect(productUI).toContain('codeInput.placeholder = identitySuggestion.suggestedCode');
        expect(productUI).toContain(
            "const newCode = codeEl.value.trim() || identitySuggestion?.suggestedCode || ''"
        );
        expect(productUI).toContain('findCatalogIdentityConflict({');
    });

    test('keeps safe clinical context when creating the next packaging SKU', () => {
        expect(productUI).toContain('const continuationSeed = addAnother');
        expect(productUI).toContain('buildVariantContinuationSeed({');
        expect(productUI).toContain('window.addNewVariantInline(continuationSeed)');
        expect(productUI).toContain('window.addNewVariantInline = function(seed = null)');
        expect(productUI).toContain('Mã SKU, barcode và lô đang để trống.');
        expect(productUI).toContain("setSeedValue('inline_concentration', seed.concentration)");
        expect(productUI).toContain("setSeedValue('inline_retail', seed.baseRetail)");
    });

    test('protects a changed SKU draft from accidental cancellation', () => {
        expect(productUI).toContain('function collectInlineVariantDraft(id)');
        expect(productUI).toContain('function readInlineVariantInitialDraft(draftRoot)');
        expect(productUI).toContain('window.cancelInlineVariantDraft = function(id)');
        expect(productUI).toContain('readInlineVariantInitialDraft(draftRoot),');
        expect(productUI).toContain('collectInlineVariantDraft(id)');
        expect(productUI).toContain('SKU này đang có dữ liệu chưa lưu.');
        expect(productUI).toContain("onclick=\"window.cancelInlineVariantDraft('${tempId}')\"");
        expect(productUI).toContain('draftRoot.dataset.initialDraft = JSON.stringify(');
    });

    test('protects all changed SKU drafts when the product modal is closed by the user', () => {
        expect(productUI).toContain('export function requestCloseAddProductModal()');
        expect(productUI).toContain('function collectProductFormDraft()');
        expect(productUI).toContain('function readInitialProductFormDraft(modal)');
        expect(productUI).toContain('hasProductFormDraftChanged(');
        expect(productUI).toContain(
            'modal.dataset.initialProductDraft = JSON.stringify('
        );
        expect(productUI).toContain("!control.closest('#variantsListContainer')");
        expect(productUI).toContain("'#variantsListContainer [id^=\"modal_edit_\"]'");
        expect(productUI).toContain(
            'Thông tin hàng hóa và ${changedDraftCount} SKU đang có thay đổi chưa lưu.'
        );
        expect(productUI).toContain('Có ${changedDraftCount} SKU đang có thay đổi chưa lưu.');
        expect(productUI).toContain('window.requestCloseAddProductModal = requestCloseAddProductModal');
        expect(productController).toContain(
            "'close-add-product-modal': requestCloseAddProductModal"
        );
        expect(productController).toContain('closeAddProductModal();');
        expect(productsPage).toContain('aria-label="Đóng cửa sổ hàng hóa"');
        expect(productsPage).toMatch(
            /data-action="close-add-product-modal"[\s\S]{0,250}min-h-11 min-w-11/
        );
    });

    test('keeps keyboard focus inside the product dialog and restores it after close', () => {
        expect(productsPage).toMatch(
            /id="addProductModal"[\s\S]{0,180}role="dialog" aria-modal="true"/
        );
        expect(productsPage).toContain('aria-labelledby="addProductModalTitle"');
        expect(productsPage).toContain('tabindex="-1"');
        expect(productUI).toContain('function handleProductModalKeydown(event)');
        expect(productUI).toContain("if (event.key === 'Escape')");
        expect(productUI).toContain('requestCloseAddProductModal();');
        expect(productUI).toContain("if (event.key !== 'Tab') return;");
        expect(productUI).toContain('lastControl.focus();');
        expect(productUI).toContain('firstControl.focus();');
        expect(productUI).toContain(
            "document.addEventListener('keydown', handleProductModalKeydown)"
        );
        expect(productUI).toContain(
            "document.removeEventListener('keydown', handleProductModalKeydown)"
        );
        expect(productUI).toContain('productModalReturnFocus = document.activeElement');
        expect(productUI).toContain('requestAnimationFrame(() => focusTarget.focus())');
    });

    test('restores an existing SKU draft when edit is cancelled', () => {
        expect(productUI).toContain(
            "onclick=\"window.cancelExistingInlineVariantDraft('${v.id}')\""
        );
        expect(productUI).toContain('window.cancelExistingInlineVariantDraft = function(id)');
        expect(productUI).toContain('function restoreInlineVariantDraft(id, draft = {})');
        expect(productUI).toContain('batchId: item.querySelector(\'.batch-id\')?.value');
        expect(productUI).toContain('if (batchIdInput) batchIdInput.value = batch.batchId');
        expect(productUI).toContain('restoreInlineVariantDraft(id, initialDraft)');
        expect(productUI).toContain("draftRoot.classList.add('hidden')");
        expect(productUI).toContain('childVariants.forEach(variant => {');
        expect(productUI).toContain(
            'draftRoot.dataset.initialDraft = JSON.stringify('
        );
        expect(productUI).toContain('window.cancelExistingInlineVariantDraft(id);');
    });

    test('shows a live accessible status when product or SKU drafts change', () => {
        expect(productsPage).toContain('id="productDraftStatus"');
        expect(productsPage).toContain(
            'role="status" aria-live="polite" aria-atomic="true"'
        );
        expect(productsPage).toContain('data-product-draft-status-text');
        expect(productUI).toContain('function getUnsavedProductDraftState()');
        expect(productUI).toContain('function refreshProductDraftStatus()');
        expect(productUI).toContain(
            'Chưa lưu: thông tin + ${changedDraftCount} SKU'
        );
        expect(productUI).toContain(
            "form.addEventListener('input', handleProductDraftActivity)"
        );
        expect(productUI).toContain(
            "form.addEventListener('change', handleProductDraftActivity)"
        );
        expect(productUI).toContain(
            ").startsWith('identity-');"
        );
        expect(productUI).toContain(
            "&& (!isIdentityIssue || activity.type !== 'input')"
        );
        expect(productUI).toContain(
            'productDraftObserver.observe(form, { childList: true, subtree: true })'
        );
        expect(productUI).toContain("status.classList.toggle('hidden', !label)");
        expect(productUI).toContain('unbindProductDraftTracking();');
    });

    test('lets staff edit identity and packaging of an existing child SKU', () => {
        expect(productUI).toContain('id="inline_name_${v.id}"');
        expect(productUI).toContain('id="inline_barcode_${v.id}"');
        expect(productUI).toContain(
            "if (key === 'concentration') return `inline_concentration_${id}`"
        );
        expect(productUI).toContain(
            "if (key === 'dosage_form') return `inline_dosage_form_${id}`"
        );
        expect(productUI).toContain('data-variant-classification-key=');
        expect(productUI).toContain(
            'const identityUpdate = buildExistingVariantIdentityUpdate({'
        );
        expect(productUI).toContain(
            'saveProductVariantAtomic(window.supabase'
        );
        expect(productUI).toContain(
            'const packagingSeed = buildVariantPackagingEditorSeed(v);'
        );
        expect(productUI).toContain('id="inline_packaging_mode_${id}"');
        expect(productUI).toContain('id="inline_base_unit_${id}"');
        expect(productUI).toContain('id="inline_inner_count_${id}"');
        expect(productUI).toContain('id="inline_base_per_package_${id}"');
        expect(productUI).toContain(
            'unitRows = buildVariantUnitRows({'
        );
        expect(productUI).toContain(
            'assertSafeVariantBaseUnitChange({'
        );
        expect(productUI).toContain(
            'packaging_spec: packagingPlan?.packagingSpec || null'
        );
        expect(productUI).toContain(
            'manage_packaging: Boolean(packagingPlan)'
        );
        expect(productUI).toContain(
            'Giá vốn và giá bán của đơn vị tồn nhỏ nhất'
        );
    });

    test('lets a parent define up to two human-readable classification axes', () => {
        expect(productsPage).toContain('id="variantClassificationSection"');
        expect(productsPage).toContain('id="add_variant_axis_primary"');
        expect(productsPage).toContain('id="add_variant_axis_secondary"');
        expect(productUI).toContain('listVariantClassificationPresets()');
        expect(productUI).toContain('populateVariantClassificationPresetOptions()');
        expect(productsPage).toContain('Quy cách hộp/vỉ/gói được khai báo riêng');
        expect(productController).toContain(
            'buildVariantDefinitionsFromAxes(variantAxes)'
        );
        expect(productController).toContain(
            'variant_definitions: variantDefinitions'
        );
        expect(productUI).toContain('renderVariantClassificationFields({');
        expect(productUI).toContain(
            'variantValues: classificationPayload.variant_values'
        );
    });

    test('shows inline accessible validation and focuses the first invalid field', () => {
        expect(productsPage).toContain('id="productValidationSummary"');
        expect(productsPage).toContain(
            'role="alert" aria-live="assertive" tabindex="-1"'
        );
        expect(productsPage).toContain('data-product-validation-list');
        expect(productUI).toContain(
            'export function showProductFormValidationIssues(issues = [])'
        );
        expect(productUI).toContain('export function clearProductFormValidationIssues()');
        expect(productUI).toContain("control.setAttribute('aria-invalid', 'true')");
        expect(productUI).toContain("control.setAttribute('aria-describedby', errorId)");
        expect(productUI).toContain("error.dataset.productValidationError = 'true'");
        expect(productUI).toContain('focusProductValidationControl(focusTarget);');
        expect(productUI).toContain("window.matchMedia?.('(prefers-reduced-motion: reduce)').matches");
        expect(productsPage).toContain(
            'Bấm vào từng lỗi để chuyển nhanh đến ô cần sửa.'
        );
        expect(productUI).toContain(
            'data-product-validation-focus="${index}"'
        );
        expect(productUI).toContain(
            'list.onclick = handleProductValidationSummaryClick;'
        );
        expect(productUI).toContain(
            'function focusProductValidationControl(control)'
        );
        expect(productUI).toContain(
            'function handleProductValidationSummaryClick(event)'
        );
        expect(productUI).toContain(
            '`#addProductForm [data-product-validation-issue-index="${issueIndex}"]`'
        );
        expect(productUI).toContain(
            '<span class="sr-only"> — chuyển đến ô cần sửa</span>'
        );
        expect(productUI).toContain('function isResolvedProductValidationControl(control)');
        expect(productUI).toContain('function clearResolvedProductValidationIssue(control)');
        expect(productUI).toContain('function pruneProductValidationSummary()');
        expect(productUI).toContain(
            'control.dataset.productValidationField = issue.field'
        );
        expect(productUI).toContain(
            "control.dataset.productValidationIssueKey = issue.key || ''"
        );
        expect(productUI).toContain(
            "control.dataset.productValidationRejectedValue = issue.rejectedValue || ''"
        );
        expect(productUI).toContain(
            'data-product-validation-summary-issue="${index}"'
        );
        expect(productUI).toContain(
            'clearResolvedProductValidationIssue(control);'
        );
        expect(productUI).toContain(
            "summary.classList.toggle('hidden', list.children.length === 0)"
        );
        expect(productController).toContain('validateProductCatalogEntry({');
        expect(productController).toContain(
            'if (!showProductFormValidationIssues(validationIssues)) return;'
        );
        expect(productController).toContain(
            'const preflightIdentityConflict = findCatalogIdentityConflict({'
        );
        expect(productController).toContain(
            "'identity-product-code-conflict'"
        );
        expect(productController).toContain(
            "'identity-barcode-conflict'"
        );
        expect(productController.indexOf('const preflightIdentityConflict'))
            .toBeLessThan(productController.indexOf(
                'if (submitBtn) { submitBtn.disabled = true;'
            ));
        expect(productUI).toContain(
            "issueKey === 'identity-product-code-conflict'"
        );
        expect(productUI).toContain(
            "issueKey === 'identity-barcode-conflict'"
        );
        expect(productUI).toContain(
            "excludeProductId: document.getElementById('add_product_id')?.value || null"
        );
        expect(productController).toContain(
            'resolveCatalogIdentityPersistenceIssue(error, {'
        );
        expect(productController).toContain(
            'showProductFormValidationIssues([persistenceIssue]);'
        );
        expect(productController).toContain(
            'await fetchCatalogIdentityConflictSnapshot('
        );
        expect(productController).toContain(
            'existingProducts: conflictSnapshot ? [conflictSnapshot] : []'
        );
        expect(productUI).toContain('hasChangedFromRejectedValue');
        expect(productController).not.toContain('form.reportValidity()');
    });
});
