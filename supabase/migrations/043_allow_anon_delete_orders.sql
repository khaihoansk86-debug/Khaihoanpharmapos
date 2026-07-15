-- Cấp quyền Xóa (Delete) cho role anon trên bảng orders và order_items
-- Cần thiết để POS có thể tự động rollback (dọn rác) các đơn nháp khi giao dịch thất bại giữa chừng.

drop policy if exists "Allow anon delete orders" on public.orders;
create policy "Allow anon delete orders"
on public.orders for delete
to anon
using (true);

drop policy if exists "Allow anon delete order_items" on public.order_items;
create policy "Allow anon delete order_items"
on public.order_items for delete
to anon
using (true);
