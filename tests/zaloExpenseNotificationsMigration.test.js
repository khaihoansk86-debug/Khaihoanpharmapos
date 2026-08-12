const fs = require('fs');
const path = require('path');

const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/089_create_zalo_expense_notifications.sql'
);

describe('Zalo expense notification migration', () => {
    test('queues completed cashbook expenses once using only the trusted transaction id', () => {
        const migration = fs.readFileSync(migrationPath, 'utf8');
        expect(migration).toMatch(/cashbook_transactions/i);
        expect(migration).toMatch(/NEW\.type\s*=\s*'expense'/i);
        expect(migration).toMatch(/NEW\.status\s*=\s*'completed'/i);
        expect(migration).toMatch(/notify_expense_transaction/i);
        expect(migration).toMatch(/jsonb_build_object\('transaction_id',\s*NEW\.id\)/i);
        expect(migration).toMatch(/expense_transaction:[^;]*NEW\.id/i);
        expect(migration).toMatch(/ON CONFLICT[\s\S]*DO NOTHING/i);
        expect(migration).not.toMatch(/webhook|kiotviet|n8n/i);
    });

    test('does not duplicate the richer purchase notification', () => {
        const migration = fs.readFileSync(migrationPath, 'utf8');
        expect(migration).toMatch(/NEW\.ref_type\s+IS DISTINCT FROM\s+'purchase'/i);
    });
});
