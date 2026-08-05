const fs = require('fs');
const path = require('path');

describe('stocktake draft migration security', () => {
    const sql = fs.readFileSync(
        path.join(process.cwd(), 'supabase/migrations/086_create_stocktake_drafts.sql'),
        'utf8'
    );

    test('creates one protected draft key per authenticated user', () => {
        expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.stocktake_drafts/i);
        expect(sql).toMatch(/UNIQUE\s*\(user_id, draft_key\)/i);
        expect(sql).toMatch(/payload JSONB NOT NULL/i);
        expect(sql).toMatch(/octet_length\(payload::text\) <= 5242880/i);
        expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/i);
        expect(sql).toMatch(/USING\s*\(user_id = auth\.uid\(\)\)/i);
        expect(sql).toMatch(/WITH CHECK\s*\(user_id = auth\.uid\(\)\)/i);
        expect(sql).toMatch(/REVOKE ALL ON public\.stocktake_drafts FROM anon/i);
        expect(sql).not.toMatch(/TO anon/i);
    });

    test('does not alter the confirmed stocktake RPC or existing migrations', () => {
        expect(sql).not.toMatch(/apply_stocktake_document_atomic/i);
        expect(sql).not.toMatch(/UPDATE\s+public\.product_batches/i);
        expect(sql).not.toMatch(/INSERT\s+INTO\s+public\.inventory_movements/i);
    });
});
