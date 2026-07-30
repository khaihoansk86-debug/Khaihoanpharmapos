-- Ghi nhận kiểm kê theo từng lô cho danh sách Zalo Bot.
-- Không thay đổi công thức tồn kho; chênh lệch vẫn phải xử lý bằng phiếu kiểm kê đã có.

CREATE TABLE IF NOT EXISTS public.bot_inventory_batch_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL
        REFERENCES public.bot_daily_inventory_tasks(id) ON DELETE CASCADE,
    product_id UUID NOT NULL
        REFERENCES public.products(id) ON DELETE CASCADE,
    batch_id UUID
        REFERENCES public.product_batches(id) ON DELETE SET NULL,
    batch_number_snapshot TEXT NOT NULL,
    expiry_date_snapshot DATE,
    expected_quantity NUMERIC NOT NULL DEFAULT 0,
    counted_quantity NUMERIC,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed')),
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (task_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_bot_inventory_batch_checks_task
    ON public.bot_inventory_batch_checks(task_id);
CREATE INDEX IF NOT EXISTS idx_bot_inventory_batch_checks_batch
    ON public.bot_inventory_batch_checks(batch_id);

ALTER TABLE public.bot_inventory_batch_checks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bot_inventory_batch_checks FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_bot_inventory_batch_checks(
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    check_id UUID,
    task_id UUID,
    product_id UUID,
    tag_group TEXT,
    product_name TEXT,
    product_code TEXT,
    base_unit TEXT,
    batch_id UUID,
    batch_number TEXT,
    expiry_date DATE,
    status TEXT,
    counted_quantity NUMERIC,
    expected_quantity NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        check_row.id,
        task.id,
        task.product_id,
        task.tag_group,
        product.name,
        product.product_code,
        (
            SELECT unit.unit_name
            FROM public.product_units unit
            WHERE unit.product_id = product.id
              AND unit.is_base_unit = true
            LIMIT 1
        ),
        check_row.batch_id,
        check_row.batch_number_snapshot,
        check_row.expiry_date_snapshot,
        check_row.status,
        check_row.counted_quantity,
        CASE
            WHEN check_row.status = 'completed' THEN check_row.expected_quantity
            ELSE NULL
        END
    FROM public.bot_inventory_batch_checks check_row
    JOIN public.bot_daily_inventory_tasks task ON task.id = check_row.task_id
    JOIN public.products product ON product.id = task.product_id
    WHERE task.date = p_date
    ORDER BY task.tag_group, product.name, check_row.expiry_date_snapshot, check_row.batch_number_snapshot;
$$;

CREATE OR REPLACE FUNCTION public.complete_bot_inventory_batch_check(
    p_check_id UUID,
    p_counted_quantity NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_check public.bot_inventory_batch_checks%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Bạn cần đăng nhập để xác nhận kiểm kê.';
    END IF;
    IF p_counted_quantity IS NULL OR p_counted_quantity < 0 THEN
        RAISE EXCEPTION 'Số lượng thực đếm không hợp lệ.';
    END IF;

    UPDATE public.bot_inventory_batch_checks
    SET
        counted_quantity = p_counted_quantity,
        status = 'completed',
        completed_at = timezone('utc'::text, now()),
        completed_by = auth.uid(),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_check_id
    RETURNING * INTO v_check;

    IF v_check.id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy lô được giao kiểm kê.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.bot_inventory_batch_checks sibling
        WHERE sibling.task_id = v_check.task_id
          AND sibling.status <> 'completed'
    ) THEN
        UPDATE public.bot_daily_inventory_tasks
        SET
            status = 'completed',
            counted_quantity = (
                SELECT COALESCE(SUM(sibling.counted_quantity), 0)
                FROM public.bot_inventory_batch_checks sibling
                WHERE sibling.task_id = v_check.task_id
            ),
            updated_at = timezone('utc'::text, now())
        WHERE id = v_check.task_id;
    END IF;

    RETURN jsonb_build_object(
        'status', 'completed',
        'check_id', v_check.id,
        'task_id', v_check.task_id,
        'has_difference', v_check.expected_quantity <> p_counted_quantity,
        'difference', p_counted_quantity - v_check.expected_quantity
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_bot_inventory_batch_checks(DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_bot_inventory_batch_check(UUID, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_bot_inventory_batch_checks(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_bot_inventory_batch_check(UUID, NUMERIC) TO authenticated;

COMMENT ON TABLE public.bot_inventory_batch_checks IS
    'Ảnh chụp và kết quả kiểm đếm theo từng lô của nhiệm vụ Zalo Bot; không trực tiếp thay đổi tồn kho.';
