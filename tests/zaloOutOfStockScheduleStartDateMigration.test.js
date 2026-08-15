const fs = require('fs');
const path = require('path');

describe('out-of-stock schedule changeover migration', () => {
    test('stores an explicit next-day effective date', () => {
        const migration = fs.readFileSync(
            path.join(process.cwd(), 'supabase/migrations/097_add_out_of_stock_schedule_start_date.sql'),
            'utf8'
        );
        expect(migration).toMatch(/cron_out_of_stock_start_date/i);
        expect(migration).toMatch(/DATE '2026-08-16'/i);
    });
});
