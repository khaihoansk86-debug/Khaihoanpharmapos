const fs = require('fs');
const path = require('path');

describe('ecommerce return migration', () => {
    const sql = fs.readFileSync(
        path.join(process.cwd(), 'supabase/migrations/054_create_ecommerce_returns.sql'),
        'utf8'
    );
    const guardSql = fs.readFileSync(
        path.join(process.cwd(), 'supabase/migrations/055_guard_ecommerce_return_cost.sql'),
        'utf8'
    );

    test('creates an auditable return ledger with duplicate tracking protection', () => {
        expect(sql).toMatch(/create table if not exists public\.ecommerce_returns/i);
        expect(sql).toMatch(/create table if not exists public\.ecommerce_return_items/i);
        expect(sql).toMatch(/unique[\s\S]*ecommerce_platform[\s\S]*tracking_code_normalized/i);
        expect(sql).toMatch(/enable row level security/i);
    });

    test('creates and cancels returns atomically with server-authoritative units and locked batches', () => {
        expect(sql).toMatch(/create or replace function public\.create_ecommerce_return/i);
        expect(sql).toMatch(/create or replace function public\.cancel_ecommerce_return/i);
        expect(sql).toMatch(/from public\.product_units/i);
        expect(sql).toMatch(/for update/i);
        expect(sql).toMatch(/order_type[\s\S]*'ecommerce'/i);
        expect(sql).toMatch(/quantity[\s\S]*-v_quantity/i);
        expect(sql).toMatch(/stock_quantity\s*=\s*stock_quantity\s*\+\s*v_quantity_base/i);
        expect(sql).toMatch(/stock_quantity\s*=\s*stock_quantity\s*-\s*v_item\.quantity_base/i);
        expect(sql).toMatch(/không thể hủy phiếu hoàn/i);
    });
    test('rejects zero-cost returns in the same transaction', () => {
        expect(guardSql).toMatch(/create or replace function public\.guard_ecommerce_return_item_cost/i);
        expect(guardSql).toMatch(/before insert or update of cost_price_snapshot, total_cost/i);
        expect(guardSql).toMatch(/coalesce\(new\.cost_price_snapshot,\s*0\)\s*<=\s*0/i);
        expect(guardSql).toMatch(/coalesce\(new\.total_cost,\s*0\)\s*<=\s*0/i);
        expect(guardSql).toMatch(/khong the lap phieu hoan TMDT/i);
    });
});
