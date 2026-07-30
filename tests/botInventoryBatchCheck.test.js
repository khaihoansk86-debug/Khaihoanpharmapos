const fs = require('fs');
const path = require('path');

const read = relativePath => fs.readFileSync(
    path.join(process.cwd(), relativePath),
    'utf8'
);

describe('Zalo Bot inventory checks by batch', () => {
    test('uses authenticated RPCs without changing stock directly', () => {
        const service = read('js/features/inventory/dailyCheckService.js');

        expect(service).toContain("'get_bot_inventory_batch_checks'");
        expect(service).toContain("'complete_bot_inventory_batch_check'");
        expect(service).not.toMatch(/product_batches[\s\S]*\.update/);
        expect(service).not.toContain('total_stock');
    });

    test('keeps expected stock hidden until a batch count is completed', () => {
        const migration = read(
            'supabase/migrations/073_create_bot_inventory_batch_checks.sql'
        );

        expect(migration).toContain('bot_inventory_batch_checks');
        expect(migration).toMatch(
            /WHEN check_row\.status = 'completed' THEN check_row\.expected_quantity/
        );
        expect(migration).toContain(
            'REVOKE ALL ON TABLE public.bot_inventory_batch_checks FROM anon, authenticated'
        );
        expect(migration).toContain(
            'GRANT EXECUTE ON FUNCTION public.complete_bot_inventory_batch_check(UUID, NUMERIC) TO authenticated'
        );
    });

    test('renders separate lot and expiry inputs without showing aggregate stock', () => {
        const controller = read('js/features/inventory/dailyCheckController.js');
        const page = read('pages/inventory.html');

        expect(controller).toContain('check.batch_number');
        expect(controller).toContain('check.expiry_date');
        expect(controller).not.toContain('total_stock');
        expect(page).toContain('15 lượt mỗi tháng');
        expect(page).toContain('Số lô');
        expect(page).toContain('Hạn dùng');
    });
});
