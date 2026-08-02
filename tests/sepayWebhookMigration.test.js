const fs = require('fs');
const path = require('path');

describe('SePay webhook database hardening migration', () => {
    const sql = fs.readFileSync(
        path.join(
            process.cwd(),
            'supabase',
            'migrations',
            '085_reassert_sepay_webhook_security.sql'
        ),
        'utf8'
    );

    test('removes public and authenticated write access', () => {
        expect(sql).toMatch(
            /REVOKE ALL ON TABLE public\.sepay_webhooks FROM PUBLIC,\s*anon/i
        );
        expect(sql).toMatch(
            /REVOKE INSERT,\s*UPDATE,\s*DELETE,\s*TRUNCATE,\s*REFERENCES,\s*TRIGGER[\s\S]*FROM authenticated/i
        );
    });

    test('retains only authenticated read policy for POS Realtime', () => {
        expect(sql).toMatch(
            /GRANT SELECT ON TABLE public\.sepay_webhooks TO authenticated/i
        );
        expect(sql).toMatch(
            /CREATE POLICY "Authenticated POS can read SePay confirmations"[\s\S]*FOR SELECT[\s\S]*TO authenticated/i
        );
        expect(sql).toMatch(
            /FROM pg_policies[\s\S]*tablename = 'sepay_webhooks'/i
        );
        expect(sql).not.toMatch(/FOR INSERT/i);
    });
});
