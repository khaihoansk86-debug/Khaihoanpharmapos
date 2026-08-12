const fs = require('fs');
const path = require('path');

describe('return trigger RLS migration', () => {
    test('runs the source-row lock as a definer so authenticated POS returns can validate', () => {
        const sql = fs.readFileSync(
            path.join(process.cwd(), 'supabase/migrations/092_fix_return_trigger_rls.sql'),
            'utf8'
        );
        expect(sql).toMatch(/ALTER FUNCTION\s+public\.enforce_order_item_return_limit\(\)\s+SECURITY DEFINER/i);
        expect(sql).toMatch(/SET search_path\s*=\s*pg_catalog,\s*public/i);
    });
});
