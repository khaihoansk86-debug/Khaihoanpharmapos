-- Harden the atomic checkout fast path after migration 047.
-- A selected batch is required so returns/cancellations can restore stock
-- to the exact lot recorded on order_items.
CREATE OR REPLACE FUNCTION public.create_pos_order_atomic(
    p_idempotency_key text,
    p_order jsonb,
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
    v_existing_status text;
    v_item jsonb;
    v_batch record;
    v_required numeric;
    v_item_count integer;
    v_calculated_subtotal numeric;
    v_subtotal numeric;
    v_discount numeric;
    v_total numeric;
    v_updated integer;
BEGIN
    IF p_idempotency_key IS NULL
       OR length(btrim(p_idempotency_key)) < 3
       OR length(p_idempotency_key) > 64
       OR p_idempotency_key <> p_order->>'order_code' THEN
        RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY';
    END IF;

    IF jsonb_typeof(p_items) <> 'array' THEN
        RAISE EXCEPTION 'INVALID_ITEMS';
    END IF;
    v_item_count := jsonb_array_length(p_items);
    IF v_item_count < 1 OR v_item_count > 100 THEN
        RAISE EXCEPTION 'INVALID_ITEM_COUNT';
    END IF;
    IF COALESCE(p_order->>'order_type', 'retail') NOT IN ('retail', 'ecommerce') THEN
        RAISE EXCEPTION 'UNSUPPORTED_ORDER_TYPE';
    END IF;
    IF COALESCE(p_order->>'payment_method', 'cash') NOT IN ('cash', 'bank_transfer') THEN
        RAISE EXCEPTION 'INVALID_PAYMENT_METHOD';
    END IF;

    SELECT COALESCE(sum((value->>'total_price')::numeric), 0)
      INTO v_calculated_subtotal
      FROM jsonb_array_elements(p_items);
    v_subtotal := COALESCE((p_order->>'subtotal')::numeric, 0);
    v_discount := COALESCE((p_order->>'discount')::numeric, 0);
    v_total := COALESCE((p_order->>'total')::numeric, 0);
    IF v_subtotal < 0
       OR v_discount < 0
       OR v_discount > v_subtotal
       OR v_calculated_subtotal <> v_subtotal
       OR v_total <> v_subtotal - v_discount THEN
        RAISE EXCEPTION 'INVALID_ORDER_TOTALS';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));

    SELECT id, status
      INTO v_order_id, v_existing_status
      FROM public.orders
     WHERE order_code = p_idempotency_key
     LIMIT 1;

    IF v_order_id IS NOT NULL THEN
        IF v_existing_status = 'completed'
           AND EXISTS (SELECT 1 FROM public.order_items WHERE order_id = v_order_id) THEN
            RETURN jsonb_build_object(
                'id', v_order_id,
                'order_code', p_idempotency_key,
                'status', 'completed',
                'idempotent_replay', true
            );
        END IF;
        RAISE EXCEPTION 'ORDER_INCOMPLETE_REQUIRES_REVIEW';
    END IF;

    -- Lock and validate every selected lot before creating the order.
    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
    LOOP
        IF NULLIF(v_item->>'product_id', '') IS NULL
           OR NULLIF(v_item->>'preferred_batch_id', '') IS NULL
           OR COALESCE((v_item->>'quantity')::numeric, 0) <= 0
           OR COALESCE((v_item->>'stock_quantity')::numeric, 0) <= 0
           OR COALESCE((v_item->>'unit_price')::numeric, 0) < 0 THEN
            RAISE EXCEPTION 'INVALID_ORDER_ITEM';
        END IF;

        v_required := (v_item->>'stock_quantity')::numeric;
        SELECT id, stock_quantity
          INTO v_batch
          FROM public.product_batches
         WHERE id = (v_item->>'preferred_batch_id')::uuid
           AND product_id = (v_item->>'product_id')::uuid
         FOR UPDATE;

        IF v_batch.id IS NULL OR COALESCE(v_batch.stock_quantity, 0) < v_required THEN
            RAISE EXCEPTION 'INSUFFICIENT_SELECTED_BATCH_STOCK';
        END IF;
    END LOOP;

    INSERT INTO public.orders (
        order_code, customer_id, customer_name, customer_phone,
        subtotal, discount, total, amount_received, change_amount,
        note, status, order_type, ecommerce_platform, payment_method,
        seller_employee_id
    ) VALUES (
        p_idempotency_key,
        NULLIF(p_order->>'customer_id', '')::uuid,
        left(COALESCE(NULLIF(p_order->>'customer_name', ''), 'Khách lẻ'), 255),
        NULLIF(p_order->>'customer_phone', ''),
        v_subtotal,
        v_discount,
        v_total,
        COALESCE((p_order->>'amount_received')::numeric, 0),
        COALESCE((p_order->>'change_amount')::numeric, 0),
        NULLIF(p_order->>'note', ''),
        'completed',
        COALESCE(p_order->>'order_type', 'retail'),
        NULLIF(p_order->>'ecommerce_platform', ''),
        COALESCE(p_order->>'payment_method', 'cash'),
        NULLIF(p_order->>'seller_employee_id', '')::uuid
    )
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
    LOOP
        v_required := (v_item->>'stock_quantity')::numeric;
        UPDATE public.product_batches
           SET stock_quantity = stock_quantity - v_required
         WHERE id = (v_item->>'preferred_batch_id')::uuid
           AND stock_quantity >= v_required;
        GET DIAGNOSTICS v_updated = ROW_COUNT;
        IF v_updated <> 1 THEN
            RAISE EXCEPTION 'INSUFFICIENT_SELECTED_BATCH_STOCK';
        END IF;

        INSERT INTO public.order_items (
            order_id, product_id, batch_id, product_name, product_code,
            unit_name, unit_price, quantity, total_price, line_type,
            parent_order_item_id, sort_index
        ) VALUES (
            v_order_id,
            (v_item->>'product_id')::uuid,
            (v_item->>'preferred_batch_id')::uuid,
            left(COALESCE(v_item->>'product_name', 'Sản phẩm'), 255),
            NULLIF(v_item->>'product_code', ''),
            NULLIF(v_item->>'unit_name', ''),
            (v_item->>'unit_price')::numeric,
            (v_item->>'quantity')::numeric,
            (v_item->>'total_price')::numeric,
            'standard',
            NULL,
            COALESCE((v_item->>'sort_index')::integer, 0)
        );
    END LOOP;

    IF NULLIF(p_order->>'customer_id', '') IS NOT NULL THEN
        UPDATE public.customers
           SET total_spent = GREATEST(0, COALESCE(total_spent, 0) + v_total),
               order_count = GREATEST(0, COALESCE(order_count, 0) + 1),
               last_purchase_at = now(),
               updated_at = now()
         WHERE id = (p_order->>'customer_id')::uuid;
    END IF;

    RETURN jsonb_build_object(
        'id', v_order_id,
        'order_code', p_idempotency_key,
        'status', 'completed',
        'idempotent_replay', false
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_pos_order_atomic(text, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_pos_order_atomic(text, jsonb, jsonb) TO anon, authenticated;
