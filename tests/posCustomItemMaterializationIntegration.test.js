const fs = require('fs');
const path = require('path');

describe('POS custom item materialization integration', () => {
    const controllerSource = fs.readFileSync(
        path.join(process.cwd(), 'js', 'features', 'pos', 'posController.js'),
        'utf8'
    );

    test('uses the materialization service for online checkout and offline sync', () => {
        expect(controllerSource).toMatch(
            /import\s*\{\s*materializePosCustomItems\s*\}\s*from\s*['"]\.\/posCustomItemMaterializationService\.js['"]/
        );
        expect(
            (controllerSource.match(/await materializePosCustomItems\(/g) || []).length
        ).toBe(2);
        expect(controllerSource).not.toMatch(
            /\.from\(['"]products['"]\)\s*\.insert\(\[productData\]\)/
        );
        expect(controllerSource).not.toMatch(/item\.isCustom\s*=\s*false/);
    });

    test('persists materialized offline references before creating the order', () => {
        const materializeIndex = controllerSource.indexOf(
            'syncCartItems = await materializePosCustomItems'
        );
        const persistIndex = controllerSource.indexOf(
            'saveMaterializedOfflineCart(order.id, syncCartItems)'
        );
        const createIndex = controllerSource.indexOf(
            'createdOrder = await createOrderWithAtomicFastPath',
            materializeIndex
        );

        expect(materializeIndex).toBeGreaterThan(-1);
        expect(persistIndex).toBeGreaterThan(materializeIndex);
        expect(createIndex).toBeGreaterThan(persistIndex);
    });

    test('prevents two offline synchronization loops from running together', () => {
        expect(controllerSource).toMatch(/let isSyncingOfflineOrders = false/);
        expect(controllerSource).toMatch(/if \(isSyncingOfflineOrders\)[\s\S]*return;/);
        expect(controllerSource).toMatch(
            /finally\s*\{\s*isSyncingOfflineOrders = false;\s*window\.updateOfflineUI\(\);/
        );
    });
});
