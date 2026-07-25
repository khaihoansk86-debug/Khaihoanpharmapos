-- Persist the exact sale-time unit cost used by combo component rows.
-- Existing rows stay nullable and keep using the legacy batch/unit fallback.
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS cost_price_snapshot numeric(14, 2)
        CHECK (cost_price_snapshot IS NULL OR cost_price_snapshot >= 0);

-- Create mixed standard/combo retail and ecommerce orders in one transaction.
-- Combo recipes and unit conversions are read and validated on the server.
CREATE OR REPLACE FUNCTION public.create_pos_combo_order_atomic(
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
    v_component jsonb;
    v_component_index integer;
    v_product record;
    v_component_meta record;
    v_batch record;
    v_demand record;
    v_allocation record;
    v_parent_item_id uuid;
    v_required numeric;
    v_remaining numeric;
    v_take numeric;
    v_item_count integer;
    v_calculated_subtotal numeric;
    v_subtotal numeric;
    v_discount numeric;
    v_total numeric;
    v_line_kind text;
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

    CREATE TEMP TABLE IF NOT EXISTS pos_combo_checkout_demand (
        item_index integer NOT NULL,
        component_index integer NOT NULL,
        line_kind text NOT NULL,
        product_id uuid NOT NULL,
        preferred_batch_id uuid,
        required_quantity numeric NOT NULL,
        product_name text NOT NULL,
        product_code text,
        unit_name text,
        unit_price numeric NOT NULL,
        sale_quantity numeric NOT NULL,
        total_price numeric NOT NULL,
        sort_index integer NOT NULL,
        PRIMARY KEY (item_index, component_index)
    ) ON COMMIT DROP;
    TRUNCATE pg_temp.pos_combo_checkout_demand;

    CREATE TEMP TABLE IF NOT EXISTS pos_combo_checkout_allocation (
        item_index integer NOT NULL,
        component_index integer NOT NULL,
        allocation_index integer NOT NULL,
        batch_id uuid NOT NULL,
        quantity numeric NOT NULL,
        cost_price numeric NOT NULL,
        PRIMARY KEY (item_index, component_index, allocation_index)
    ) ON COMMIT DROP;
    TRUNCATE pg_temp.pos_combo_checkout_allocation;

    -- Build and validate all stock demand before any order row is inserted.
    FOR v_item, v_item_index IN
        SELECT value, ordinality::integer
          FROM jsonb_array_elements(p_items) WITH ORDINALITY
    LOOP
        v_line_kind := COALESCE(v_item->>'line_kind', '');
        IF v_line_kind NOT IN ('standard', 'combo')
           OR COALESCE(v_item->>'product_id', '') !~
                '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
           OR COALESCE((v_item->>'quantity')::numeric, 0) <= 0
           OR COALESCE((v_item->>'unit_price')::numeric, -1) < 0
           OR COALESCE((v_item->>'total_price')::numeric, -1)
                <> COALESCE((v_item->>'unit_price')::numeric, 0)
                   * COALESCE((v_item->>'quantity')::numeric, 0) THEN
            RAISE EXCEPTION 'INVALID_ORDER_ITEM';
        END IF;

        SELECT id, name, product_code, description, is_active
          INTO v_product
          FROM public.products
         WHERE id = (v_item->>'product_id')::uuid;
        IF v_product.id IS NULL OR v_product.is_active IS NOT TRUE THEN
            RAISE EXCEPTION 'PRODUCT_NOT_AVAILABLE';
        END IF;

        IF v_line_kind = 'standard' THEN
            IF NULLIF(v_item->>'preferred_batch_id', '') IS NULL
               OR COALESCE((v_item->>'stock_quantity')::numeric, 0) <= 0 THEN
                RAISE EXCEPTION 'INVALID_STANDARD_ITEM';
            END IF;

            INSERT INTO pg_temp.pos_combo_checkout_demand (
                item_index, component_index, line_kind, product_id,
                preferred_batch_id, required_quantity, product_name,
                product_code, unit_name, unit_price, sale_quantity,
                total_price, sort_index
            ) VALUES (
                v_item_index, 0, 'standard', v_product.id,
                (v_item->>'preferred_batch_id')::uuid,
                (v_item->>'stock_quantity')::numeric,
                v_product.name, v_product.product_code,
                NULLIF(v_item->>'unit_name', ''),
                (v_item->>'unit_price')::numeric,
                (v_item->>'quantity')::numeric,
                (v_item->>'total_price')::numeric,
                COALESCE((v_item->>'sort_index')::integer, (v_item_index - 1) * 10000)
            );
        ELSE
            IF COALESCE((v_product.description::jsonb->>'isCombo')::boolean, false) IS NOT TRUE
               OR jsonb_typeof(v_product.description::jsonb->'items') <> 'array'
               OR jsonb_array_length(v_product.description::jsonb->'items') < 1
               OR jsonb_array_length(v_product.description::jsonb->'items') > 100 THEN
                RAISE EXCEPTION 'INVALID_COMBO_DEFINITION';
            END IF;

            FOR v_component, v_component_index IN
                SELECT value, ordinality::integer
                  FROM jsonb_array_elements(v_product.description::jsonb->'items') WITH ORDINALITY
            LOOP
                IF COALESCE(v_component->>'id', '') !~
                        '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
                   OR length(btrim(COALESCE(v_component->>'unit', ''))) < 1
                   OR COALESCE((v_component->>'quantity')::numeric, 0) <= 0 THEN
                    RAISE EXCEPTION 'INVALID_COMBO_COMPONENT';
                END IF;

                SELECT
                    product.id,
                    product.name,
                    product.product_code,
                    product.description,
                    recipe_unit.conversion_rate,
                    COALESCE(base_unit.unit_name, recipe_unit.unit_name) AS base_unit_name
                  INTO v_component_meta
                  FROM public.products product
                  JOIN public.product_units recipe_unit
                    ON recipe_unit.product_id = product.id
                   AND lower(btrim(recipe_unit.unit_name)) =
                       lower(btrim(v_component->>'unit'))
                   AND recipe_unit.conversion_rate > 0
                  LEFT JOIN LATERAL (
                      SELECT unit_name
                        FROM public.product_units
                       WHERE product_id = product.id
                         AND is_base_unit IS TRUE
                       ORDER BY unit_name
                       LIMIT 1
                  ) base_unit ON true
                 WHERE product.id = (v_component->>'id')::uuid
                   AND product.is_active IS TRUE;

                IF v_component_meta.id IS NULL THEN
                    RAISE EXCEPTION 'COMBO_COMPONENT_OR_UNIT_NOT_FOUND';
                END IF;
                v_required :=
                    (v_item->>'quantity')::numeric
                    * (v_component->>'quantity')::numeric
                    * v_component_meta.conversion_rate;

                INSERT INTO pg_temp.pos_combo_checkout_demand (
                    item_index, component_index, line_kind, product_id,
                    preferred_batch_id, required_quantity, product_name,
                    product_code, unit_name, unit_price, sale_quantity,
                    total_price, sort_index
                ) VALUES (
                    v_item_index, v_component_index, 'combo_component',
                    v_component_meta.id, NULL, v_required,
                    v_component_meta.name, v_component_meta.product_code,
                    v_component_meta.base_unit_name, 0, v_required, 0,
                    COALESCE((v_item->>'sort_index')::integer, (v_item_index - 1) * 10000)
                        + (v_component_index * 100)
                );
            END LOOP;
        END IF;
    END LOOP;

    -- Lock every relevant lot in a stable order to prevent partial checkout
    -- and reduce deadlocks between concurrent mixed carts.
    PERFORM 1
      FROM public.product_batches batch
     WHERE batch.product_id IN (
         SELECT DISTINCT product_id
           FROM pg_temp.pos_combo_checkout_demand
     )
     ORDER BY batch.id
     FOR UPDATE;

    -- Allocate and decrement only after all demand and product metadata pass.
    FOR v_demand IN
        SELECT *
          FROM pg_temp.pos_combo_checkout_demand
         ORDER BY item_index, component_index
    LOOP
        v_remaining := v_demand.required_quantity;

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
            v_component_index := 0;
            FOR v_batch IN
                SELECT id, stock_quantity, cost_price
                  FROM public.product_batches
                 WHERE product_id = v_demand.product_id
                   AND stock_quantity > 0
                 ORDER BY expiry_date ASC NULLS LAST, id
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
                RAISE EXCEPTION 'INSUFFICIENT_COMBO_COMPONENT_STOCK';
            END IF;
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
        v_line_kind := v_item->>'line_kind';
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
            SELECT id, name, product_code
              INTO v_product
              FROM public.products
             WHERE id = (v_item->>'product_id')::uuid;

            INSERT INTO public.order_items (
                order_id, product_id, batch_id, product_name, product_code,
                unit_name, unit_price, quantity, total_price,
                cost_price_snapshot, line_type, parent_order_item_id, sort_index
            ) VALUES (
                v_order_id, v_product.id, NULL,
                left(v_product.name, 255), v_product.product_code,
                COALESCE(NULLIF(v_item->>'unit_name', ''), 'Combo'),
                (v_item->>'unit_price')::numeric,
                (v_item->>'quantity')::numeric,
                (v_item->>'total_price')::numeric,
                NULL, 'combo_parent', NULL,
                COALESCE((v_item->>'sort_index')::integer, (v_item_index - 1) * 10000)
            )
            RETURNING id INTO v_parent_item_id;

            FOR v_allocation IN
                SELECT
                    demand.*,
                    allocation.allocation_index,
                    allocation.batch_id,
                    allocation.quantity AS allocated_quantity,
                    allocation.cost_price
                  FROM pg_temp.pos_combo_checkout_demand demand
                  JOIN pg_temp.pos_combo_checkout_allocation allocation
                    ON allocation.item_index = demand.item_index
                   AND allocation.component_index = demand.component_index
                 WHERE demand.item_index = v_item_index
                   AND demand.line_kind = 'combo_component'
                 ORDER BY demand.component_index, allocation.allocation_index
            LOOP
                INSERT INTO public.order_items (
                    order_id, product_id, batch_id, product_name, product_code,
                    unit_name, unit_price, quantity, total_price,
                    cost_price_snapshot, line_type, parent_order_item_id, sort_index
                ) VALUES (
                    v_order_id, v_allocation.product_id, v_allocation.batch_id,
                    left(v_allocation.product_name, 255),
                    v_allocation.product_code, v_allocation.unit_name,
                    0, v_allocation.allocated_quantity, 0,
                    v_allocation.cost_price, 'combo_component',
                    v_parent_item_id,
                    v_allocation.sort_index + v_allocation.allocation_index
                );
            END LOOP;
        END IF;
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
        'idempotent_replay', false,
        'combo_component_rows', (
            SELECT count(*)
              FROM public.order_items
             WHERE order_id = v_order_id
               AND line_type = 'combo_component'
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_pos_combo_order_atomic(
    text, jsonb, jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_pos_combo_order_atomic(
    text, jsonb, jsonb
) TO anon, authenticated;
