const fs = require('fs');
const path = require('path');

const migration = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/077_create_zalo_bot_control_center.sql'),
    'utf8'
);

describe('Zalo control center migration', () => {
    test('uses admin-only RLS and authenticated enqueue RPC', () => {
        expect(migration).toMatch(/is_current_employee_admin\(\)/i);
        expect(migration).toMatch(/Admin reads Zalo commands/i);
        expect(migration).toMatch(/REVOKE ALL ON public\.zalo_bot_commands FROM anon, authenticated/i);
        expect(migration).toMatch(/GRANT EXECUTE ON FUNCTION public\.enqueue_zalo_bot_command[\s\S]*TO authenticated/i);
    });

    test('does not expose bot claim RPC to browser roles', () => {
        expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.bot_claim_next_zalo_command\(\)[\s\S]*anon, authenticated/i);
        expect(migration).toMatch(/GRANT EXECUTE ON FUNCTION public\.bot_claim_next_zalo_command\(\)[\s\S]*TO service_role/i);
    });

    test('whitelists commands and rate limits duplicates', () => {
        expect(migration).toMatch(/Unsupported Zalo command/i);
        expect(migration).toMatch(/octet_length\(p_payload::TEXT\) > 2048/i);
        expect(migration).toMatch(/status IN \('queued', 'processing'\)/i);
    });
});
