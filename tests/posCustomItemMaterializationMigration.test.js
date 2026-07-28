const fs = require('fs');
const path = require('path');

describe('POS custom item materialization migration', () => {
    const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '072_materialize_pos_custom_item.sql'
    );

    test('creates an authenticated-only atomic and idempotent RPC', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');

        expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.materialize_pos_custom_item/i);
        expect(sql).toMatch(/SECURITY INVOKER/i);
        expect(sql).toMatch(/p_idempotency_key\s+TEXT/i);
        expect(sql).toMatch(/MD5\(v_idempotency_key\)/i);
        expect(sql).toMatch(/ON CONFLICT\s*\(product_code\)\s*DO NOTHING/i);
        expect(sql).toMatch(/INSERT INTO public\.product_units/i);
        expect(sql).toMatch(/INSERT INTO public\.product_batches/i);
        expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.materialize_pos_custom_item[\s\S]*FROM PUBLIC, anon/i);
        expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.materialize_pos_custom_item[\s\S]*TO authenticated/i);
        expect(sql).not.toMatch(/TO anon\s*;/i);
    });

    test('validates bounded text and positive finite business values', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');

        expect(sql).toMatch(/CHAR_LENGTH\(v_name\)\s*>\s*255/i);
        expect(sql).toMatch(/CHAR_LENGTH\(v_unit_name\)\s*>\s*100/i);
        expect(sql).toMatch(/v_unit_price\s*<\s*0/i);
        expect(sql).toMatch(/v_stock_quantity\s*<=\s*0/i);
    });
});
