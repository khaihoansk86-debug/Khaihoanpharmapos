-- 072_materialize_pos_custom_item.sql
-- Tạo mặt hàng ngoài danh mục, đơn vị cơ sở và lô tạm trong cùng transaction.
-- Mã sản phẩm được suy ra từ khóa idempotency của hóa đơn + dòng giỏ hàng để
-- retry sau mất mạng không tạo thêm sản phẩm.

CREATE OR REPLACE FUNCTION public.materialize_pos_custom_item(
    p_idempotency_key TEXT,
    p_item JSONB,
    p_context JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_idempotency_key TEXT := BTRIM(COALESCE(p_idempotency_key, ''));
    v_name TEXT := BTRIM(COALESCE(p_item->>'name', ''));
    v_unit_name TEXT := BTRIM(COALESCE(p_item->>'unit_name', ''));
    v_unit_price NUMERIC := COALESCE((p_item->>'unit_price')::NUMERIC, 0);
    v_cost_price NUMERIC := COALESCE((p_item->>'cost_price')::NUMERIC, 0);
    v_stock_quantity NUMERIC := COALESCE((p_item->>'stock_quantity')::NUMERIC, 0);
    v_product_code TEXT;
    v_batch_number TEXT;
    v_description JSONB;
    v_existing_description TEXT;
    v_product_id UUID;
    v_unit_id UUID;
    v_batch_id UUID;
BEGIN
    IF v_idempotency_key = '' OR CHAR_LENGTH(v_idempotency_key) > 255 THEN
        RAISE EXCEPTION 'Khóa tạo mặt hàng ngoài danh mục không hợp lệ.';
    END IF;
    IF v_name = '' OR CHAR_LENGTH(v_name) > 255 THEN
        RAISE EXCEPTION 'Tên mặt hàng ngoài danh mục không hợp lệ.';
    END IF;
    IF v_unit_name = '' OR CHAR_LENGTH(v_unit_name) > 100 THEN
        RAISE EXCEPTION 'Đơn vị mặt hàng ngoài danh mục không hợp lệ.';
    END IF;
    IF v_unit_price < 0 OR v_unit_price > 1000000000000 THEN
        RAISE EXCEPTION 'Đơn giá mặt hàng ngoài danh mục không hợp lệ.';
    END IF;
    IF v_cost_price < 0 OR v_cost_price > 1000000000000 THEN
        RAISE EXCEPTION 'Giá vốn mặt hàng ngoài danh mục không hợp lệ.';
    END IF;
    IF v_stock_quantity <= 0 OR v_stock_quantity > 1000000000 THEN
        RAISE EXCEPTION 'Số lượng mặt hàng ngoài danh mục không hợp lệ.';
    END IF;

    v_product_code := 'CUSTOM-' || UPPER(SUBSTRING(MD5(v_idempotency_key), 1, 16));
    v_batch_number := 'LO-POS-' || UPPER(SUBSTRING(MD5(v_idempotency_key), 1, 12));
    v_description := JSONB_BUILD_OBJECT(
        'is_one_time', true,
        'note', 'Tạo tự động từ POS',
        'pos_custom_item_key', v_idempotency_key,
        'is_ecommerce', COALESCE((p_context->>'is_ecommerce')::BOOLEAN, false),
        'is_internal', COALESCE((p_context->>'is_internal')::BOOLEAN, false),
        'is_dose_cut', COALESCE((p_context->>'is_dose_cut')::BOOLEAN, false)
    );

    INSERT INTO public.products (
        product_code,
        name,
        category_id,
        description,
        is_active
    )
    VALUES (
        v_product_code,
        v_name,
        NULL,
        v_description::TEXT,
        true
    )
    ON CONFLICT (product_code) DO NOTHING;

    SELECT id, description
    INTO v_product_id, v_existing_description
    FROM public.products
    WHERE product_code = v_product_code;

    IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'Không thể tạo mặt hàng ngoài danh mục.';
    END IF;
    IF COALESCE((v_existing_description::JSONB)->>'pos_custom_item_key', '') <> v_idempotency_key THEN
        RAISE EXCEPTION 'Mã mặt hàng ngoài danh mục đã được sử dụng.';
    END IF;

    SELECT id
    INTO v_unit_id
    FROM public.product_units
    WHERE product_id = v_product_id
      AND is_base_unit = true
      AND conversion_rate = 1
    ORDER BY id
    LIMIT 1;

    IF v_unit_id IS NULL THEN
        INSERT INTO public.product_units (
            product_id,
            unit_name,
            retail_price,
            cost_price,
            conversion_rate,
            is_base_unit
        )
        VALUES (
            v_product_id,
            v_unit_name,
            v_unit_price,
            v_cost_price,
            1,
            true
        )
        RETURNING id INTO v_unit_id;
    END IF;

    SELECT id
    INTO v_batch_id
    FROM public.product_batches
    WHERE product_id = v_product_id
      AND batch_number = v_batch_number
    ORDER BY id
    LIMIT 1;

    IF v_batch_id IS NULL THEN
        INSERT INTO public.product_batches (
            product_id,
            batch_number,
            stock_quantity,
            expiry_date,
            is_tracked
        )
        VALUES (
            v_product_id,
            v_batch_number,
            v_stock_quantity,
            NULL,
            true
        )
        RETURNING id INTO v_batch_id;
    END IF;

    RETURN JSONB_BUILD_OBJECT(
        'product_id', v_product_id,
        'batch_id', v_batch_id,
        'product_code', v_product_code,
        'product_name', v_name
    );
END;
$$;

REVOKE ALL ON FUNCTION public.materialize_pos_custom_item(TEXT, JSONB, JSONB)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.materialize_pos_custom_item(TEXT, JSONB, JSONB)
    TO authenticated;
