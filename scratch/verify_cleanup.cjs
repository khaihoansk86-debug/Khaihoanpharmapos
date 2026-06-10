const fs = require('fs');

const ui   = fs.readFileSync('js/features/products/productUI.js', 'utf8');
const inv  = fs.readFileSync('js/features/pos/invoicesController.js', 'utf8');
const dose = fs.readFileSync('js/features/products/doseController.js', 'utf8');
const ctrl = fs.readFileSync('js/features/products/productController.js', 'utf8');
const svc  = fs.readFileSync('js/features/products/productService.js', 'utf8');
const html = fs.readFileSync('pages/products.html', 'utf8');

const checks = [
    ['1. toggleDoseCutFields ẩn batch_controls_container',   ui.includes('batchControlsContainer.classList.add')],
    ['2. toggleDoseCutFields hiện lại batch_controls',        ui.includes('batchControlsContainer.classList.remove')],
    ['3. toggleDoseCutFields uncheck hasBatch',               ui.includes('hasBatchCheckbox.checked = false')],
    ['4. INCOME_CATEGORIES đã xóa',                          !inv.includes('INCOME_CATEGORIES')],
    ['5. window.submitDose đã xóa khỏi doseController',      !dose.includes('window.submitDose')],
    ['6. window.generateDoseCode đã xóa khỏi doseController',!dose.includes('window.generateDoseCode')],
    ['7. submitDoseBtn listener đã xóa khỏi controller',     !ctrl.includes('submitDoseBtn')],
    ['8. generate-dose-code action đã xóa',                  !ctrl.includes("'generate-dose-code'")],
    ['9. Comment thừa đã xóa khỏi productService',           !svc.includes('syncProductUnits nếu muốn')],
    ['10. addDoseModal HTML đã xóa',                         !html.includes('id="addDoseModal"')],
    ['11. submitDoseBtn HTML đã xóa',                        !html.includes('id="submitDoseBtn"')],
];

let allPass = true;
checks.forEach(([name, pass]) => {
    console.log((pass ? '✓' : '✗') + ' ' + name + ': ' + (pass ? 'OK' : 'FAIL'));
    if (!pass) allPass = false;
});
console.log('\n' + (allPass ? '✅ Tất cả kiểm tra đều PASS' : '❌ Có kiểm tra FAIL'));
