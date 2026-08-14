const fs = require('fs');
const path = require('path');

describe('atomic purchase receipt contract', () => {
    const migration = fs.readFileSync(
        path.join(process.cwd(), 'supabase/migrations/095_atomic_purchase_receipt.sql'),
        'utf8'
    );
    const receiveController = fs.readFileSync(
        path.join(process.cwd(), 'js/features/receive/receiveController.js'),
        'utf8'
    );
    const inventoryController = fs.readFileSync(
        path.join(process.cwd(), 'js/features/inventory/inventoryController.js'),
        'utf8'
    );

    test('database function owns header, batch, item and movement writes', () => {
        expect(migration).toContain('create_purchase_document_atomic');
        expect(migration).toContain('pg_advisory_xact_lock');
        expect(migration).toContain('inventory_document_items');
        expect(migration).toContain('inventory_movements');
        expect(migration).toContain("'purchase'");
        expect(migration).toContain("'idempotent', true");
        expect(migration).toContain('current_employee_id()');
    });

    test('cashbook trigger covers initial purchase inserts and repairs missing entries', () => {
        expect(migration).toContain('AFTER INSERT OR UPDATE OF status ON public.inventory_documents');
        expect(migration).toContain("'PC-' || NEW.document_code");
        expect(migration).toContain("'PC-' || repaired.document_code");
        expect(migration).toContain('ON CONFLICT (transaction_code) DO UPDATE');
    });

    test('both receiving surfaces call the atomic adapter instead of the split purchase flow', () => {
        expect(receiveController).toContain('createPurchaseReceiptAtomic');
        expect(receiveController).not.toContain('await receiveStock(');
        expect(inventoryController).toContain('createPurchaseReceiptAtomic');
        expect(inventoryController).toContain('documentCode: purchaseDocumentCode');
    });

    test('receive drafts persist the idempotency code and flush before page exit', () => {
        expect(receiveController).toContain('documentCode: els.receiveDocCode?.value ||');
        expect(receiveController).toContain("window.addEventListener('pagehide', flushDraft)");
        expect(receiveController).toContain("window.addEventListener('beforeunload', flushDraft)");
        expect(receiveController).toContain('function clearDraft({ disableCapture = false } = {})');
        expect(receiveController).toContain('disableCapture: true');
    });
});
