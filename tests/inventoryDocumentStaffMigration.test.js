const fs = require('fs');
const path = require('path');

describe('inventory document staff attribution', () => {
    const migration = fs.readFileSync(path.join(
        process.cwd(),
        'supabase/migrations/091_track_inventory_document_staff.sql'
    ), 'utf8');

    test('stamps creator and confirmer from authenticated identity', () => {
        expect(migration).toMatch(/v_auth_user_id UUID := auth\.uid\(\)/i);
        expect(migration).toMatch(/NEW\.created_by := v_auth_user_id/i);
        expect(migration).toMatch(/NEW\.confirmed_by := v_auth_user_id/i);
        expect(migration).toMatch(/BEFORE INSERT OR UPDATE OF status/i);
    });

    test('does not trust browser names and cannot be called directly', () => {
        expect(migration).not.toMatch(/employee_name|performer|p_created_by/i);
        expect(migration).toMatch(/REVOKE ALL ON FUNCTION[\s\S]*PUBLIC, anon, authenticated/i);
    });
});
