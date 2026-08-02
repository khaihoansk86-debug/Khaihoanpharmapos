const fs = require('fs');
const path = require('path');

describe('product variant and bot migration safety', () => {
    const readMigration = filename => fs.readFileSync(
        path.join(process.cwd(), 'supabase', 'migrations', filename),
        'utf8'
    );

    test('keeps deployed migration 045 immutable and moves bot storage to migration 059', () => {
        const oldMigration = readMigration('045_create_daily_inventory_tasks.sql');
        const botMigration = readMigration('059_create_bot_daily_inventory_tasks.sql');

        expect(oldMigration).toMatch(/public\.daily_inventory_tasks/);
        expect(oldMigration).toMatch(/public\.generate_daily_inventory_tasks/);
        expect(oldMigration).not.toMatch(/public\.bot_daily_inventory_tasks/);

        expect(botMigration).toMatch(/CREATE TABLE IF NOT EXISTS public\.bot_daily_inventory_tasks/i);
        expect(botMigration).toMatch(/public\.bot_generate_daily_inventory_tasks/i);
        expect(botMigration).toMatch(/public\.bot_get_daily_inventory_tasks/i);
        expect(botMigration).toMatch(/INSERT INTO public\.bot_daily_inventory_tasks/i);
    });

    test('persists product, units and batches in one database function', () => {
        const migration = readMigration('060_save_product_variant_atomic.sql');

        expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.save_product_variant_atomic/i);
        expect(migration).toMatch(/UPDATE public\.products/i);
        expect(migration).toMatch(/INSERT INTO public\.product_units/i);
        expect(migration).toMatch(/UPDATE public\.product_units[\s\S]*conversion_rate/i);
        expect(migration).toMatch(/INSERT INTO public\.product_batches/i);
        expect(migration).toMatch(/GRANT EXECUTE[\s\S]*authenticated/i);
    });

    test('prevents every write path from deleting a batch that still has stock', () => {
        const migration = readMigration('061_prevent_positive_stock_batch_deletion.sql');

        expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.prevent_positive_stock_batch_deletion/i);
        expect(migration).toMatch(/COALESCE\(OLD\.stock_quantity,\s*0\)\s*>\s*0/i);
        expect(migration).toMatch(/BEFORE DELETE ON public\.product_batches/i);
        expect(migration).toMatch(/USING ERRCODE = 'check_violation'/i);
    });
});
