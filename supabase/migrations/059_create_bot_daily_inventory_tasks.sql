-- 059_create_bot_daily_inventory_tasks.sql
-- Tách dữ liệu tác vụ của Zalo Bot mà không thay đổi migration 045.
-- Đồng thời tự sửa trạng thái database cũ từng chạy bản 045 bị đổi tên nhầm.

DO $repair_tables$
BEGIN
    IF TO_REGCLASS('public.daily_inventory_tasks') IS NULL
       AND TO_REGCLASS('public.bot_daily_inventory_tasks') IS NOT NULL THEN
        EXECUTE 'CREATE TABLE public.daily_inventory_tasks
            (LIKE public.bot_daily_inventory_tasks INCLUDING ALL)';
    END IF;
END;
$repair_tables$;

CREATE TABLE IF NOT EXISTS public.bot_daily_inventory_tasks
    (LIKE public.daily_inventory_tasks INCLUDING ALL);

ALTER TABLE public.daily_inventory_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to authenticated users for daily tasks"
    ON public.daily_inventory_tasks;
CREATE POLICY "Allow full access to authenticated users for daily tasks"
    ON public.daily_inventory_tasks
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon select daily tasks"
    ON public.daily_inventory_tasks;
CREATE POLICY "Allow anon select daily tasks"
    ON public.daily_inventory_tasks
    FOR SELECT TO anon
    USING (true);

COMMENT ON TABLE public.bot_daily_inventory_tasks IS
    'Tác vụ kiểm kho dành riêng cho Zalo Bot; tách khỏi luồng kiểm kho hằng ngày của POS.';

ALTER TABLE public.bot_daily_inventory_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to authenticated users for bot daily tasks"
    ON public.bot_daily_inventory_tasks;
CREATE POLICY "Allow full access to authenticated users for bot daily tasks"
    ON public.bot_daily_inventory_tasks
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select bot daily tasks"
    ON public.bot_daily_inventory_tasks;
CREATE POLICY "Allow anon select bot daily tasks"
    ON public.bot_daily_inventory_tasks
    FOR SELECT TO anon
    USING (true);

-- Nếu database cũ chỉ còn bảng bot do migration 045 từng bị sửa sai,
-- trả dữ liệu về bảng POS trước khi tiếp tục tách hai luồng.
INSERT INTO public.daily_inventory_tasks (
    id,
    date,
    cycle_id,
    product_id,
    tag_group,
    expected_quantity,
    counted_quantity,
    status,
    created_at,
    updated_at
)
SELECT
    id,
    date,
    cycle_id,
    product_id,
    tag_group,
    expected_quantity,
    counted_quantity,
    status,
    created_at,
    updated_at
FROM public.bot_daily_inventory_tasks
ON CONFLICT (cycle_id, product_id) DO UPDATE
SET
    date = EXCLUDED.date,
    tag_group = EXCLUDED.tag_group,
    expected_quantity = EXCLUDED.expected_quantity,
    counted_quantity = EXCLUDED.counted_quantity,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

-- Giữ lại lịch sử đã sinh trước khi bot được tách bảng.
INSERT INTO public.bot_daily_inventory_tasks (
    id,
    date,
    cycle_id,
    product_id,
    tag_group,
    expected_quantity,
    counted_quantity,
    status,
    created_at,
    updated_at
)
SELECT
    id,
    date,
    cycle_id,
    product_id,
    tag_group,
    expected_quantity,
    counted_quantity,
    status,
    created_at,
    updated_at
FROM public.daily_inventory_tasks
ON CONFLICT (cycle_id, product_id) DO UPDATE
SET
    date = EXCLUDED.date,
    tag_group = EXCLUDED.tag_group,
    expected_quantity = EXCLUDED.expected_quantity,
    counted_quantity = EXCLUDED.counted_quantity,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

-- Khôi phục đúng hai RPC của POS nếu database từng nhận bản migration 045
-- bị đổi tên. Nội dung giữ nguyên hợp đồng đã có trong migration 045.
CREATE OR REPLACE FUNCTION public.generate_daily_inventory_tasks()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_date DATE := CURRENT_DATE;
    v_cycle_id INTEGER;
    v_days_remaining INTEGER;
    v_ecommerce_count INTEGER;
    v_dose_count INTEGER;
    v_retail_count INTEGER;
    v_ecommerce_target INTEGER;
    v_dose_target INTEGER;
    v_retail_target INTEGER;
