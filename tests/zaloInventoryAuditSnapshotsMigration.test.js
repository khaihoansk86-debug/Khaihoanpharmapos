const fs = require('fs');
const path = require('path');

describe('durable Zalo inventory audit snapshots', () => {
    const migration = fs.readFileSync(path.join(
        process.cwd(),
        'supabase/migrations/090_create_zalo_inventory_audit_snapshots.sql'
    ), 'utf8');

    test('stores one shared snapshot per business date with bounded JSON shapes', () => {
        expect(migration).toMatch(/zalo_inventory_audit_snapshots/i);
        expect(migration).toMatch(/date_key DATE NOT NULL UNIQUE/i);
        expect(migration).toMatch(/jsonb_typeof\(tasks\)\s*=\s*'array'/i);
        expect(migration).toMatch(/due_at\s*>=\s*sent_at/i);
    });

    test('is private to the service-role bot', () => {
        expect(migration).toMatch(/ENABLE ROW LEVEL SECURITY/i);
        expect(migration).toMatch(/REVOKE ALL[\s\S]*PUBLIC, anon, authenticated/i);
        expect(migration).toMatch(/GRANT SELECT, INSERT, UPDATE[\s\S]*TO service_role/i);
    });
});
