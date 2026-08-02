const fs = require('fs');
const path = require('path');

describe('product variant classification migration', () => {
    const sql = fs.readFileSync(
        path.join(
            process.cwd(),
            'supabase/migrations/058_add_product_variant_classification.sql'
        ),
        'utf8'
    );

    test('adds bounded parent definitions and child values without changing old migrations', () => {
        expect(sql).toMatch(
            /add column if not exists variant_definitions jsonb not null default '\[\]'/i
        );
        expect(sql).toMatch(
            /add column if not exists variant_values jsonb not null default '\{\}'/i
        );
        expect(sql).toMatch(/jsonb_array_length\(variant_definitions\) <= 2/i);
        expect(sql).toMatch(/jsonb_typeof\(variant_values\) = 'object'/i);
        expect(sql).toContain("product_code = 'PARENT_HAPACOL'");
        expect(sql).toContain("'concentration', NULLIF(BTRIM(child.concentration), '')");
        expect(sql).toContain("'dosage_form', NULLIF(BTRIM(child.dosage_form), '')");
    });
});
