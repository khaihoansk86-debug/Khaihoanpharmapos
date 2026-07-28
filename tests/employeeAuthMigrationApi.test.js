const fs = require('fs');
const path = require('path');

describe('retired employee auth migration API', () => {
    const apiSource = fs.readFileSync(
        path.join(process.cwd(), 'api', 'auth-migrate.js'),
        'utf8'
    );

    test('returns Gone and does not process legacy credentials', () => {
        expect(apiSource).toContain("res.status(410)");
        expect(apiSource).toContain("'Cache-Control', 'no-store, max-age=0'");
        expect(apiSource).not.toMatch(/password|password_hash|createUser|updateUserById/i);
        expect(apiSource).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    });
});
