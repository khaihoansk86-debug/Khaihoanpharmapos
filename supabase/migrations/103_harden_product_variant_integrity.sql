-- Harden the parent/SKU contract without rewriting any deployed migration.
-- Existing incomplete legacy rows remain editable when their identity is not
-- touched; every new or changed identity must satisfy the parent definition.

CREATE OR REPLACE FUNCTION public.validate_product_variant_write_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_parent_definitions JSONB;
    v_definition_keys TEXT[];
    v_identity_is_valid BOOLEAN;
BEGIN
    IF NEW.parent_id IS NULL THEN
        IF EXISTS (
            SELECT 1
            FROM JSONB_ARRAY_ELEMENTS(COALESCE(NEW.variant_definitions, '[]'::JSONB))
                AS definitions(definition)
            WHERE JSONB_TYPEOF(definition) <> 'object'
               OR BTRIM(COALESCE(definition->>'key', '')) = ''
               OR BTRIM(COALESCE(definition->>'label', '')) = ''
        ) OR (
            SELECT COUNT(DISTINCT BTRIM(definition->>'key'))
            FROM JSONB_ARRAY_ELEMENTS(COALESCE(NEW.variant_definitions, '[]'::JSONB))
                AS definitions(definition)
        ) <> COALESCE(JSONB_ARRAY_LENGTH(NEW.variant_definitions), 0) THEN
            RAISE EXCEPTION 'Tiêu chí phân loại của nhóm phải có khóa và tên duy nhất.'
                USING ERRCODE = '23514';
        END IF;

        IF (
            COALESCE(JSONB_ARRAY_LENGTH(NEW.variant_definitions), 0) > 0
            OR EXISTS (SELECT 1 FROM public.products child WHERE child.parent_id = NEW.id)
        ) AND NEW.is_direct_sale IS NOT FALSE THEN
            RAISE EXCEPTION 'Nhóm sản phẩm cha không được bán trực tiếp.' USING ERRCODE = '23514';
        END IF;

        IF TG_OP = 'UPDATE'
           AND NEW.variant_definitions IS DISTINCT FROM OLD.variant_definitions
           AND EXISTS (SELECT 1 FROM public.products child WHERE child.parent_id = NEW.id) THEN
            SELECT ARRAY_AGG(BTRIM(definition->>'key') ORDER BY ordinal)
            INTO v_definition_keys
            FROM JSONB_ARRAY_ELEMENTS(COALESCE(NEW.variant_definitions, '[]'::JSONB))
                WITH ORDINALITY AS definitions(definition, ordinal)
            WHERE BTRIM(COALESCE(definition->>'key', '')) <> '';

            IF COALESCE(CARDINALITY(v_definition_keys), 0) = 0
               OR EXISTS (
                   SELECT 1
                   FROM public.products child
                   WHERE child.parent_id = NEW.id
                     AND (
                         (SELECT COUNT(*) FROM JSONB_OBJECT_KEYS(child.variant_values))
                             <> CARDINALITY(v_definition_keys)
                         OR EXISTS (
                             SELECT 1
                             FROM UNNEST(v_definition_keys) AS expected(key)
                             WHERE BTRIM(COALESCE(child.variant_values->>expected.key, '')) = ''
                         )
                         OR EXISTS (
                             SELECT 1
                             FROM JSONB_OBJECT_KEYS(child.variant_values) AS actual(key)
                             WHERE NOT (actual.key = ANY(v_definition_keys))
                         )
                     )
               ) THEN
                RAISE EXCEPTION 'Không thể đổi tiêu chí nhóm vì SKU con hiện tại không khớp dữ liệu mới.'
                    USING ERRCODE = '23514';
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    SELECT parent.variant_definitions
    INTO v_parent_definitions
    FROM public.products parent
    WHERE parent.id = NEW.parent_id
      AND parent.parent_id IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Nhóm sản phẩm cha của SKU không hợp lệ.' USING ERRCODE = '23503';
    END IF;

    SELECT ARRAY_AGG(BTRIM(definition->>'key') ORDER BY ordinal)
    INTO v_definition_keys
    FROM JSONB_ARRAY_ELEMENTS(COALESCE(v_parent_definitions, '[]'::JSONB))
        WITH ORDINALITY AS definitions(definition, ordinal)
    WHERE BTRIM(COALESCE(definition->>'key', '')) <> '';

    -- Parents created before classification was introduced are grandfathered
    -- until an explicit definition is configured for them.
    IF COALESCE(CARDINALITY(v_definition_keys), 0) = 0 THEN
        RETURN NEW;
    END IF;

    v_identity_is_valid :=
        (SELECT COUNT(*) FROM JSONB_OBJECT_KEYS(NEW.variant_values))
            = CARDINALITY(v_definition_keys)
        AND NOT EXISTS (
            SELECT 1
            FROM UNNEST(v_definition_keys) AS expected(key)
            WHERE BTRIM(COALESCE(NEW.variant_values->>expected.key, '')) = ''
        )
        AND NOT EXISTS (
            SELECT 1
            FROM JSONB_OBJECT_KEYS(NEW.variant_values) AS actual(key)
            WHERE NOT (actual.key = ANY(v_definition_keys))
        );

    IF NOT v_identity_is_valid THEN
        IF TG_OP = 'UPDATE'
           AND NEW.parent_id IS NOT DISTINCT FROM OLD.parent_id
           AND NEW.variant_values IS NOT DISTINCT FROM OLD.variant_values THEN
            RETURN NEW;
        END IF;
        RAISE EXCEPTION 'Giá trị phân loại SKU phải khớp đầy đủ tiêu chí của nhóm cha.'
            USING ERRCODE = '23514';
    END IF;

    -- Serialize identity checks per parent so two concurrent inserts cannot
    -- both pass the duplicate check before either transaction commits.
    PERFORM PG_ADVISORY_XACT_LOCK(HASHTEXTENDED(NEW.parent_id::TEXT, 0));

    IF EXISTS (
        SELECT 1
        FROM public.products sibling
        WHERE sibling.parent_id = NEW.parent_id
          AND sibling.id IS DISTINCT FROM NEW.id
          AND NOT EXISTS (
              SELECT 1
              FROM UNNEST(v_definition_keys) AS identity_key(key)
              WHERE LOWER(BTRIM(COALESCE(sibling.variant_values->>identity_key.key, '')))
                  IS DISTINCT FROM LOWER(BTRIM(COALESCE(NEW.variant_values->>identity_key.key, '')))
          )
          AND LOWER(BTRIM(COALESCE(sibling.packaging_spec, '')))
              = LOWER(BTRIM(COALESCE(NEW.packaging_spec, '')))
    ) THEN
        RAISE EXCEPTION 'Đã tồn tại SKU cùng phân loại và quy cách trong nhóm này.'
            USING ERRCODE = '23505';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_product_variant_write_contract
    ON public.products;
