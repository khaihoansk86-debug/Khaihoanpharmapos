-- Thêm constraint đảm bảo số lượng tồn kho của một lô hàng không bao giờ nhỏ hơn 0
ALTER TABLE public.product_batches
ADD CONSTRAINT check_stock_quantity_non_negative CHECK (stock_quantity >= 0);
