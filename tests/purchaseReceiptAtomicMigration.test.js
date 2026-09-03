const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const read = name => fs.readFileSync(
    path.join(process.cwd(), name),
    'utf8'
);

describe('atomic purchase receipt contract', () => {
    const baseMigration = read('supabase/migrations/095_atomic_purchase_receipt.sql');
    const hardeningMigration = read('supabase/migrations/102_harden_atomic_purchase_receipt.sql');
    const controller = read('js/features/receive/receiveController.js');
    const service = read('js/features/inventory/purchaseReceiptAtomicService.js');

    test('keeps deployed migration 095 immutable', () => {
        const normalized = baseMigration.replace(/\r\n/g, '\n');
        expect(crypto.createHash('sha256').update(normalized).digest('hex'))
            .toBe('5e77635b547f80d007d7245a6c5f790200151c0a1cda4c9b8e5c1f911bc078da');
    });

    test('adds fingerprint idempotency only in the new hardening migration', () => {
        expect(baseMigration).not.toMatch(/purchase_request_fingerprint/i);
        expect(hardeningMigration).toMatch(/purchase_request_fingerprint/i);
        expect(hardeningMigration).toMatch(/create or replace function public\.create_purchase_document_atomic/i);
        expect(hardeningMigration).toMatch(/pg_advisory_xact_lock\(hashtextextended\(btrim\(p_document_code\)/i);
        expect(hardeningMigration).toMatch(/retry payload does not match/i);
        expect(hardeningMigration).toMatch(/grant execute on function public\.create_purchase_document_atomic[\s\S]*authenticated/i);
    });

    test('canonicalizes lot identity before duplicate detection and ordered locking', () => {
        expect(hardeningMigration).toMatch(/v_canonical_lines\s+JSONB/i);
        expect(hardeningMigration).toMatch(/btrim\(coalesce\(v_line->>'batch_number', v_line->>'batchNumber'\)\)/i);
        expect(hardeningMigration).toMatch(/jsonb_array_elements\(v_canonical_lines\)[\s\S]*having count\(\*\) > 1/i);
        expect(hardeningMigration).toMatch(/jsonb_array_elements\(v_canonical_lines\)[\s\S]*order by 1[\s\S]*pg_advisory_xact_lock\(hashtextextended\(v_lock_key/i);
    });

    test('fingerprints canonical business data and protects legacy null fingerprints', () => {
        expect(hardeningMigration).toMatch(/'lines',\s*v_canonical_lines/i);
        expect(hardeningMigration).not.toMatch(/'lines',\s*p_lines/i);
        expect(hardeningMigration).toMatch(/update public\.inventory_documents[\s\S]*inventory_document_items/i);
        expect(hardeningMigration).toMatch(/purchase_request_fingerprint is null[\s\S]*retry payload does not match/i);
    });

    test('writes all stock and audit records in the replacement RPC', () => {
        expect(hardeningMigration).toMatch(/insert into public\.inventory_document_items/i);
        expect(hardeningMigration).toMatch(/insert into public\.inventory_movements/i);
        expect(hardeningMigration).toMatch(/document_id, v_product_id, v_batch_id, 'purchase'/i);
        expect(hardeningMigration).toMatch(/must specify the cost price for an existing lot/i);
    });

    test('restores the initial paid cashbook amount without reactivating completed rows', () => {
        expect(baseMigration).toMatch(/sum\(payment\.amount\)/i);
        expect(baseMigration).toMatch(/payment\.ref_type = 'manual'/i);
        expect(baseMigration).toMatch(/where cashbook_transactions\.status = 'cancelled'/i);
        expect(baseMigration).toMatch(/after insert or update of status on public\.inventory_documents/i);
    });

    test('controller persists the document code and calls only the atomic adapter', () => {
        expect(controller).toMatch(/import \{ createPurchaseReceiptAtomic \}/i);
        expect(controller).toMatch(/documentCode:\s*els\.receiveDocCode\.value/i);
        expect(controller).not.toMatch(/import \{ receiveStock, saveInventoryDocument \}/i);
        expect(service).toMatch(/rpc\('create_purchase_document_atomic'/i);
        expect(service).toMatch(/p_document_code:\s*documentCode/i);
    });
});
