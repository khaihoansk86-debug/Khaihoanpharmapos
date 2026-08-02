-- 060_save_product_variant_atomic.sql
-- Lưu thông tin SKU, đơn vị quy đổi và lô trong cùng một transaction RPC.

CREATE OR REPLACE FUNCTION public.save_product_variant_atomic(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_product_id UUID;
    v_parent_id UUID;
    v_parent_name TEXT;
    v_variant_label TEXT := BTRIM(COALESCE(p_payload->>'variant_label', ''));
    v_product_code TEXT := BTRIM(COALESCE(p_payload->>'product_code', ''));
    v_barcode TEXT := NULLIF(BTRIM(COALESCE(p_payload->>'barcode', '')), '');
    v_manage_packaging BOOLEAN := COALESCE((p_payload->>'manage_packaging')::BOOLEAN, false);
    v_manage_batches BOOLEAN := COALESCE((p_payload->>'manage_batches')::BOOLEAN, true);
    v_base_cost NUMERIC := GREATEST(COALESCE((p_payload->>'base_cost')::NUMERIC, 0), 0);
    v_base_retail NUMERIC := GREATEST(COALESCE((p_payload->>'base_retail')::NUMERIC, 0), 0);
    v_unit JSONB;
    v_unit_id UUID;
    v_keep_unit_ids UUID[] := ARRAY[]::UUID[];
    v_batch JSONB;
    v_batch_id UUID;
    v_keep_batch_ids UUID[] := ARRAY[]::UUID[];
BEGIN
    IF v_variant_label = '' THEN
        RAISE EXCEPTION 'Vui lòng nhập tên biến thể / SKU.';
    END IF;
    IF v_product_code = '' THEN
        RAISE EXCEPTION 'Vui lòng nhập mã SKU.';
    END IF;

    IF NULLIF(p_payload->>'product_id', '') IS NULL THEN
        v_parent_id := NULLIF(p_payload->>'parent_id', '')::UUID;
        IF v_parent_id IS NULL THEN
            RAISE EXCEPTION 'Thiếu nhóm sản phẩm cha của SKU mới.';
        END IF;

        SELECT parent.name
        INTO v_parent_name
        FROM public.products parent
        WHERE parent.id = v_parent_id
          AND parent.parent_id IS NULL;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Không tìm thấy nhóm sản phẩm cha.';
        END IF;

        INSERT INTO public.products (
            category_id,
            product_code,
            barcode,
            name,
            is_active,
            is_direct_sale,
            active_ingredient,
            concentration,
            manufacturer,
            route_of_admin,
            packaging_spec,
            description,
            supplier_id,
            parent_id,
            variant_label,
            dosage_form,
            variant_values
        )
        SELECT
            parent.category_id,
            v_product_code,
            v_barcode,
            parent.name || ' - ' || v_variant_label,
            true,
            true,
            parent.active_ingredient,
            NULLIF(BTRIM(COALESCE(p_payload->>'concentration', '')), ''),
            parent.manufacturer,
            parent.route_of_admin,
            NULLIF(BTRIM(COALESCE(p_payload->>'packaging_spec', '')), ''),
            NULL,
            parent.supplier_id,
            parent.id,
            v_variant_label,
            NULLIF(BTRIM(COALESCE(p_payload->>'dosage_form', '')), ''),
            COALESCE(p_payload->'variant_values', '{}'::JSONB)
        FROM public.products parent
        WHERE parent.id = v_parent_id
        RETURNING id INTO v_product_id;
    ELSE
        v_product_id := (p_payload->>'product_id')::UUID;

        SELECT parent.name
        INTO v_parent_name
        FROM public.products child
        LEFT JOIN public.products parent ON parent.id = child.parent_id
        WHERE child.id = v_product_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Không tìm thấy SKU cần cập nhật.';
        END IF;

        UPDATE public.products
        SET
            name = CASE
                WHEN NULLIF(BTRIM(COALESCE(v_parent_name, '')), '') IS NULL
                    THEN v_variant_label
                ELSE v_parent_name || ' - ' || v_variant_label
            END,
            variant_label = v_variant_label,
            product_code = v_product_code,
            barcode = v_barcode,
            concentration = NULLIF(BTRIM(COALESCE(p_payload->>'concentration', '')), ''),
            dosage_form = NULLIF(BTRIM(COALESCE(p_payload->>'dosage_form', '')), ''),
            variant_values = COALESCE(p_payload->'variant_values', '{}'::JSONB),
            packaging_spec = CASE
                WHEN v_manage_packaging
                    THEN NULLIF(BTRIM(COALESCE(p_payload->>'packaging_spec', '')), '')
                ELSE packaging_spec
            END
        WHERE id = v_product_id;
    END IF;

    IF v_manage_packaging THEN
        IF JSONB_TYPEOF(COALESCE(p_payload->'units', '[]'::JSONB)) <> 'array'
           OR JSONB_ARRAY_LENGTH(COALESCE(p_payload->'units', '[]'::JSONB)) = 0 THEN
            RAISE EXCEPTION 'Quy cách SKU phải có ít nhất một đơn vị tính.';
        END IF;

        FOR v_unit IN
            SELECT value
            FROM JSONB_ARRAY_ELEMENTS(p_payload->'units')
        LOOP
            IF BTRIM(COALESCE(v_unit->>'unit_name', '')) = ''
               OR COALESCE((v_unit->>'conversion_rate')::NUMERIC, 0) <= 0 THEN
                RAISE EXCEPTION 'Tên đơn vị và tỷ lệ quy đổi phải hợp lệ.';
            END IF;

            v_unit_id := NULLIF(v_unit->>'id', '')::UUID;
            IF v_unit_id IS NULL THEN
                INSERT INTO public.product_units (
                    product_id,
                    unit_name,
                    conversion_rate,
                    cost_price,
                    retail_price,
                    is_base_unit
                )
                VALUES (
                    v_product_id,
                    BTRIM(v_unit->>'unit_name'),
                    (v_unit->>'conversion_rate')::INTEGER,
                    v_base_cost * (v_unit->>'conversion_rate')::NUMERIC,
                    v_base_retail * (v_unit->>'conversion_rate')::NUMERIC,
                    COALESCE((v_unit->>'is_base_unit')::BOOLEAN, false)
                )
                RETURNING id INTO v_unit_id;
            ELSE
                UPDATE public.product_units
                SET
                    unit_name = BTRIM(v_unit->>'unit_name'),
                    conversion_rate = (v_unit->>'conversion_rate')::INTEGER,
                    cost_price = v_base_cost * (v_unit->>'conversion_rate')::NUMERIC,
                    retail_price = v_base_retail * (v_unit->>'conversion_rate')::NUMERIC,
                    is_base_unit = COALESCE((v_unit->>'is_base_unit')::BOOLEAN, false)
                WHERE id = v_unit_id
                  AND product_id = v_product_id;
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Đơn vị tính không thuộc SKU đang sửa.';
                END IF;
            END IF;
            v_keep_unit_ids := ARRAY_APPEND(v_keep_unit_ids, v_unit_id);
        END LOOP;

        IF (
            SELECT COUNT(*)
            FROM public.product_units
            WHERE product_id = v_product_id
              AND id = ANY(v_keep_unit_ids)
              AND is_base_unit = true
              AND conversion_rate = 1
        ) <> 1 THEN
            RAISE EXCEPTION 'SKU phải có đúng một đơn vị tồn cơ sở với tỷ lệ quy đổi bằng 1.';
        END IF;

        DELETE FROM public.product_units
        WHERE product_id = v_product_id
          AND NOT (id = ANY(v_keep_unit_ids));
    ELSE
        UPDATE public.product_units
        SET
            cost_price = v_base_cost * conversion_rate,
            retail_price = v_base_retail * conversion_rate
        WHERE product_id = v_product_id;

        IF NOT FOUND THEN
            INSERT INTO public.product_units (
                product_id,
                unit_name,
                conversion_rate,
                cost_price,
                retail_price,
                is_base_unit
            )
            VALUES (
                v_product_id,
                COALESCE(NULLIF(BTRIM(p_payload->>'base_unit_name'), ''), 'Đơn vị'),
                1,
                v_base_cost,
                v_base_retail,
                true
            );
        END IF;
    END IF;

    IF v_manage_batches THEN
        IF JSONB_TYPEOF(COALESCE(p_payload->'batches', '[]'::JSONB)) <> 'array' THEN
            RAISE EXCEPTION 'Danh sách lô hàng không hợp lệ.';
        END IF;

        FOR v_batch IN
            SELECT value
            FROM JSONB_ARRAY_ELEMENTS(COALESCE(p_payload->'batches', '[]'::JSONB))
        LOOP
            IF NULLIF(v_batch->>'expiry_date', '') IS NULL THEN
                RAISE EXCEPTION 'Lô hàng phải có hạn sử dụng.';
            END IF;

            v_batch_id := NULLIF(v_batch->>'id', '')::UUID;
            IF v_batch_id IS NULL THEN
                INSERT INTO public.product_batches (
                    product_id,
                    batch_number,
                    expiry_date,
                    stock_quantity,
                    is_tracked
                )
                VALUES (
                    v_product_id,
                    COALESCE(NULLIF(BTRIM(v_batch->>'batch_number'), ''), 'Mặc định'),
                    (v_batch->>'expiry_date')::DATE,
                    GREATEST(COALESCE((v_batch->>'stock_quantity')::INTEGER, 0), 0),
                    COALESCE((v_batch->>'is_tracked')::BOOLEAN, true)
                )
                RETURNING id INTO v_batch_id;
            ELSE
                UPDATE public.product_batches
                SET
                    batch_number = COALESCE(
                        NULLIF(BTRIM(v_batch->>'batch_number'), ''),
                        'Mặc định'
                    ),
                    expiry_date = (v_batch->>'expiry_date')::DATE,
                    stock_quantity = GREATEST(
                        COALESCE((v_batch->>'stock_quantity')::INTEGER, 0),
                        0
                    ),
                    is_tracked = COALESCE((v_batch->>'is_tracked')::BOOLEAN, true)
                WHERE id = v_batch_id
                  AND product_id = v_product_id;
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Lô hàng không thuộc SKU đang sửa.';
                END IF;
            END IF;
            v_keep_batch_ids := ARRAY_APPEND(v_keep_batch_ids, v_batch_id);
        END LOOP;

        DELETE FROM public.product_batches
        WHERE product_id = v_product_id
          AND NOT (id = ANY(v_keep_batch_ids));
    END IF;

    RETURN JSONB_BUILD_OBJECT('product_id', v_product_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_product_variant_atomic(JSONB)
    TO anon, authenticated;