BEGIN
    v_cycle_id := FLOOR((v_current_date - '2024-01-01'::DATE) / 20);
    v_days_remaining := 20 - ((v_current_date - '2024-01-01'::DATE) % 20);

    IF EXISTS (
        SELECT 1
        FROM public.daily_inventory_tasks
        WHERE date = v_current_date
    ) THEN
        RETURN JSON_BUILD_OBJECT(
            'status', 'already_generated',
            'cycle_id', v_cycle_id,
            'days_remaining', v_days_remaining
        );
    END IF;

    CREATE TEMP TABLE tmp_products ON COMMIT DROP AS
    SELECT
        id AS product_id,
        CASE
            WHEN description LIKE '%"is_ecommerce":true%'
              OR description LIKE '%"is_ecommerce": true%' THEN 'ecommerce'
            WHEN description LIKE '%"is_dose_cut":true%'
              OR description LIKE '%"is_dose_cut": true%' THEN 'dose_cut'
            ELSE 'retail'
        END AS tag_group
    FROM public.products
    WHERE is_active = true;

    SELECT COUNT(*) INTO v_ecommerce_count
    FROM tmp_products product
    WHERE tag_group = 'ecommerce'
      AND product.product_id NOT IN (
          SELECT product_id
          FROM public.daily_inventory_tasks
          WHERE cycle_id = v_cycle_id
      );
    v_ecommerce_target := CEIL(v_ecommerce_count::NUMERIC / v_days_remaining);
    INSERT INTO public.daily_inventory_tasks (date, cycle_id, product_id, tag_group)
    SELECT v_current_date, v_cycle_id, product_id, 'ecommerce'
    FROM tmp_products product
    WHERE tag_group = 'ecommerce'
      AND product.product_id NOT IN (
          SELECT product_id
          FROM public.daily_inventory_tasks
          WHERE cycle_id = v_cycle_id
      )
    ORDER BY RANDOM()
    LIMIT v_ecommerce_target;

    SELECT COUNT(*) INTO v_dose_count
    FROM tmp_products product
    WHERE tag_group = 'dose_cut'
      AND product.product_id NOT IN (
          SELECT product_id
          FROM public.daily_inventory_tasks
          WHERE cycle_id = v_cycle_id
      );
    v_dose_target := CEIL(v_dose_count::NUMERIC / v_days_remaining);
    INSERT INTO public.daily_inventory_tasks (date, cycle_id, product_id, tag_group)
    SELECT v_current_date, v_cycle_id, product_id, 'dose_cut'
    FROM tmp_products product
    WHERE tag_group = 'dose_cut'
      AND product.product_id NOT IN (
          SELECT product_id
          FROM public.daily_inventory_tasks
          WHERE cycle_id = v_cycle_id
      )
    ORDER BY RANDOM()
    LIMIT v_dose_target;

    SELECT COUNT(*) INTO v_retail_count
    FROM tmp_products product
    WHERE tag_group = 'retail'
      AND product.product_id NOT IN (
          SELECT product_id
          FROM public.daily_inventory_tasks
          WHERE cycle_id = v_cycle_id
      );
    v_retail_target := CEIL(v_retail_count::NUMERIC / v_days_remaining);
    INSERT INTO public.daily_inventory_tasks (date, cycle_id, product_id, tag_group)
    SELECT v_current_date, v_cycle_id, product_id, 'retail'
    FROM tmp_products product
    WHERE tag_group = 'retail'
      AND product.product_id NOT IN (
          SELECT product_id
          FROM public.daily_inventory_tasks
          WHERE cycle_id = v_cycle_id
      )
    ORDER BY RANDOM()
    LIMIT v_retail_target;

    RETURN JSON_BUILD_OBJECT(
        'status', 'success',
        'cycle_id', v_cycle_id,
        'days_remaining', v_days_remaining,
        'generated', JSON_BUILD_OBJECT(
            'ecommerce', v_ecommerce_target,
            'dose_cut', v_dose_target,
            'retail', v_retail_target
        )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_inventory_tasks(
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    task_id UUID,
    product_id UUID,
    tag_group TEXT,
    status TEXT,
    product_name TEXT,
    product_code TEXT,
    base_unit TEXT,
    total_stock NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        task.id,
        task.product_id,
        task.tag_group,
        task.status,
        product.name,
        product.product_code,
        (
            SELECT unit.unit_name
            FROM public.product_units unit
            WHERE unit.product_id = product.id
              AND unit.is_base_unit = true
            LIMIT 1
        ),
        COALESCE((
            SELECT SUM(batch.stock_quantity)
            FROM public.product_batches batch
            WHERE batch.product_id = product.id
        ), 0)::NUMERIC
    FROM public.daily_inventory_tasks task
    JOIN public.products product ON product.id = task.product_id
    WHERE task.date = p_date;
END;
$$;

CREATE OR REPLACE FUNCTION public.bot_generate_daily_inventory_tasks()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Dùng đúng quy tắc chia danh sách đã ổn định của POS, sau đó chụp kết quả
    -- sang vùng dữ liệu riêng của bot.
    v_result := public.generate_daily_inventory_tasks();

    INSERT INTO public.bot_daily_inventory_tasks (
        id,
        date,
        cycle_id,
        product_id,
        tag_group,
        expected_quantity,
        counted_quantity,
        status,
        created_at,
        updated_at
    )
    SELECT
        id,
        date,
        cycle_id,
        product_id,
        tag_group,
        expected_quantity,
        counted_quantity,
        status,
        created_at,
        updated_at
    FROM public.daily_inventory_tasks
    WHERE date = CURRENT_DATE
    ON CONFLICT (cycle_id, product_id) DO UPDATE
    SET
        date = EXCLUDED.date,
        tag_group = EXCLUDED.tag_group,
        expected_quantity = EXCLUDED.expected_quantity,
        counted_quantity = EXCLUDED.counted_quantity,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at;

    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.bot_get_daily_inventory_tasks(
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    task_id UUID,
    product_id UUID,
    tag_group TEXT,
    status TEXT,
    product_name TEXT,
    product_code TEXT,
    base_unit TEXT,
    total_stock NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        task.id,
        task.product_id,
        task.tag_group,
        task.status,
        product.name,
        product.product_code,
        (
            SELECT unit.unit_name
            FROM public.product_units unit
            WHERE unit.product_id = product.id
              AND unit.is_base_unit = true
            LIMIT 1
        ),
        COALESCE((
            SELECT SUM(batch.stock_quantity)
            FROM public.product_batches batch
            WHERE batch.product_id = product.id
        ), 0)::NUMERIC
    FROM public.bot_daily_inventory_tasks task
    JOIN public.products product ON product.id = task.product_id
    WHERE task.date = p_date;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bot_generate_daily_inventory_tasks()
    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_get_daily_inventory_tasks(DATE)
    TO anon, authenticated;
