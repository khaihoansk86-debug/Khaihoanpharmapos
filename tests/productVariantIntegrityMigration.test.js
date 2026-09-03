const fs = require('fs');
const path = require('path');

describe('product variant integrity hardening migration', () => {
    const migration = fs.readFileSync(
        path.join(process.cwd(), 'supabase/migrations/103_harden_product_variant_integrity.sql'),
        'utf8'
    );

    test('validates new or changed child identities against the parent contract', () => {
        expect(migration).toContain('validate_product_variant_write_contract');
        expect(migration).toMatch(/JSONB_OBJECT_KEYS\(NEW\.variant_values\)/i);
        expect(migration).toMatch(/NEW\.variant_values IS NOT DISTINCT FROM OLD\.variant_values/i);
        expect(migration).toMatch(/PG_ADVISORY_XACT_LOCK/i);
        expect(migration).toMatch(/sibling\.variant_values->>identity_key\.key/i);
        expect(migration).toMatch(/sibling\.packaging_spec/i);
        expect(migration).toMatch(/NEW\.variant_definitions IS DISTINCT FROM OLD\.variant_definitions/i);
        expect(migration).toMatch(/COUNT\(DISTINCT BTRIM\(definition->>'key'\)\)/i);
    });

    test('prevents deleting a parent while child SKUs still exist', () => {
        expect(migration).toContain('prevent_parent_product_cascade_delete');
        expect(migration).toMatch(/child\.parent_id = OLD\.id/i);
    });

    test('persists complete shared-editor fields and exact prices atomically', () => {
        expect(migration).toContain('save_product_variant_from_shared_editor_atomic');
        expect(migration).toContain('save_product_variant_with_limits_atomic(p_payload)');
        expect(migration).toMatch(/ecommerce_platforms = CASE/i);
        expect(migration).toMatch(/retail_price = COALESCE/i);
        expect(migration).toMatch(/SET cost_price = COALESCE/i);
    });
});
