-- Make supplier purchase receipt creation atomic and retry-safe.
--
-- The legacy browser flow wrote the document, then updated each batch one by
-- one. A network failure could therefore leave a confirmed document with
-- partial stock, and retrying could duplicate the receipt. This RPC performs
-- the header, line snapshots, batch updates and movement history in one
-- transaction. The document code is the idempotency key supplied by the UI.

CREATE OR REPLACE FUNCTION public.fn_auto_cashbook_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.document_type = 'purchase'
       AND NEW.status = 'confirmed'
       AND (TG_OP = 'INSERT' OR OLD IS NULL OR OLD.status IS DISTINCT FROM 'confirmed') THEN
        IF COALESCE(NEW.paid_amount, 0) > 0 THEN
            INSERT INTO public.cashbook_transactions (
                transaction_code, type, amount, category, ref_type, ref_id,
                payment_method, status, transaction_date
            ) VALUES (
                'PC-' || NEW.document_code,
                'expense',
                NEW.paid_amount,
                'Chi phí nhập hàng',
                'purchase',
                NEW.id,
                'bank_transfer',
                'completed',
                COALESCE(NEW.confirmed_at, now())
            )
            ON CONFLICT (transaction_code) DO UPDATE
            SET status = 'completed',
                amount = EXCLUDED.amount,
                ref_id = EXCLUDED.ref_id,
                updated_at = now();
        ELSE
            UPDATE public.cashbook_transactions
            SET status = 'cancelled', updated_at = now()
            WHERE ref_type = 'purchase' AND ref_id = NEW.id;
        END IF;
    ELSIF NEW.document_type = 'purchase' AND NEW.status = 'cancelled' THEN
        UPDATE public.cashbook_transactions
        SET status = 'cancelled', updated_at = now()
        WHERE ref_type = 'purchase' AND ref_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auto_cashbook_inventory ON public.inventory_documents;
CREATE TRIGGER tr_auto_cashbook_inventory
AFTER INSERT OR UPDATE OF status ON public.inventory_documents
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_cashbook_inventory();

-- Repair confirmed purchase documents whose initial paid amount was recorded
-- before the INSERT trigger was present. Existing rows are updated only when
-- their deterministic transaction code already exists in a cancelled state.
INSERT INTO public.cashbook_transactions (
    transaction_code, type, amount, category, ref_type, ref_id,
    payment_method, status, transaction_date
)
SELECT
    'PC-' || repaired.document_code,
    'expense',
    repaired.initial_paid_amount,
    'Chi phí nhập hàng',
    'purchase',
    repaired.id,
    'bank_transfer',
    'completed',
    COALESCE(repaired.confirmed_at, repaired.created_at, now())
FROM (
    SELECT
        document.id,
        document.document_code,
        document.confirmed_at,
        document.created_at,
        greatest(
            COALESCE(document.paid_amount, 0)
            - COALESCE((
                SELECT sum(payment.amount)
                FROM public.cashbook_transactions payment
                WHERE payment.ref_type = 'manual'
                  AND payment.ref_id = document.id
                  AND payment.type = 'expense'
                  AND payment.status = 'completed'
            ), 0),
            0
        ) AS initial_paid_amount
    FROM public.inventory_documents document
    WHERE document.document_type = 'purchase'
      AND document.status = 'confirmed'
) repaired
WHERE repaired.initial_paid_amount > 0
ON CONFLICT (transaction_code) DO UPDATE
SET status = 'completed',
    amount = EXCLUDED.amount,
    ref_id = EXCLUDED.ref_id,
    updated_at = now()
WHERE cashbook_transactions.status = 'cancelled';

