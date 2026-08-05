CREATE OR REPLACE FUNCTION public.apply_stocktake_document_atomic(
    p_note TEXT,
    p_reason TEXT,
    p_lines JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_document_id UUID := gen_random_uuid();
    v_document_code TEXT;
    v_line JSONB;
    v_line_no INTEGER := 0;
    v_product_id UUID;
    v_batch_id UUID;
    v_input_batch_id UUID;
    v_product_name TEXT;
    v_product_code TEXT;
    v_batch_number TEXT;
    v_expiry_date DATE;
    v_counted NUMERIC;
    v_current_stock NUMERIC;
    v_delta NUMERIC;
    v_cost_price NUMERIC;
    v_is_new_batch BOOLEAN;
    v_is_renamed BOOLEAN;
BEGIN
    IF auth.uid() IS NULL AND current_user <> 'service_role' THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
        RAISE EXCEPTION 'Stocktake requires at least one line';
    END IF;

    v_document_code := 'PKK-'
        || to_char(timezone('Asia/Ho_Chi_Minh', now()), 'YYYYMMDD')
        || '-'
        || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 5));

    INSERT INTO public.inventory_documents (
        id, document_code, document_type, status, note, confirmed_at, created_by,
        total_amount, paid_amount, debt_amount
    ) VALUES (
        v_document_id, v_document_code, 'stocktake_adjustment', 'confirmed',
        nullif(btrim(p_note), ''), now(), auth.uid(), 0, 0, 0
    );

    FOR v_line IN SELECT value FROM jsonb_array_elements(p_lines)
    LOOP
        v_line_no := v_line_no + 1;
        v_product_id := nullif(v_line->>'product_id', '')::UUID;
        v_is_new_batch := coalesce((v_line->>'is_new_batch')::BOOLEAN, false)
            OR nullif(v_line->>'batch_id', '') IS NULL
            OR v_line->>'batch_id' LIKE 'new_%';

        IF v_is_new_batch THEN
            v_input_batch_id := NULL;
        ELSE
            v_input_batch_id := nullif(v_line->>'batch_id', '')::UUID;
        END IF;

        v_batch_number := nullif(btrim(v_line->>'batch_number'), '');
        v_expiry_date := nullif(v_line->>'expiry_date', '')::DATE;
        v_counted := (v_line->>'counted_quantity')::NUMERIC;
        v_cost_price := greatest(coalesce((v_line->>'cost_price')::NUMERIC, 0), 0);
        v_is_renamed := coalesce((v_line->>'is_renamed')::BOOLEAN, false);

        IF v_product_id IS NULL THEN
            RAISE EXCEPTION 'Line % is missing product', v_line_no;
        END IF;
        IF v_counted IS NULL OR v_counted < 0 THEN
            RAISE EXCEPTION 'Line % has invalid counted quantity', v_line_no;
        END IF;

        SELECT p.name, p.product_code
        INTO v_product_name, v_product_code
        FROM public.products p
        WHERE p.id = v_product_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found on line %', v_line_no;
        END IF;

        v_product_name := coalesce(nullif(btrim(v_line->>'product_name'), ''), v_product_name);
        v_product_code := coalesce(nullif(btrim(v_line->>'product_code'), ''), v_product_code);

        IF v_is_new_batch THEN
            IF v_batch_number IS NULL OR v_counted <= 0 THEN
                RAISE EXCEPTION 'New batch on line % requires batch number and positive stock', v_line_no;
            END IF;
            IF v_cost_price <= 0 THEN
                SELECT coalesce(u.cost_price, 0)
                INTO v_cost_price
                FROM public.product_units u
                WHERE u.product_id = v_product_id
                ORDER BY u.is_base_unit DESC, u.conversion_rate ASC
                LIMIT 1;
                v_cost_price := coalesce(v_cost_price, 0);
            END IF;

            INSERT INTO public.product_batches (
                product_id, batch_number, expiry_date, stock_quantity, cost_price, is_tracked
            ) VALUES (
                v_product_id, v_batch_number, v_expiry_date, v_counted, v_cost_price, true
            )
            RETURNING id INTO v_batch_id;
            v_current_stock := 0;
            v_delta := v_counted;
        ELSE
            SELECT b.id, b.batch_number, b.expiry_date, b.stock_quantity, b.cost_price
            INTO v_batch_id, v_batch_number, v_expiry_date, v_current_stock, v_cost_price
            FROM public.product_batches b
            WHERE b.id = v_input_batch_id
              AND b.product_id = v_product_id
            FOR UPDATE;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Batch not found on line %', v_line_no;
            END IF;

            v_delta := v_counted - coalesce(v_current_stock, 0);
            UPDATE public.product_batches
            SET stock_quantity = v_counted,
                is_tracked = v_counted > 0,
                batch_number = CASE
                    WHEN v_is_renamed AND nullif(btrim(v_line->>'batch_number'), '') IS NOT NULL
                        THEN btrim(v_line->>'batch_number')
                    ELSE batch_number
                END,
                expiry_date = coalesce(nullif(v_line->>'expiry_date', '')::DATE, expiry_date)
            WHERE id = v_batch_id
            RETURNING batch_number, expiry_date INTO v_batch_number, v_expiry_date;
        END IF;

        INSERT INTO public.inventory_document_items (
            document_id, line_no, product_id, batch_id, product_name, product_code,
            batch_number, expiry_date, quantity_base, counted_quantity_base,
            cost_price, reason, note
        ) VALUES (
            v_document_id, v_line_no, v_product_id, v_batch_id, v_product_name,
            v_product_code, v_batch_number, v_expiry_date, v_delta, v_counted,
            coalesce(v_cost_price, 0), coalesce(nullif(btrim(p_reason), ''), 'stocktake'),
            nullif(btrim(p_note), '')
        );

        INSERT INTO public.inventory_movements (
            document_id, product_id, batch_id, movement_type, quantity_base,
            cost_price, reason, note, created_by, product_name, product_code, batch_number
        ) VALUES (
            v_document_id, v_product_id, v_batch_id, 'stocktake_adjustment', v_delta,
            coalesce(v_cost_price, 0), coalesce(nullif(btrim(p_reason), ''), 'stocktake'),
            nullif(btrim(p_note), ''), auth.uid(), v_product_name, v_product_code, v_batch_number
        );
    END LOOP;

    RETURN jsonb_build_object(
        'document_id', v_document_id,
        'document_code', v_document_code,
        'line_count', v_line_no
    );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_stocktake_document_atomic(TEXT, TEXT, JSONB)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_stocktake_document_atomic(TEXT, TEXT, JSONB)
TO authenticated, service_role;
