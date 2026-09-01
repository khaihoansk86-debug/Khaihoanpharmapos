-- Optional per-SKU stock limits, stored in the smallest/base stock unit.
-- A NULL value means that side of the limit is intentionally unconfigured.

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS min_stock_quantity NUMERIC,
    ADD COLUMN IF NOT EXISTS max_stock_quantity NUMERIC;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'products_stock_limits_non_negative'
          AND conrelid = 'public.products'::regclass
    ) THEN
        ALTER TABLE public.products
            ADD CONSTRAINT products_stock_limits_non_negative
            CHECK (
                (min_stock_quantity IS NULL OR min_stock_quantity >= 0)
                AND (max_stock_quantity IS NULL OR max_stock_quantity >= 0)
                AND (
                    min_stock_quantity IS NULL
                    OR max_stock_quantity IS NULL
                    OR max_stock_quantity >= min_stock_quantity
                )
            );
    END IF;
END
$$;

COMMENT ON COLUMN public.products.min_stock_quantity IS
    'Optional minimum stock threshold per SKU in the product base/smallest unit.';
COMMENT ON COLUMN public.products.max_stock_quantity IS
    'Optional maximum stock threshold per SKU in the product base/smallest unit.';

-- Keep the existing SKU RPC as the source of truth for products, units and
-- batches, then persist limits in the same database transaction. Calling the
-- existing function from this wrapper is atomic: an error in the limit update
-- rolls back the SKU, unit and batch writes as well.
CREATE OR REPLACE FUNCTION public.save_product_variant_with_limits_atomic(
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_result JSONB;
    v_product_id UUID;
    v_min_stock NUMERIC;
    v_max_stock NUMERIC;
    v_has_min BOOLEAN := p_payload ? 'min_stock_quantity';
    v_has_max BOOLEAN := p_payload ? 'max_stock_quantity';
BEGIN
    IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
        RAISE EXCEPTION 'Dữ liệu SKU không hợp lệ.' USING ERRCODE = '22023';
    END IF;

    IF v_has_min THEN
        v_min_stock := NULLIF(BTRIM(COALESCE(p_payload->>'min_stock_quantity', '')), '')::NUMERIC;
        IF v_min_stock IS NOT NULL AND v_min_stock < 0 THEN
            RAISE EXCEPTION 'Tồn tối thiểu không được nhỏ hơn 0.' USING ERRCODE = '22023';
        END IF;
    END IF;
    IF v_has_max THEN
        v_max_stock := NULLIF(BTRIM(COALESCE(p_payload->>'max_stock_quantity', '')), '')::NUMERIC;
        IF v_max_stock IS NOT NULL AND v_max_stock < 0 THEN
            RAISE EXCEPTION 'Tồn tối đa không được nhỏ hơn 0.' USING ERRCODE = '22023';
        END IF;
    END IF;
    IF v_min_stock IS NOT NULL
       AND v_max_stock IS NOT NULL
       AND v_max_stock < v_min_stock THEN
        RAISE EXCEPTION 'Tồn tối đa phải lớn hơn hoặc bằng tồn tối thiểu.' USING ERRCODE = '22023';
    END IF;

    v_result := public.save_product_variant_atomic(p_payload);
    v_product_id := NULLIF(v_result->>'product_id', '')::UUID;
    IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'Không xác định được SKU vừa lưu.' USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.products
    SET
        min_stock_quantity = CASE
            WHEN v_has_min THEN v_min_stock
            ELSE min_stock_quantity
        END,
        max_stock_quantity = CASE
            WHEN v_has_max THEN v_max_stock
            ELSE max_stock_quantity
        END
    WHERE id = v_product_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy SKU vừa lưu.' USING ERRCODE = 'P0002';
    END IF;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.save_product_variant_with_limits_atomic(JSONB)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_product_variant_with_limits_atomic(JSONB)
    TO authenticated;