CREATE OR REPLACE FUNCTION public.create_purchase_document_atomic(
    p_document_code TEXT,
    p_note TEXT,
    p_supplier_id UUID,
    p_total_amount NUMERIC,
    p_paid_amount NUMERIC,
    p_debt_amount NUMERIC,
    p_reason TEXT,
    p_lines JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_auth_user_id UUID := auth.uid();
    v_employee_id UUID := public.current_employee_id();
    v_document_id UUID;
    v_existing public.inventory_documents%ROWTYPE;
    v_line JSONB;
    v_line_no INTEGER := 0;
    v_line_count INTEGER := 0;
    v_product_id UUID;
    v_product_name TEXT;
    v_product_code TEXT;
    v_batch_number TEXT;
    v_expiry_date DATE;
    v_quantity NUMERIC;
    v_cost_price NUMERIC;
    v_input_cost NUMERIC;
    v_computed_total NUMERIC := 0;
    v_total_amount NUMERIC(14, 2);
    v_paid_amount NUMERIC(14, 2);
    v_debt_amount NUMERIC(14, 2);
    v_batch_id UUID;
    v_existing_stock NUMERIC;
    v_existing_cost NUMERIC;
    v_reason TEXT;
    v_note TEXT := nullif(btrim(p_note), '');
BEGIN
    IF v_auth_user_id IS NULL OR v_employee_id IS NULL THEN
        RAISE EXCEPTION 'Employee authentication is required' USING ERRCODE = '42501';
    END IF;
    IF nullif(btrim(p_document_code), '') IS NULL THEN
        RAISE EXCEPTION 'Purchase document code is required' USING ERRCODE = '22023';
    END IF;
    IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array'
       OR jsonb_array_length(p_lines) = 0 THEN
        RAISE EXCEPTION 'Purchase document requires at least one line' USING ERRCODE = '22023';
    END IF;

    -- Serialize retries and concurrent submissions that use the same stable
    -- document code before checking/inserting the idempotency record.
    PERFORM pg_advisory_xact_lock(hashtextextended(btrim(p_document_code), 0));

    -- A retry with the same document code is a successful no-op. This is the
    -- key protection against a timeout after the server committed the RPC.
    SELECT *
    INTO v_existing
    FROM public.inventory_documents
    WHERE document_code = btrim(p_document_code)
    FOR UPDATE;
    IF FOUND THEN
        IF v_existing.document_type = 'purchase'
           AND v_existing.status = 'confirmed' THEN
            RETURN jsonb_build_object(
                'document_id', v_existing.id,
                'document_code', v_existing.document_code,
                'line_count', (
                    SELECT count(*) FROM public.inventory_document_items item
                    WHERE item.document_id = v_existing.id
                ),
                'total_amount', v_existing.total_amount,
                'paid_amount', v_existing.paid_amount,
                'debt_amount', v_existing.debt_amount,
                'idempotent', true
            );
        END IF;
        RAISE EXCEPTION 'Purchase document code already exists' USING ERRCODE = '23505';
    END IF;

    -- Validate and calculate the total before changing any row.
    FOR v_line IN SELECT value FROM jsonb_array_elements(p_lines)
    LOOP
        v_line_no := v_line_no + 1;
        v_product_id := nullif(coalesce(v_line->>'product_id', v_line->>'productId'), '')::UUID;
        v_batch_number := nullif(btrim(coalesce(v_line->>'batch_number', v_line->>'batchNumber')), '');
        v_expiry_date := nullif(coalesce(v_line->>'expiry_date', v_line->>'expiryDate'), '')::DATE;
        v_quantity := nullif(coalesce(
            v_line->>'quantity_base', v_line->>'quantityBase', v_line->>'quantity'
        ), '')::NUMERIC;
        v_cost_price := nullif(coalesce(
            v_line->>'cost_price', v_line->>'costPrice', v_line->>'costPriceBase'
        ), '')::NUMERIC;

        IF v_product_id IS NULL OR v_batch_number IS NULL OR v_expiry_date IS NULL THEN
            RAISE EXCEPTION 'Line % is missing product, batch or expiry date', v_line_no USING ERRCODE = '22023';
        END IF;
        IF v_quantity IS NULL OR v_quantity <= 0 THEN
            RAISE EXCEPTION 'Line % quantity must be greater than zero', v_line_no USING ERRCODE = '22023';
        END IF;
        IF v_cost_price IS NULL OR v_cost_price < 0 THEN
            RAISE EXCEPTION 'Line % cost price is invalid', v_line_no USING ERRCODE = '22023';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.products product WHERE product.id = v_product_id) THEN
            RAISE EXCEPTION 'Product on line % was not found', v_line_no USING ERRCODE = 'P0002';
        END IF;

        v_computed_total := v_computed_total + (v_quantity * v_cost_price);
        v_line_count := v_line_count + 1;
    END LOOP;

    v_total_amount := round(v_computed_total, 2);
    IF p_total_amount IS NULL OR abs(round(p_total_amount, 2) - v_total_amount) > 0.01 THEN
        RAISE EXCEPTION 'Purchase total does not match line totals' USING ERRCODE = '22023';
    END IF;
    v_paid_amount := round(coalesce(p_paid_amount, 0), 2);
    v_debt_amount := round(coalesce(p_debt_amount, 0), 2);
    IF v_paid_amount < 0 OR v_debt_amount < 0 OR v_paid_amount > v_total_amount THEN
        RAISE EXCEPTION 'Purchase payment values are invalid' USING ERRCODE = '22023';
    END IF;
    IF abs(v_debt_amount - round(v_total_amount - v_paid_amount, 2)) > 0.01 THEN
        RAISE EXCEPTION 'Purchase debt does not match total and paid amount' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.inventory_documents (
        document_code, document_type, status, note, supplier_id,
        confirmed_at, total_amount, paid_amount, debt_amount
    ) VALUES (
        btrim(p_document_code), 'purchase', 'confirmed', v_note, p_supplier_id,
        now(), v_total_amount, v_paid_amount, v_debt_amount
    )
    RETURNING id INTO v_document_id;

    v_line_no := 0;
    FOR v_line IN SELECT value FROM jsonb_array_elements(p_lines)
    LOOP
        v_line_no := v_line_no + 1;
        v_product_id := nullif(coalesce(v_line->>'product_id', v_line->>'productId'), '')::UUID;
        v_batch_number := nullif(btrim(coalesce(v_line->>'batch_number', v_line->>'batchNumber')), '');
        v_expiry_date := nullif(coalesce(v_line->>'expiry_date', v_line->>'expiryDate'), '')::DATE;
        v_quantity := nullif(coalesce(
            v_line->>'quantity_base', v_line->>'quantityBase', v_line->>'quantity'
        ), '')::NUMERIC;
        v_input_cost := nullif(coalesce(
            v_line->>'cost_price', v_line->>'costPrice', v_line->>'costPriceBase'
        ), '')::NUMERIC;
        v_reason := coalesce(
            nullif(btrim(coalesce(v_line->>'reason', '')), ''),
            nullif(btrim(p_reason), ''),
            'purchase'
        );

        SELECT product.name, product.product_code
        INTO v_product_name, v_product_code
        FROM public.products product
        WHERE product.id = v_product_id;
        v_product_name := coalesce(
            nullif(btrim(coalesce(v_line->>'product_name', v_line->>'productName')), ''),
            v_product_name,
            'Sản phẩm'
        );
        v_product_code := coalesce(
            nullif(btrim(coalesce(v_line->>'product_code', v_line->>'productCode')), ''),
            v_product_code
        );

        -- Serialize the same product/batch key so concurrent retries cannot
        -- create two batches for one lot.
        PERFORM pg_advisory_xact_lock(hashtextextended(
            v_product_id::TEXT || '|' || v_batch_number || '|' || v_expiry_date::TEXT,
            0
        ));

        SELECT batch.id, batch.stock_quantity, batch.cost_price
        INTO v_batch_id, v_existing_stock, v_existing_cost
        FROM public.product_batches batch
        WHERE batch.product_id = v_product_id
          AND batch.batch_number = v_batch_number
          AND batch.expiry_date IS NOT DISTINCT FROM v_expiry_date
        FOR UPDATE;

        IF FOUND THEN
            v_cost_price := CASE
                WHEN v_input_cost > 0 THEN v_input_cost
                ELSE coalesce(v_existing_cost, 0)
            END;
            UPDATE public.product_batches
            SET stock_quantity = coalesce(v_existing_stock, 0) + v_quantity,
                is_tracked = true,
                cost_price = v_cost_price
            WHERE id = v_batch_id;
        ELSE
            v_cost_price := greatest(coalesce(v_input_cost, 0), 0);
            INSERT INTO public.product_batches (
                product_id, batch_number, expiry_date, stock_quantity,
                cost_price, is_tracked
            ) VALUES (
                v_product_id, v_batch_number, v_expiry_date, v_quantity,
                v_cost_price, true
            )
            RETURNING id INTO v_batch_id;
        END IF;

        INSERT INTO public.inventory_document_items (
            document_id, line_no, product_id, batch_id, product_name,
            product_code, batch_number, expiry_date, quantity_base,
            cost_price, reason, note
        ) VALUES (
            v_document_id, v_line_no, v_product_id, v_batch_id, v_product_name,
            v_product_code, v_batch_number, v_expiry_date, v_quantity,
            v_cost_price, v_reason, v_note
        );

        INSERT INTO public.inventory_movements (
            document_id, product_id, batch_id, movement_type, quantity_base,
            cost_price, reason, note, created_by, product_name,
            product_code, batch_number
        ) VALUES (
            v_document_id, v_product_id, v_batch_id, 'purchase', v_quantity,
            v_cost_price, v_reason, v_note, v_auth_user_id, v_product_name,
            v_product_code, v_batch_number
        );
    END LOOP;

    RETURN jsonb_build_object(
        'document_id', v_document_id,
        'document_code', btrim(p_document_code),
        'line_count', v_line_count,
        'total_amount', v_total_amount,
        'paid_amount', v_paid_amount,
        'debt_amount', v_debt_amount,
        'idempotent', false
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_purchase_document_atomic(
    TEXT, TEXT, UUID, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_purchase_document_atomic(
    TEXT, TEXT, UUID, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB
) TO authenticated;
