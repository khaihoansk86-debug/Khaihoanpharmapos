const fs = require('fs');
const path = require('path');

describe('daily inventory check wiring', () => {
    test('loads the controller and its formatter dependency from inventory page', () => {
        const page = fs.readFileSync(path.join(process.cwd(), 'pages/inventory.html'), 'utf8');
        const formatterPath = path.join(process.cwd(), 'js/utils/formatters.js');

        expect(page).toContain('../js/features/inventory/dailyCheckController.js');
        expect(fs.existsSync(formatterPath)).toBe(true);
    });

    test('opens the daily-check panel when the inventory tab is selected', () => {
        const page = fs.readFileSync(path.join(process.cwd(), 'pages/inventory.html'), 'utf8');
        const controller = fs.readFileSync(
            path.join(process.cwd(), 'js/features/inventory/inventoryController.js'),
            'utf8'
        );

        expect(page).toMatch(/id="tab-daily-check"[^>]*inv-tab-content/);
        expect(controller).toMatch(
            /tabId === 'daily-check'[\s\S]*?getElementById\('tab-daily-check'\)\?\.classList\.remove\('hidden'\)/
        );
    });
});
