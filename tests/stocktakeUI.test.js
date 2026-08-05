const fs = require('fs');
const path = require('path');

describe('stocktake user interface contract', () => {
    const html = fs.readFileSync(path.join(process.cwd(), 'pages/stocktake.html'), 'utf8');
    const controller = fs.readFileSync(
        path.join(process.cwd(), 'js/features/stocktake/stocktakeController.js'),
        'utf8'
    );
    const inventoryController = fs.readFileSync(
        path.join(process.cwd(), 'js/features/inventory/inventoryController.js'),
        'utf8'
    );

    test('provides accessible touch controls, filters, progress and recovery actions', () => {
        expect(html).toMatch(/id="auditStatusFilter"/);
        expect(html).toMatch(/id="openLogDrawerBtn"/);
        expect(html).toMatch(/id="saveAndExitBtn"/);
        expect(html).toMatch(/id="restoreDraftModal"[^>]+role="dialog"[^>]+aria-modal="true"/);
        expect(html).toMatch(/id="completeAuditModal"[^>]+role="dialog"[^>]+aria-modal="true"/);
        expect(html).toMatch(/role="progressbar"/);
        expect(html).toMatch(/id="logProgressTrack"/);
        expect(html).toMatch(/aria-label="Quay lại quản lý kho"/);
        expect(html).toMatch(/min-h-11|min-h-12|h-11|h-12/);
        expect(html).toMatch(/env\(safe-area-inset-bottom\)/);
        expect(html).toMatch(/prefers-reduced-motion/);
        expect(html).toMatch(/<\/main>/);
    });

    test('uses verified state rather than discrepancy as progress', () => {
        expect(controller).toMatch(/isVerified: false/);
        expect(controller).toMatch(/batch\.isVerified = true/);
        expect(controller).toMatch(/summarizeStocktake\(groupedProducts\)/);
        expect(controller).toMatch(/canCompleteStocktake\(groupedProducts, allowPending\)/);
        expect(controller).toMatch(/allowPendingAudit\.checked/);
    });

    test('keeps draft on failure and clears it only after atomic success', () => {
        const successIndex = controller.indexOf('await applyStocktakeDocumentAtomic');
        const clearIndex = controller.indexOf('await deleteStocktakeDraftEverywhere', successIndex);
        const failureIndex = controller.indexOf('catch (error)', successIndex);
        expect(successIndex).toBeGreaterThan(-1);
        expect(clearIndex).toBeGreaterThan(successIndex);
        expect(failureIndex).toBeGreaterThan(clearIndex);
        expect(controller.slice(failureIndex)).toMatch(/await persistDraft\(\{ syncRemote: true \}\)/);
    });

    test('removes stale table selectors and the out-of-scope filter call', () => {
        expect(controller).not.toMatch(/tr\.sub-row|tr\.parent-row/);
        expect(controller).not.toMatch(/function applyFilters/);
        expect(controller).toMatch(/\.batch-item/);
        expect(controller).toMatch(/\.product-card/);
    });

    test('escapes restored activity messages and does not force a saved draft prompt on inventory load', () => {
        expect(controller).toMatch(/escapeHTML\(log\.message\)/);
        expect(inventoryController).not.toMatch(/stocktakeDraftJson/);
        expect(inventoryController).toMatch(/ageHours <= 24 \* 7/);
    });
});
