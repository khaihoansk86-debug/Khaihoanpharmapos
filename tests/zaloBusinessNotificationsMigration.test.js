const fs = require('fs');
const path = require('path');

const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/088_create_zalo_business_notifications.sql'
);

describe('Zalo business notifications migration', () => {
    test('uses the PharmaPOS purchase document as the trusted event source', () => {
        const migration = fs.readFileSync(migrationPath, 'utf8');
        expect(migration).toMatch(/inventory_documents/i);
        expect(migration).toMatch(/document_type\s*=\s*'purchase'/i);
        expect(migration).toMatch(/status\s*=\s*'confirmed'/i);
        expect(migration).toMatch(/notify_purchase_document/i);
        expect(migration).not.toMatch(/kiotviet|webhook/i);
    });

    test('queues once per purchase and adds the 20h sales schedule', () => {
        const migration = fs.readFileSync(migrationPath, 'utf8');
        expect(migration).toMatch(/dedupe_key/i);
        expect(migration).toMatch(/ON CONFLICT[\s\S]*DO NOTHING/i);
        expect(migration).toMatch(/cron_daily_sales[\s\S]*'0 20 \* \* \*'/i);
        expect(migration).toMatch(/send_daily_sales_report/i);
        expect(migration).toMatch(/status[\s\S]*'queued'/i);
    });
});
