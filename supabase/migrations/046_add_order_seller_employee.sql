ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS seller_employee_id UUID
REFERENCES public.employees(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_seller_employee_id
ON public.orders(seller_employee_id);

COMMENT ON COLUMN public.orders.seller_employee_id IS
'Nhân viên đăng nhập tại thời điểm lập hóa đơn; dùng để gán doanh số khi hóa đơn nằm ngoài mọi ca.';
