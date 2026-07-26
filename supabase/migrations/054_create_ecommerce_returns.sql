-- 054_create_ecommerce_returns.sql
-- Phiếu hoàn TMĐT độc lập, đồng thời ghi bút toán âm vào orders/order_items
-- để báo cáo hiện có tự giảm số lượng và giá vốn TMĐT.

CREATE TABLE IF NOT EXISTS public.ecommerce_returns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    return_code text NOT NULL UNIQUE,
    ecommerce_platform text NOT NULL,
    tracking_code text NOT NULL,
    tracking_code_normalized text NOT NULL,
    received_at timestamptz NOT NULL DEFAULT now(),
    status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id),
    total_cost numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
    note text,
    created_by_name text,
    confirmed_at timestamptz NOT NULL DEFAULT now(),
    cancelled_at timestamptz,
    cancellation_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (ecommerce_platform, tracking_code_normalized)
);

CREATE TABLE IF NOT EXISTS public.ecommerce_return_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ecommerce_return_id uuid NOT NULL REFERENCES public.ecommerce_returns(id) ON DELETE CASCADE,
    order_item_id uuid NOT NULL UNIQUE REFERENCES public.order_items(id),
    product_id uuid NOT NULL REFERENCES public.products(id),
    batch_id uuid NOT NULL REFERENCES public.product_batches(id),
    product_name text NOT NULL,
    product_code text,
    batch_number text,
    expiry_date date,
    unit_name text NOT NULL,
    quantity numeric(14, 3) NOT NULL CHECK (quantity > 0),
    conversion_rate numeric(14, 3) NOT NULL CHECK (conversion_rate > 0),
    quantity_base numeric(14, 3) NOT NULL CHECK (quantity_base > 0),
    cost_price_snapshot numeric(14, 2) NOT NULL DEFAULT 0 CHECK (cost_price_snapshot >= 0),
    total_cost numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_returns_received_at
    ON public.ecommerce_returns(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_ecommerce_returns_status_platform
    ON public.ecommerce_returns(status, ecommerce_platform, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_ecommerce_return_items_return
    ON public.ecommerce_return_items(ecommerce_return_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_return_items_product_batch
    ON public.ecommerce_return_items(product_id, batch_id);

ALTER TABLE public.ecommerce_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_return_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read ecommerce returns" ON public.ecommerce_returns;
CREATE POLICY "Read ecommerce returns"
    ON public.ecommerce_returns FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Read ecommerce return items" ON public.ecommerce_return_items;
CREATE POLICY "Read ecommerce return items"
    ON public.ecommerce_return_items FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.ecommerce_returns TO anon, authenticated;
GRANT SELECT ON public.ecommerce_return_items TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_ecommerce_return(
    p_return jsonb,
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_platform text;
    v_tracking_code text;
    v_tracking_normalized text;
    v_received_at timestamptz;
    v_note text;
    v_created_by_name text;
    v_return_id uuid := gen_random_uuid();
    v_order_id uuid := gen_random_uuid();
    v_return_code text;
    v_item jsonb;
    v_product_id uuid;
    v_batch_id uuid;
    v_unit_name text;
    v_quantity numeric(14, 3);
    v_conversion_rate numeric(14, 3);
    v_quantity_base numeric(14, 3);
    v_base_cost numeric(14, 2);
    v_unit_cost numeric(14, 2);
    v_line_cost numeric(14, 2);
    v_total_cost numeric(14, 2) := 0;
    v_order_item_id uuid;
    v_batch record;
BEGIN
    IF p_return IS NULL OR jsonb_typeof(p_return) <> 'object' THEN
        RAISE EXCEPTION 'Thông tin phiếu hoàn không hợp lệ.';
    END IF;
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
       OR jsonb_array_length(p_items) = 0
       OR jsonb_array_length(p_items) > 100 THEN
        RAISE EXCEPTION 'Phiếu hoàn phải có từ 1 đến 100 dòng sản phẩm.';
    END IF;

    v_platform := CASE lower(btrim(COALESCE(p_return->>'ecommerce_platform', '')))
        WHEN 'shopee' THEN 'Shopee'
        WHEN 'tiktok' THEN 'TikTok Shop'
        WHEN 'tiktok shop' THEN 'TikTok Shop'
        WHEN 'lazada' THEN 'Lazada'
        WHEN 'website' THEN 'Website'
        WHEN 'khác' THEN 'Khác'
        WHEN 'khac' THEN 'Khác'
        ELSE NULL
    END;
    IF v_platform IS NULL THEN
        RAISE EXCEPTION 'Nền tảng TMĐT không hợp lệ.';
    END IF;

    v_tracking_code := btrim(COALESCE(p_return->>'tracking_code', ''));
    IF length(v_tracking_code) = 0 OR length(v_tracking_code) > 100 THEN
        RAISE EXCEPTION 'Mã vận đơn phải có từ 1 đến 100 ký tự.';
    END IF;
    v_tracking_normalized := regexp_replace(upper(v_tracking_code), '[^A-Z0-9]', '', 'g');
    IF length(v_tracking_normalized) = 0 THEN
        RAISE EXCEPTION 'Mã vận đơn không hợp lệ.';
    END IF;

    BEGIN
        v_received_at := COALESCE(NULLIF(p_return->>'received_at', '')::timestamptz, now());
    EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN
        RAISE EXCEPTION 'Ngày nhận hoàn không hợp lệ.';
    END;
    IF v_received_at > now() + interval '1 day' THEN
        RAISE EXCEPTION 'Ngày nhận hoàn không được ở tương lai.';
    END IF;

    v_note := NULLIF(btrim(COALESCE(p_return->>'note', '')), '');
    v_created_by_name := NULLIF(btrim(COALESCE(p_return->>'created_by_name', '')), '');
    IF length(COALESCE(v_note, '')) > 1000 OR length(COALESCE(v_created_by_name, '')) > 100 THEN
        RAISE EXCEPTION 'Ghi chú hoặc tên người lập quá dài.';
    END IF;

    v_return_code := 'ECR-' || to_char(clock_timestamp(), 'YYYYMMDD-HH24MISS-')
        || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

    INSERT INTO public.orders (
        id, order_code, customer_name, subtotal, discount, total,
        amount_received, change_amount, note, status, order_type,
        ecommerce_platform, payment_method
    ) VALUES (
        v_order_id,
        v_return_code,
        'Hoàn TMĐT - ' || v_platform,
        0, 0, 0, 0, 0,
        'Phiếu hoàn TMĐT - Mã vận đơn: ' || v_tracking_code
            || CASE WHEN v_note IS NULL THEN '' ELSE ' - ' || v_note END,
        'draft',
        'ecommerce',
        v_platform,
        'other'
    );

    INSERT INTO public.ecommerce_returns (
        id, return_code, ecommerce_platform, tracking_code,
        tracking_code_normalized, received_at, status, order_id,
        total_cost, note, created_by_name, confirmed_at
    ) VALUES (
        v_return_id, v_return_code, v_platform, v_tracking_code,
        v_tracking_normalized, v_received_at, 'completed', v_order_id,
        0, v_note, v_created_by_name, now()
    );

    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_items)
        ORDER BY value->>'batch_id', value->>'product_id', value->>'unit_name'
    LOOP
        BEGIN
            v_product_id := (v_item->>'product_id')::uuid;
            v_batch_id := (v_item->>'batch_id')::uuid;
        EXCEPTION WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'Sản phẩm hoặc lô hàng không hợp lệ.';
        END;

        v_unit_name := btrim(COALESCE(v_item->>'unit_name', ''));
        BEGIN
            v_quantity := (v_item->>'quantity')::numeric;
        EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
            RAISE EXCEPTION 'Số lượng hoàn không hợp lệ.';
        END;
        IF v_quantity IS NULL OR v_quantity <= 0 OR v_quantity > 1000000 THEN
            RAISE EXCEPTION 'Số lượng hoàn phải lớn hơn 0.';
        END IF;

        SELECT pu.conversion_rate
        INTO v_conversion_rate
        FROM public.product_units pu
        WHERE pu.product_id = v_product_id
          AND pu.unit_name = v_unit_name
        ORDER BY pu.is_base_unit DESC
        LIMIT 1;
        IF v_conversion_rate IS NULL OR v_conversion_rate <= 0 THEN
            RAISE EXCEPTION 'Đơn vị % không thuộc sản phẩm đã chọn.', v_unit_name;
        END IF;

        SELECT
            pb.id, pb.product_id, pb.batch_number, pb.expiry_date,
            pb.stock_quantity, pb.cost_price,
            p.name AS product_name, p.product_code
        INTO v_batch
        FROM public.product_batches pb
        JOIN public.products p ON p.id = pb.product_id
        WHERE pb.id = v_batch_id
          AND pb.product_id = v_product_id
        FOR UPDATE OF pb;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Lô hàng không thuộc sản phẩm đã chọn.';
        END IF;

        SELECT COALESCE(
            NULLIF(v_batch.cost_price, 0),
            NULLIF((
                SELECT pu.cost_price
                FROM public.product_units pu
                WHERE pu.product_id = v_product_id
                ORDER BY pu.is_base_unit DESC, pu.conversion_rate ASC
                LIMIT 1
            ), 0),
            0
        ) INTO v_base_cost;

        v_quantity_base := round(v_quantity * v_conversion_rate, 3);
        v_unit_cost := round(v_base_cost * v_conversion_rate, 2);
        v_line_cost := round(v_quantity * v_unit_cost, 2);
        v_total_cost := v_total_cost + v_line_cost;
        v_order_item_id := gen_random_uuid();

        UPDATE public.product_batches
        SET stock_quantity = stock_quantity + v_quantity_base
        WHERE id = v_batch_id;

        INSERT INTO public.order_items (
            id, order_id, product_id, batch_id, product_name, product_code,
            unit_name, unit_price, quantity, total_price, cost_price_snapshot,
            batch_allocations, line_type, parent_order_item_id, sort_index
        ) VALUES (
            v_order_item_id, v_order_id, v_product_id, v_batch_id,
            v_batch.product_name, v_batch.product_code, v_unit_name,
            v_unit_cost, -v_quantity, -v_line_cost, v_unit_cost,
            jsonb_build_array(jsonb_build_object(
                'batch_id', v_batch_id,
                'batch_number', v_batch.batch_number,
                'expiry_date', v_batch.expiry_date,
                'quantity_base', -v_quantity_base,
                'cost_price', v_base_cost
            )),
            'standard', NULL, jsonb_array_length(p_items) * 100
        );

        INSERT INTO public.ecommerce_return_items (
            ecommerce_return_id, order_item_id, product_id, batch_id,
            product_name, product_code, batch_number, expiry_date,
            unit_name, quantity, conversion_rate, quantity_base,
            cost_price_snapshot, total_cost
        ) VALUES (
            v_return_id, v_order_item_id, v_product_id, v_batch_id,
            v_batch.product_name, v_batch.product_code, v_batch.batch_number,
            v_batch.expiry_date, v_unit_name, v_quantity, v_conversion_rate,
            v_quantity_base, v_unit_cost, v_line_cost
        );

        INSERT INTO public.inventory_movements (
            product_id, batch_id, movement_type, quantity_base,
            cost_price, reason, note
        ) VALUES (
            v_product_id, v_batch_id, 'ecommerce_return', v_quantity_base,
            v_base_cost, 'ecommerce_return',
            '[' || v_return_code || '] Hoàn TMĐT - ' || v_tracking_code
        );
    END LOOP;

    UPDATE public.orders
    SET subtotal = -v_total_cost,
        total = -v_total_cost,
        status = 'completed'
    WHERE id = v_order_id;

    UPDATE public.ecommerce_returns
    SET total_cost = v_total_cost,
        updated_at = now()
    WHERE id = v_return_id;

    RETURN jsonb_build_object(
        'id', v_return_id,
        'return_code', v_return_code,
        'order_id', v_order_id,
        'total_cost', v_total_cost,
        'status', 'completed'
    );
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Mã vận đơn này đã được lập phiếu hoàn trên nền tảng đã chọn.';
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_ecommerce_return(
    p_return_id uuid,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_return public.ecommerce_returns%ROWTYPE;
    v_item public.ecommerce_return_items%ROWTYPE;
    v_stock numeric(14, 3);
    v_reason text := btrim(COALESCE(p_reason, ''));
BEGIN
    IF p_return_id IS NULL THEN
        RAISE EXCEPTION 'Phiếu hoàn không hợp lệ.';
    END IF;
    IF length(v_reason) = 0 OR length(v_reason) > 500 THEN
        RAISE EXCEPTION 'Lý do hủy phải có từ 1 đến 500 ký tự.';
    END IF;

    SELECT * INTO v_return
    FROM public.ecommerce_returns
    WHERE id = p_return_id
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy phiếu hoàn.'; END IF;
    IF v_return.status = 'cancelled' THEN RAISE EXCEPTION 'Phiếu hoàn đã được hủy trước đó.'; END IF;

    FOR v_item IN
        SELECT *
        FROM public.ecommerce_return_items
        WHERE ecommerce_return_id = p_return_id
        ORDER BY batch_id
    LOOP
        SELECT stock_quantity INTO v_stock
        FROM public.product_batches
        WHERE id = v_item.batch_id
        FOR UPDATE;

        IF v_stock IS NULL OR v_stock < v_item.quantity_base THEN
            RAISE EXCEPTION 'Không thể hủy phiếu hoàn: tồn kho lô % không còn đủ để đảo lại.', COALESCE(v_item.batch_number, '---');
        END IF;

        UPDATE public.product_batches
        SET stock_quantity = stock_quantity - v_item.quantity_base
        WHERE id = v_item.batch_id;

        INSERT INTO public.inventory_movements (
            product_id, batch_id, movement_type, quantity_base,
            cost_price, reason, note
        ) VALUES (
            v_item.product_id, v_item.batch_id, 'cancel_ecommerce_return',
            -v_item.quantity_base,
            CASE WHEN v_item.conversion_rate > 0
                THEN v_item.cost_price_snapshot / v_item.conversion_rate
                ELSE 0 END,
            'cancel_ecommerce_return',
            '[' || v_return.return_code || '] Hủy hoàn TMĐT - ' || v_reason
        );
    END LOOP;

    UPDATE public.orders
    SET status = 'cancelled',
        note = COALESCE(note, '') || ' [HỦY PHIẾU HOÀN: ' || v_reason || ']'
    WHERE id = v_return.order_id;

    UPDATE public.ecommerce_returns
    SET status = 'cancelled',
        cancelled_at = now(),
        cancellation_reason = v_reason,
        updated_at = now()
    WHERE id = p_return_id;

    RETURN jsonb_build_object(
        'id', p_return_id,
        'return_code', v_return.return_code,
        'status', 'cancelled'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_ecommerce_return(jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_ecommerce_return(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_ecommerce_return(jsonb, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_ecommerce_return(uuid, text) TO anon, authenticated;
