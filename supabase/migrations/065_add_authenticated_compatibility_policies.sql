-- 065_add_authenticated_compatibility_policies.sql
-- Bridge authenticated Supabase sessions to the same RLS operations that the
-- legacy anon frontend already uses. This migration deliberately does not
-- revoke anon; restrictive permission policies are introduced only after all
-- employee accounts have migrated and the authenticated flow is verified.

DROP POLICY IF EXISTS "Auth bridge select bot daily tasks" ON public.bot_daily_inventory_tasks;
CREATE POLICY "Auth bridge select bot daily tasks"
    ON public.bot_daily_inventory_tasks FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Auth bridge select branch settings" ON public.branch_settings;
CREATE POLICY "Auth bridge select branch settings"
    ON public.branch_settings FOR SELECT TO authenticated
    USING (true);
DROP POLICY IF EXISTS "Auth bridge insert branch settings" ON public.branch_settings;
CREATE POLICY "Auth bridge insert branch settings"
    ON public.branch_settings FOR INSERT TO authenticated
    WITH CHECK (true);
DROP POLICY IF EXISTS "Auth bridge update branch settings" ON public.branch_settings;
CREATE POLICY "Auth bridge update branch settings"
    ON public.branch_settings FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth bridge select cashbook" ON public.cashbook_transactions;
CREATE POLICY "Auth bridge select cashbook"
    ON public.cashbook_transactions FOR SELECT TO authenticated
    USING (true);
DROP POLICY IF EXISTS "Auth bridge insert cashbook" ON public.cashbook_transactions;
CREATE POLICY "Auth bridge insert cashbook"
    ON public.cashbook_transactions FOR INSERT TO authenticated
    WITH CHECK (true);
DROP POLICY IF EXISTS "Auth bridge update cashbook" ON public.cashbook_transactions;
CREATE POLICY "Auth bridge update cashbook"
    ON public.cashbook_transactions FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth bridge select daily tasks" ON public.daily_inventory_tasks;
CREATE POLICY "Auth bridge select daily tasks"
    ON public.daily_inventory_tasks FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Auth bridge select device sync" ON public.device_sync_status;
CREATE POLICY "Auth bridge select device sync"
    ON public.device_sync_status FOR SELECT TO authenticated
    USING (true);
DROP POLICY IF EXISTS "Auth bridge insert device sync" ON public.device_sync_status;
CREATE POLICY "Auth bridge insert device sync"
    ON public.device_sync_status FOR INSERT TO authenticated
    WITH CHECK (true);
DROP POLICY IF EXISTS "Auth bridge update device sync" ON public.device_sync_status;
CREATE POLICY "Auth bridge update device sync"
    ON public.device_sync_status FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth bridge employee shifts" ON public.employee_shifts;
CREATE POLICY "Auth bridge employee shifts"
    ON public.employee_shifts FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth bridge employees" ON public.employees;
CREATE POLICY "Auth bridge employees"
    ON public.employees FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth bridge select order items" ON public.order_items;
CREATE POLICY "Auth bridge select order items"
    ON public.order_items FOR SELECT TO authenticated
    USING (true);
DROP POLICY IF EXISTS "Auth bridge insert order items" ON public.order_items;
CREATE POLICY "Auth bridge insert order items"
    ON public.order_items FOR INSERT TO authenticated
    WITH CHECK (true);
DROP POLICY IF EXISTS "Auth bridge delete order items" ON public.order_items;
CREATE POLICY "Auth bridge delete order items"
    ON public.order_items FOR DELETE TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Auth bridge orders" ON public.orders;
CREATE POLICY "Auth bridge orders"
    ON public.orders FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth bridge select purchase order items" ON public.purchase_order_items;
CREATE POLICY "Auth bridge select purchase order items"
    ON public.purchase_order_items FOR SELECT TO authenticated
    USING (true);
DROP POLICY IF EXISTS "Auth bridge insert purchase order items" ON public.purchase_order_items;
CREATE POLICY "Auth bridge insert purchase order items"
    ON public.purchase_order_items FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Auth bridge select purchase orders" ON public.purchase_orders;
CREATE POLICY "Auth bridge select purchase orders"
    ON public.purchase_orders FOR SELECT TO authenticated
    USING (true);
DROP POLICY IF EXISTS "Auth bridge insert purchase orders" ON public.purchase_orders;
CREATE POLICY "Auth bridge insert purchase orders"
    ON public.purchase_orders FOR INSERT TO authenticated
    WITH CHECK (true);
DROP POLICY IF EXISTS "Auth bridge update purchase orders" ON public.purchase_orders;
CREATE POLICY "Auth bridge update purchase orders"
    ON public.purchase_orders FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);
