-- 061_prevent_positive_stock_batch_deletion.sql
-- Giữ hợp đồng an toàn hiện có: lô còn tồn phải được xuất/điều chỉnh về 0
-- trước khi bị xóa, kể cả khi thao tác đi qua RPC lưu SKU nguyên tử.

CREATE OR REPLACE FUNCTION public.prevent_positive_stock_batch_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF COALESCE(OLD.stock_quantity, 0) > 0 THEN
        RAISE EXCEPTION
            'Lô "%" vẫn còn tồn kho (%). Vui lòng đưa tồn về 0 trước khi xóa.',
            COALESCE(OLD.batch_number, 'Không tên'),
            OLD.stock_quantity
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_positive_stock_batch_deletion()
    FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_prevent_positive_stock_batch_deletion
    ON public.product_batches;

CREATE TRIGGER trg_prevent_positive_stock_batch_deletion
BEFORE DELETE ON public.product_batches
FOR EACH ROW
EXECUTE FUNCTION public.prevent_positive_stock_batch_deletion();
