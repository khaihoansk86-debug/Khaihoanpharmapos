-- Allow one commercial order line to retain the exact immutable lot slices
-- consumed at checkout. Positive quantities are stock deductions; negative
-- quantities are stock restorations created by return orders.
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS batch_allocations jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint
         WHERE conname = 'order_items_batch_allocations_array'
           AND conrelid = 'public.order_items'::regclass
    ) THEN
        ALTER TABLE public.order_items
            ADD CONSTRAINT order_items_batch_allocations_array
            CHECK (jsonb_typeof(batch_allocations) = 'array');
    END IF;
END
$$;

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
    v_item_index integer;
    v_batch record;
    v_required numeric;
    v_remaining numeric;
    v_take numeric;
    v_allocation_index integer;
    v_item_count integer;
    v_calculated_subtotal numeric;
    v_subtotal numeric;
    v_discount numeric;
    v_total numeric;
    v_preferred_batch_id uuid;
    v_product_id uuid;
    v_allocations jsonb;
    v_persisted_batch_id uuid;
    v_cost_per_sale_unit numeric;
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

    CREATE TEMP TABLE IF NOT EXISTS pos_standard_checkout_allocation (
        item_index integer NOT NULL,
        allocation_index integer NOT NULL,
        batch_id uuid NOT NULL,
        batch_number text,
        expiry_date date,
        quantity numeric NOT NULL,
        cost_price numeric NOT NULL,
        PRIMARY KEY (item_index, allocation_index)
    ) ON COMMIT DROP;
    TRUNCATE pg_temp.pos_standard_checkout_allocation;

    -- Validate product and selected-lot identities before taking stock locks.
    FOR v_item, v_item_index IN
        SELECT value, ordinality::integer
          FROM jsonb_array_elements(p_items) WITH ORDINALITY
    LOOP
        IF COALESCE(v_item->>'product_id', '') !~
                '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
           OR COALESCE(v_item->>'preferred_batch_id', '') !~
                '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
           OR COALESCE((v_item->>'quantity')::numeric, 0) <= 0
           OR COALESCE((v_item->>'stock_quantity')::numeric, 0) <= 0
           OR COALESCE((v_item->>'unit_price')::numeric, -1) < 0
           OR COALESCE((v_item->>'total_price')::numeric, -1)
                <> COALESCE((v_item->>'unit_price')::numeric, 0)
                   * COALESCE((v_item->>'quantity')::numeric, 0) THEN
            RAISE EXCEPTION 'INVALID_ORDER_ITEM';
        END IF;

        IF NOT EXISTS (
            SELECT 1
              FROM public.products product
             WHERE product.id = (v_item->>'product_id')::uuid
               AND product.is_active IS TRUE
        ) THEN
            RAISE EXCEPTION 'PRODUCT_NOT_AVAILABLE';
        END IF;

        IF NOT EXISTS (
            SELECT 1
              FROM public.product_batches batch
             WHERE batch.id = (v_item->>'preferred_batch_id')::uuid
               AND batch.product_id = (v_item->>'product_id')::uuid
        ) THEN
            RAISE EXCEPTION 'SELECTED_BATCH_NOT_FOUND';
        END IF;
    END LOOP;

    -- Every checkout locks relevant lots in the same order. Concurrent sales
    -- wait, then recalculate against the quantities left by the winner.
    PERFORM 1
      FROM public.product_batches batch
     WHERE batch.product_id IN (
         SELECT DISTINCT (value->>'product_id')::uuid
           FROM jsonb_array_elements(p_items)
     )
     ORDER BY batch.product_id, batch.expiry_date ASC NULLS LAST, batch.id
     FOR UPDATE;

    FOR v_item, v_item_index IN
        SELECT value, ordinality::integer
          FROM jsonb_array_elements(p_items) WITH ORDINALITY
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_preferred_batch_id := (v_item->>'preferred_batch_id')::uuid;
        v_required := (v_item->>'stock_quantity')::numeric;
        v_remaining := v_required;
        v_allocation_index := 0;

        FOR v_batch IN
            SELECT
                batch.id,
                batch.batch_number,
                batch.expiry_date,
                batch.stock_quantity,
                COALESCE(batch.cost_price, 0) AS cost_price
              FROM public.product_batches batch
             WHERE batch.product_id = v_product_id
               AND batch.stock_quantity > 0
             ORDER BY
                CASE WHEN batch.id = v_preferred_batch_id THEN 0 ELSE 1 END,
                batch.expiry_date ASC NULLS LAST,
                batch.id
        LOOP
            EXIT WHEN v_remaining <= 0;
            v_take := LEAST(v_remaining, v_batch.stock_quantity);
            IF v_take <= 0 THEN CONTINUE; END IF;

            UPDATE public.product_batches
               SET stock_quantity = stock_quantity - v_take
             WHERE id = v_batch.id;

            v_allocation_index := v_allocation_index + 1;
            INSERT INTO pg_temp.pos_standard_checkout_allocation (
                item_index, allocation_index, batch_id, batch_number,
                expiry_date, quantity, cost_price
            ) VALUES (
                v_item_index, v_allocation_index, v_batch.id,
                v_batch.batch_number, v_batch.expiry_date,
                v_take, v_batch.cost_price
            );
            v_remaining := v_remaining - v_take;
        END LOOP;

        IF v_remaining > 0 THEN
            RAISE EXCEPTION 'INSUFFICIENT_TOTAL_BATCH_STOCK';
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

    FOR v_item, v_item_index IN
        SELECT value, ordinality::integer
          FROM jsonb_array_elements(p_items) WITH ORDINALITY
    LOOP
        SELECT
            jsonb_agg(
                jsonb_build_object(
                    'batch_id', allocation.batch_id,
                    'batch_number', allocation.batch_number,
                    'expiry_date', allocation.expiry_date,
                    'quantity_base', allocation.quantity,
                    'cost_price', allocation.cost_price
                )
                ORDER BY allocation.allocation_index
            ),
            CASE
                WHEN count(*) = 1 THEN (array_agg(allocation.batch_id))[1]
                ELSE NULL
            END,
            sum(allocation.quantity * allocation.cost_price)
                / NULLIF((v_item->>'quantity')::numeric, 0)
          INTO v_allocations, v_persisted_batch_id, v_cost_per_sale_unit
          FROM pg_temp.pos_standard_checkout_allocation allocation
         WHERE allocation.item_index = v_item_index;

        INSERT INTO public.order_items (
            order_id, product_id, batch_id, product_name, product_code,
            unit_name, unit_price, quantity, total_price,
            cost_price_snapshot, batch_allocations,
            line_type, parent_order_item_id, sort_index
        ) VALUES (
            v_order_id,
            (v_item->>'product_id')::uuid,
            v_persisted_batch_id,
            left(COALESCE(v_item->>'product_name', 'Sản phẩm'), 255),
            NULLIF(v_item->>'product_code', ''),
            NULLIF(v_item->>'unit_name', ''),
            (v_item->>'unit_price')::numeric,
            (v_item->>'quantity')::numeric,
            (v_item->>'total_price')::numeric,
            round(COALESCE(v_cost_per_sale_unit, 0), 2),
            COALESCE(v_allocations, '[]'::jsonb),
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
GRANT EXECUTE ON FUNCTION public.create_pos_order_atomic(text, jsonb, jsonb)
    TO anon, authenticated;

-- Migration 052 already owns the large combo checkout contract. Patch only
-- its standard-line allocation branch in-place so the deployed recipe and
-- component logic remain byte-for-byte unchanged.
DO $patch_combo_rpc$
DECLARE
    v_definition text;
    v_old_lock text := $old_lock$
    PERFORM 1
      FROM public.product_batches batch
     WHERE batch.product_id IN (
         SELECT DISTINCT product_id
           FROM pg_temp.pos_combo_checkout_demand
     )
     ORDER BY batch.id
     FOR UPDATE;
$old_lock$;
    v_new_lock text := $new_lock$
    PERFORM 1
      FROM public.product_batches batch
     WHERE batch.product_id IN (
         SELECT DISTINCT product_id
           FROM pg_temp.pos_combo_checkout_demand
     )
     ORDER BY batch.product_id, batch.expiry_date ASC NULLS LAST, batch.id
     FOR UPDATE;
$new_lock$;
    v_old_allocation text := $old_allocation$
        IF v_demand.line_kind = 'standard' THEN
            SELECT id, stock_quantity, cost_price
              INTO v_batch
              FROM public.product_batches
             WHERE id = v_demand.preferred_batch_id
               AND product_id = v_demand.product_id;
            IF v_batch.id IS NULL OR COALESCE(v_batch.stock_quantity, 0) < v_remaining THEN
                RAISE EXCEPTION 'INSUFFICIENT_SELECTED_BATCH_STOCK';
            END IF;

            UPDATE public.product_batches
               SET stock_quantity = stock_quantity - v_remaining
             WHERE id = v_batch.id;
            INSERT INTO pg_temp.pos_combo_checkout_allocation (
                item_index, component_index, allocation_index,
                batch_id, quantity, cost_price
            ) VALUES (
                v_demand.item_index, v_demand.component_index, 1,
                v_batch.id, v_remaining, COALESCE(v_batch.cost_price, 0)
            );
            v_remaining := 0;
        ELSE
$old_allocation$;
    v_new_allocation text := $new_allocation$
        IF v_demand.line_kind = 'standard' THEN
            v_component_index := 0;
            FOR v_batch IN
                SELECT id, stock_quantity, cost_price
                  FROM public.product_batches batch
                 WHERE batch.product_id = v_demand.product_id
                   AND batch.stock_quantity > 0
                 ORDER BY
                    CASE WHEN batch.id = v_demand.preferred_batch_id THEN 0 ELSE 1 END,
                    batch.expiry_date ASC NULLS LAST,
                    batch.id
            LOOP
                EXIT WHEN v_remaining <= 0;
                v_take := LEAST(v_remaining, v_batch.stock_quantity);
                IF v_take <= 0 THEN CONTINUE; END IF;

                UPDATE public.product_batches
                   SET stock_quantity = stock_quantity - v_take
                 WHERE id = v_batch.id;
                v_component_index := v_component_index + 1;
                INSERT INTO pg_temp.pos_combo_checkout_allocation (
                    item_index, component_index, allocation_index,
                    batch_id, quantity, cost_price
                ) VALUES (
                    v_demand.item_index, v_demand.component_index,
                    v_component_index, v_batch.id, v_take,
                    COALESCE(v_batch.cost_price, 0)
                );
                v_remaining := v_remaining - v_take;
            END LOOP;

            IF v_remaining > 0 THEN
                RAISE EXCEPTION 'INSUFFICIENT_TOTAL_BATCH_STOCK';
            END IF;
        ELSE
$new_allocation$;
    v_old_insert text := $old_insert$
        IF v_line_kind = 'standard' THEN
            SELECT demand.*, allocation.batch_id, allocation.cost_price
              INTO v_demand
              FROM pg_temp.pos_combo_checkout_demand demand
              JOIN pg_temp.pos_combo_checkout_allocation allocation
                ON allocation.item_index = demand.item_index
               AND allocation.component_index = demand.component_index
             WHERE demand.item_index = v_item_index
               AND demand.component_index = 0;

            INSERT INTO public.order_items (
                order_id, product_id, batch_id, product_name, product_code,
                unit_name, unit_price, quantity, total_price,
                cost_price_snapshot, line_type, parent_order_item_id, sort_index
            ) VALUES (
                v_order_id, v_demand.product_id, v_demand.batch_id,
                left(v_demand.product_name, 255), v_demand.product_code,
                v_demand.unit_name, v_demand.unit_price,
                v_demand.sale_quantity, v_demand.total_price,
                v_demand.cost_price, 'standard', NULL, v_demand.sort_index
            );
        ELSE
$old_insert$;
    v_new_insert text := $new_insert$
        IF v_line_kind = 'standard' THEN
            INSERT INTO public.order_items (
                order_id, product_id, batch_id, product_name, product_code,
                unit_name, unit_price, quantity, total_price,
                cost_price_snapshot, batch_allocations,
                line_type, parent_order_item_id, sort_index
            )
            SELECT
                v_order_id,
                demand.product_id,
                (
                    SELECT CASE
                        WHEN count(*) = 1 THEN (array_agg(allocation.batch_id))[1]
                        ELSE NULL
                    END
                      FROM pg_temp.pos_combo_checkout_allocation allocation
                     WHERE allocation.item_index = demand.item_index
                       AND allocation.component_index = demand.component_index
                ),
                left(demand.product_name, 255),
                demand.product_code,
                demand.unit_name,
                demand.unit_price,
                demand.sale_quantity,
                demand.total_price,
                round((
                    SELECT sum(allocation.quantity * allocation.cost_price)
                      FROM pg_temp.pos_combo_checkout_allocation allocation
                     WHERE allocation.item_index = demand.item_index
                       AND allocation.component_index = demand.component_index
                ) / NULLIF(demand.sale_quantity, 0), 2),
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'batch_id', allocation.batch_id,
                            'batch_number', batch.batch_number,
                            'expiry_date', batch.expiry_date,
                            'quantity_base', allocation.quantity,
                            'cost_price', allocation.cost_price
                        )
                        ORDER BY allocation.allocation_index
                    )
                      FROM pg_temp.pos_combo_checkout_allocation allocation
                      JOIN public.product_batches batch
                        ON batch.id = allocation.batch_id
                     WHERE allocation.item_index = demand.item_index
                       AND allocation.component_index = demand.component_index
                ),
                'standard',
                NULL,
                demand.sort_index
              FROM pg_temp.pos_combo_checkout_demand demand
             WHERE demand.item_index = v_item_index
               AND demand.component_index = 0;
        ELSE
