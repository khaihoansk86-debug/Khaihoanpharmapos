-- 045_create_daily_inventory_tasks.sql

CREATE TABLE IF NOT EXISTS public.daily_inventory_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    cycle_id INTEGER NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    tag_group TEXT NOT NULL, -- 'ecommerce', 'dose_cut', 'retail'
    expected_quantity NUMERIC DEFAULT 0,
    counted_quantity NUMERIC,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(cycle_id, product_id)
);

-- Bật RLS
ALTER TABLE public.daily_inventory_tasks ENABLE ROW LEVEL SECURITY;

-- Policy (tương tự inventory_documents)
CREATE POLICY "Allow full access to authenticated users for daily tasks" 
ON public.daily_inventory_tasks FOR ALL TO authenticated USING (true);

-- Bỏ qua policy cho anon nếu hệ thống yêu cầu auth, nhưng có thể thêm nếu cần:
CREATE POLICY "Allow anon select daily tasks" 
ON public.daily_inventory_tasks FOR SELECT TO anon USING (true);

-- Function để generate task hằng ngày
CREATE OR REPLACE FUNCTION public.generate_daily_inventory_tasks()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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
    -- Tính toán cycle (mỗi 20 ngày, bắt đầu từ một mốc cố định)
    v_cycle_id := FLOOR((v_current_date - '2024-01-01'::date) / 20);
    v_days_remaining := 20 - ((v_current_date - '2024-01-01'::date) % 20);

    -- Kiểm tra xem hôm nay đã có task chưa (cho cycle hiện tại), nếu có thì bỏ qua bước generate.
    IF EXISTS (SELECT 1 FROM public.daily_inventory_tasks WHERE date = v_current_date) THEN
        RETURN json_build_object('status', 'already_generated', 'cycle_id', v_cycle_id, 'days_remaining', v_days_remaining);
    END IF;

    -- Bảng tạm chứa tất cả products và phân loại tag để tối ưu query
    CREATE TEMP TABLE tmp_products ON COMMIT DROP AS
    SELECT 
        id as product_id,
        CASE 
            WHEN description LIKE '%"is_ecommerce":true%' OR description LIKE '%"is_ecommerce": true%' THEN 'ecommerce'
            WHEN description LIKE '%"is_dose_cut":true%' OR description LIKE '%"is_dose_cut": true%' THEN 'dose_cut'
            ELSE 'retail'
        END as tag_group
    FROM public.products
    WHERE is_active = true;

    -- Ecommerce
    SELECT count(*) INTO v_ecommerce_count FROM tmp_products p 
    WHERE tag_group = 'ecommerce' 
      AND p.product_id NOT IN (SELECT product_id FROM public.daily_inventory_tasks WHERE cycle_id = v_cycle_id);
    
    v_ecommerce_target := CEIL(v_ecommerce_count::numeric / v_days_remaining);

    INSERT INTO public.daily_inventory_tasks (date, cycle_id, product_id, tag_group)
    SELECT v_current_date, v_cycle_id, product_id, 'ecommerce'
    FROM tmp_products p
    WHERE tag_group = 'ecommerce'
      AND p.product_id NOT IN (SELECT product_id FROM public.daily_inventory_tasks WHERE cycle_id = v_cycle_id)
    ORDER BY random()
    LIMIT v_ecommerce_target;

    -- Dose cut
    SELECT count(*) INTO v_dose_count FROM tmp_products p 
    WHERE tag_group = 'dose_cut' 
      AND p.product_id NOT IN (SELECT product_id FROM public.daily_inventory_tasks WHERE cycle_id = v_cycle_id);
    
    v_dose_target := CEIL(v_dose_count::numeric / v_days_remaining);

    INSERT INTO public.daily_inventory_tasks (date, cycle_id, product_id, tag_group)
    SELECT v_current_date, v_cycle_id, product_id, 'dose_cut'
    FROM tmp_products p
    WHERE tag_group = 'dose_cut'
      AND p.product_id NOT IN (SELECT product_id FROM public.daily_inventory_tasks WHERE cycle_id = v_cycle_id)
    ORDER BY random()
    LIMIT v_dose_target;

    -- Retail
    SELECT count(*) INTO v_retail_count FROM tmp_products p 
    WHERE tag_group = 'retail' 
      AND p.product_id NOT IN (SELECT product_id FROM public.daily_inventory_tasks WHERE cycle_id = v_cycle_id);
    
    v_retail_target := CEIL(v_retail_count::numeric / v_days_remaining);

    INSERT INTO public.daily_inventory_tasks (date, cycle_id, product_id, tag_group)
    SELECT v_current_date, v_cycle_id, product_id, 'retail'
    FROM tmp_products p
    WHERE tag_group = 'retail'
      AND p.product_id NOT IN (SELECT product_id FROM public.daily_inventory_tasks WHERE cycle_id = v_cycle_id)
    ORDER BY random()
    LIMIT v_retail_target;

    RETURN json_build_object(
        'status', 'success', 
        'cycle_id', v_cycle_id, 
        'days_remaining', v_days_remaining,
        'generated', json_build_object(
            'ecommerce', v_ecommerce_target,
            'dose_cut', v_dose_target,
            'retail', v_retail_target
        )
    );
END;
$$;

-- Function để đọc danh sách kiểm kê hôm nay kèm thông tin sản phẩm và tồn kho
CREATE OR REPLACE FUNCTION public.get_daily_inventory_tasks(p_date DATE DEFAULT CURRENT_DATE)
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
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as task_id,
        t.product_id,
        t.tag_group,
        t.status,
        p.name as product_name,
        p.product_code as product_code,
        (SELECT pu.unit_name FROM public.product_units pu WHERE pu.product_id = p.id AND pu.is_base_unit = true LIMIT 1) as base_unit,
        COALESCE((SELECT SUM(pb.stock_quantity) FROM public.product_batches pb WHERE pb.product_id = p.id), 0) as total_stock
    FROM public.daily_inventory_tasks t
    JOIN public.products p ON t.product_id = p.id
    WHERE t.date = p_date;
END;
$$;
