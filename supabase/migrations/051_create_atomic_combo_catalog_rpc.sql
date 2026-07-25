-- Save a combo product and its single base unit in one database transaction.
CREATE OR REPLACE FUNCTION public.save_combo_catalog_atomic(
    p_combo_id uuid,
    p_name text,
    p_code text,
    p_category_id uuid,
    p_price numeric,
    p_description jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_combo_id uuid;
    v_existing_description text;
    v_existing_code text;
    v_has_order_history boolean := false;
    v_versioned_code text;
BEGIN
    IF p_name IS NULL OR length(btrim(p_name)) < 1 OR length(p_name) > 255
       OR p_code IS NULL OR length(btrim(p_code)) < 1 OR length(p_code) > 64
       OR p_category_id IS NULL
       OR p_price IS NULL OR p_price < 0
       OR p_description->>'isCombo' <> 'true'
       OR jsonb_typeof(p_description->'items') <> 'array'
       OR jsonb_array_length(p_description->'items') < 1
       OR jsonb_array_length(p_description->'items') > 100 THEN
        RAISE EXCEPTION 'INVALID_COMBO_INPUT';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.categories WHERE id = p_category_id
    ) THEN
        RAISE EXCEPTION 'COMBO_CATEGORY_NOT_FOUND';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_description->'items') item
        WHERE COALESCE(item->>'id', '') !~
            '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
           OR length(btrim(COALESCE(item->>'name', ''))) < 1
           OR length(btrim(COALESCE(item->>'unit', ''))) < 1
           OR COALESCE((item->>'quantity')::numeric, 0) <= 0
    ) THEN
        RAISE EXCEPTION 'INVALID_COMBO_COMPONENT';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_description->'items') item
        LEFT JOIN public.products product
            ON product.id = (item->>'id')::uuid
        LEFT JOIN public.product_units product_unit
            ON product_unit.product_id = product.id
           AND lower(btrim(product_unit.unit_name)) = lower(btrim(item->>'unit'))
           AND product_unit.conversion_rate > 0
        WHERE product.id IS NULL OR product_unit.product_id IS NULL
    ) THEN
        RAISE EXCEPTION 'COMBO_COMPONENT_OR_UNIT_NOT_FOUND';
    END IF;

    IF p_combo_id IS NULL THEN
        INSERT INTO public.products (
            name,
            product_code,
            category_id,
            is_active,
            is_direct_sale,
            is_component_item,
            description
        )
        VALUES (
            btrim(p_name),
            upper(btrim(p_code)),
            p_category_id,
            true,
            true,
            false,
            p_description::text
        )
        RETURNING id INTO v_combo_id;
    ELSE
        SELECT description, product_code
        INTO v_existing_description, v_existing_code
        FROM public.products
        WHERE id = p_combo_id
        FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'COMBO_NOT_FOUND';
        END IF;

        IF COALESCE((v_existing_description::jsonb->>'isCombo')::boolean, false) IS NOT TRUE THEN
            RAISE EXCEPTION 'PRODUCT_IS_NOT_COMBO';
        END IF;

        SELECT EXISTS (
            SELECT 1
            FROM public.order_items
            WHERE product_id = p_combo_id
        )
        INTO v_has_order_history;

        IF v_has_order_history
           AND v_existing_description IS DISTINCT FROM p_description::text THEN
            -- Keep the sold product and its recipe immutable for historical
            -- returns/reports. The edited recipe becomes a new catalog version.
            v_versioned_code := left(
                COALESCE(v_existing_code, upper(btrim(p_code))),
                36
            ) || '-V-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS');

            UPDATE public.products
            SET is_active = false,
                product_code = v_versioned_code
            WHERE id = p_combo_id;

            INSERT INTO public.products (
                name,
                product_code,
                category_id,
                is_active,
                is_direct_sale,
                is_component_item,
                description
            )
            VALUES (
                btrim(p_name),
                upper(btrim(p_code)),
                p_category_id,
                true,
                true,
                false,
                p_description::text
            )
            RETURNING id INTO v_combo_id;
        ELSE
            UPDATE public.products
            SET name = btrim(p_name),
                product_code = upper(btrim(p_code)),
                category_id = p_category_id,
                is_active = true,
                is_direct_sale = true,
                is_component_item = false,
                description = p_description::text
            WHERE id = p_combo_id
            RETURNING id INTO v_combo_id;
        END IF;
    END IF;

    DELETE FROM public.product_units
    WHERE product_id = v_combo_id;

    INSERT INTO public.product_units (
        product_id,
        unit_name,
        conversion_rate,
        is_base_unit,
        cost_price,
        retail_price
    )
    VALUES (
        v_combo_id,
        'Combo',
        1,
        true,
        0,
        p_price
    );

    RETURN v_combo_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_combo_catalog_atomic(p_combo_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_updated integer;
BEGIN
    UPDATE public.products
    SET is_active = false
    WHERE id = p_combo_id
      AND COALESCE((description::jsonb->>'isCombo')::boolean, false) IS TRUE;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.save_combo_catalog_atomic(
    uuid, text, text, uuid, numeric, jsonb
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.archive_combo_catalog_atomic(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_combo_catalog_atomic(
    uuid, text, text, uuid, numeric, jsonb
) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.archive_combo_catalog_atomic(uuid)
TO anon, authenticated;
