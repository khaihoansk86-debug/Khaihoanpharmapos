import { JSDOM } from 'jsdom';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to load ES modules with proper __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up a DOM environment for UI tests
function setupDOM(html = '<!DOCTYPE html><html><body></body></html>') {
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
  global.window = dom.window as any;
  global.document = dom.window.document as any;
  // expose needed globals
  (global as any).navigator = dom.window.navigator;
}

// Load modules after DOM is ready
async function loadModules() {
  const productUI = await import(path.join(__dirname, '../js/features/products/productUI.js'));
  const productController = await import(path.join(__dirname, '../js/features/products/productController.js'));
  const layout = await import(path.join(__dirname, '../js/components/layout.js'));
  const supabaseClient = await import(path.join(__dirname, '../js/core/supabase.js'));
  return { productUI, productController, layout, supabaseClient };
}

describe('AI command price handling', () => {
  test('should keep exact price without multiplying by 1000', async () => {
    setupDOM();
    const { productController } = await loadModules();
    // Simulate AI command
    const result = await (productController as any).processAICommand('sửa giá 400', {});
    // processAICommand currently returns void; we check that window.aiContext.lastPrice === 400
    expect((global as any).window.aiContext.lastPrice).toBe(400);
  });
});

describe('Variant UI handling', () => {
  test('addVariantRow creates rows and submit includes description', async () => {
    const html = `
    <div id="addProductModal" class="hidden">
      <form id="addProductForm">
        <div id="variantsContainer"></div>
        <button data-action="submit-add-product"></button>
      </form>
    </div>`;
    setupDOM(html);
    const { productUI, productController } = await loadModules();
    // expose UI functions globally as they are attached in productUI file
    (global as any).window.addVariantRow = productUI.addVariantRow;
    (global as any).window.removeVariantRow = productUI.removeVariantRow;
    // Add two variants
    (global as any).window.addVariantRow('Màu', 'Đỏ');
    (global as any).window.addVariantRow('Thể tích', '100ml');
    // Fill required fields for base unit to avoid validation errors
    const form = document.getElementById('addProductForm') as any;
    form.innerHTML += `<input id="add_name" value="Test" />`;
    form.innerHTML += `<input id="add_code" value="SP001" />`;
    const unitsContainer = document.createElement('div');
    unitsContainer.id = 'unitsContainer';
    unitsContainer.innerHTML = `<div class="unit-row"><input class="unit-name" value="Cái" /><input class="unit-retail" value="1000" /><input class="unit-cost" value="800" /><input class="unit-conversion" value="1" /></div>`;
    document.body.appendChild(unitsContainer);
    // Submit product (will call createProduct which uses supabase; we mock it)
    (global as any).window.createProduct = jest.fn();
    await (global as any).window.submitAddProduct();
    // Verify that description contains the variants JSON
    const calledArg = (global as any).window.createProduct.mock.calls[0][2]; // third arg is unitsData, description is in productData
    const productData = (global as any).window.createProduct.mock.calls[0][0];
    const desc = JSON.parse(productData.description);
    expect(desc.variants).toEqual({ Màu: 'Đỏ', 'Thể tích': '100ml' });
  });
});

describe('Layout rendering', () => {
  test('renderAdminHeader for inventory includes inventory tab and no conflict markers', async () => {
    setupDOM();
    const { layout } = await loadModules();
    const html = (layout as any).renderAdminHeader('inventory');
    expect(html).toContain('Tồn kho');
    expect(html).not.toMatch(/<<<<|====|>>>>/);
  });
});