$new_insert$;
BEGIN
    SELECT pg_get_functiondef(
        'public.create_pos_combo_order_atomic(text,jsonb,jsonb)'::regprocedure
    )
      INTO v_definition;

    IF strpos(v_definition, v_old_lock) = 0 THEN
        RAISE EXCEPTION 'COMBO_RPC_STABLE_LOCK_BLOCK_NOT_FOUND';
    END IF;
    v_definition := replace(v_definition, v_old_lock, v_new_lock);

    IF strpos(v_definition, v_old_allocation) = 0 THEN
        RAISE EXCEPTION 'COMBO_RPC_STANDARD_ALLOCATION_BLOCK_NOT_FOUND';
    END IF;
    v_definition := replace(v_definition, v_old_allocation, v_new_allocation);

    IF strpos(v_definition, v_old_insert) = 0 THEN
        RAISE EXCEPTION 'COMBO_RPC_STANDARD_INSERT_BLOCK_NOT_FOUND';
    END IF;
    v_definition := replace(v_definition, v_old_insert, v_new_insert);

    EXECUTE v_definition;
END
$patch_combo_rpc$;

REVOKE ALL ON FUNCTION public.create_pos_combo_order_atomic(
    text, jsonb, jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_pos_combo_order_atomic(
    text, jsonb, jsonb
) TO anon, authenticated;
