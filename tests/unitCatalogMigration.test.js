const fs = require('fs');
const path = require('path');

describe('product unit catalog migration', () => {
    const sql = fs.readFileSync(
        path.join(process.cwd(), 'supabase', 'migrations', '101_normalize_product_unit_labels.sql'),
        'utf8'
    );

    test('canonicalizes legacy vĩ/vỉ and standard labels without touching quantities', () => {
        expect(sql).toMatch(/UPDATE\s+public\.product_units/i);
        expect(sql).toMatch(/WHEN\s+'vi'\s+THEN\s+'Vỉ'/i);
        expect(sql).toMatch(/WHEN\s+'vĩ'\s+THEN\s+'Vỉ'/i);
        expect(sql).toMatch(/WHEN\s+'vỉ'\s+THEN\s+'Vỉ'/i);
        expect(sql).toMatch(/WHEN\s+'viên'\s+THEN\s+'Viên'/i);
        expect(sql).not.toMatch(/DELETE\s+FROM/i);
        expect(sql).not.toMatch(/stock_quantity\s*=/i);
        expect(sql).not.toMatch(/cost_price\s*=/i);
        expect(sql).not.toMatch(/retail_price\s*=/i);
    });
});