CREATE TRIGGER trg_validate_product_variant_write_contract
BEFORE INSERT OR UPDATE OF parent_id, variant_definitions, variant_values, packaging_spec, is_direct_sale
ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.validate_product_variant_write_contract();

CREATE OR REPLACE FUNCTION public.prevent_parent_product_cascade_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.parent_id IS NULL
       AND EXISTS (
           SELECT 1 FROM public.products child WHERE child.parent_id = OLD.id
       ) THEN
        RAISE EXCEPTION 'Không thể xóa nhóm sản phẩm còn SKU con. Hãy ngừng kinh doanh thay vì xóa.'
            USING ERRCODE = '23503';
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_parent_product_cascade_delete
    ON public.products;
CREATE TRIGGER trg_prevent_parent_product_cascade_delete
BEFORE DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.prevent_parent_product_cascade_delete();

-- The legacy variant RPC intentionally derives converted-unit prices from the
-- base price. The shared editor permits explicit prices for every unit and
-- edits more SKU fields, so this wrapper completes those writes in the same
-- transaction after the established atomic SKU/limit function succeeds.
CREATE OR REPLACE FUNCTION public.save_product_variant_from_shared_editor_atomic(
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_result JSONB;
    v_product_id UUID;
    v_parent_id UUID;
    v_unit JSONB;
    v_batch JSONB;
BEGIN
    IF p_payload IS NULL OR JSONB_TYPEOF(p_payload) <> 'object' THEN
        RAISE EXCEPTION 'Dữ liệu SKU không hợp lệ.' USING ERRCODE = '22023';
    END IF;

    v_product_id := NULLIF(p_payload->>'product_id', '')::UUID;
    IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'Biểu mẫu dùng chung chỉ cập nhật SKU đã tồn tại.' USING ERRCODE = '22023';
    END IF;

    SELECT child.parent_id
    INTO v_parent_id
    FROM public.products child
    WHERE child.id = v_product_id
    FOR UPDATE;
    IF NOT FOUND OR v_parent_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy SKU con cần cập nhật.' USING ERRCODE = 'P0002';
    END IF;

    v_result := public.save_product_variant_with_limits_atomic(p_payload);

    IF (p_payload ? 'ecommerce_platforms')
       AND JSONB_TYPEOF(COALESCE(p_payload->'ecommerce_platforms', '[]'::JSONB)) <> 'array' THEN
        RAISE EXCEPTION 'Danh sách sàn thương mại điện tử không hợp lệ.' USING ERRCODE = '22023';
    END IF;

    UPDATE public.products
    SET
        category_id = CASE WHEN p_payload ? 'category_id'
            THEN NULLIF(p_payload->>'category_id', '')::UUID ELSE category_id END,
        is_active = CASE WHEN p_payload ? 'is_active'
            THEN COALESCE((p_payload->>'is_active')::BOOLEAN, true) ELSE is_active END,
        is_ecommerce = CASE WHEN p_payload ? 'is_ecommerce'
            THEN COALESCE((p_payload->>'is_ecommerce')::BOOLEAN, false) ELSE is_ecommerce END,
        ecommerce_platforms = CASE WHEN p_payload ? 'ecommerce_platforms'
            THEN COALESCE(p_payload->'ecommerce_platforms', '[]'::JSONB) ELSE ecommerce_platforms END,
        registration_no = CASE WHEN p_payload ? 'registration_no'
            THEN NULLIF(BTRIM(COALESCE(p_payload->>'registration_no', '')), '') ELSE registration_no END,
        active_ingredient = CASE WHEN p_payload ? 'active_ingredient'
            THEN NULLIF(BTRIM(COALESCE(p_payload->>'active_ingredient', '')), '') ELSE active_ingredient END,
        route_of_admin = CASE WHEN p_payload ? 'route_of_admin'
            THEN NULLIF(BTRIM(COALESCE(p_payload->>'route_of_admin', '')), '') ELSE route_of_admin END,
        manufacturer = CASE WHEN p_payload ? 'manufacturer'
            THEN NULLIF(BTRIM(COALESCE(p_payload->>'manufacturer', '')), '') ELSE manufacturer END,
        description = CASE WHEN p_payload ? 'description'
            THEN p_payload->>'description' ELSE description END
    WHERE id = v_product_id
      AND parent_id = v_parent_id;

    FOR v_unit IN
        SELECT value FROM JSONB_ARRAY_ELEMENTS(COALESCE(p_payload->'units', '[]'::JSONB))
    LOOP
        IF COALESCE((v_unit->>'cost_price')::NUMERIC, 0) < 0
           OR COALESCE((v_unit->>'retail_price')::NUMERIC, 0) < 0 THEN
            RAISE EXCEPTION 'Giá vốn và giá bán của đơn vị không được âm.' USING ERRCODE = '22023';
        END IF;

        IF NULLIF(v_unit->>'id', '') IS NOT NULL THEN
            UPDATE public.product_units
            SET
                cost_price = COALESCE((v_unit->>'cost_price')::NUMERIC, cost_price),
                retail_price = COALESCE((v_unit->>'retail_price')::NUMERIC, retail_price)
            WHERE id = (v_unit->>'id')::UUID
              AND product_id = v_product_id;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Đơn vị tính không thuộc SKU đang sửa.' USING ERRCODE = '23503';
            END IF;
        ELSE
            UPDATE public.product_units
            SET
                cost_price = COALESCE((v_unit->>'cost_price')::NUMERIC, cost_price),
                retail_price = COALESCE((v_unit->>'retail_price')::NUMERIC, retail_price)
            WHERE product_id = v_product_id
              AND BTRIM(unit_name) = BTRIM(v_unit->>'unit_name');
        END IF;
    END LOOP;

    FOR v_batch IN
        SELECT value FROM JSONB_ARRAY_ELEMENTS(COALESCE(p_payload->'batches', '[]'::JSONB))
    LOOP
        IF COALESCE((v_batch->>'cost_price')::NUMERIC, 0) < 0 THEN
            RAISE EXCEPTION 'Giá vốn lô không được âm.' USING ERRCODE = '22023';
        END IF;

        IF NULLIF(v_batch->>'id', '') IS NOT NULL THEN
            UPDATE public.product_batches
            SET cost_price = COALESCE((v_batch->>'cost_price')::NUMERIC, cost_price)
            WHERE id = (v_batch->>'id')::UUID
              AND product_id = v_product_id;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Lô hàng không thuộc SKU đang sửa.' USING ERRCODE = '23503';
            END IF;
        ELSE
            UPDATE public.product_batches
            SET cost_price = COALESCE((v_batch->>'cost_price')::NUMERIC, cost_price)
            WHERE product_id = v_product_id
              AND BTRIM(batch_number) = BTRIM(COALESCE(v_batch->>'batch_number', 'Mặc định'))
              AND expiry_date = (v_batch->>'expiry_date')::DATE;
        END IF;
    END LOOP;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.save_product_variant_from_shared_editor_atomic(JSONB)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_product_variant_from_shared_editor_atomic(JSONB)
    TO authenticated;
