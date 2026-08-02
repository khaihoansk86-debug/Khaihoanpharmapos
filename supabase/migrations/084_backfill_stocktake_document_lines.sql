CREATE TEMP TABLE stocktake_line_repair ON COMMIT DROP AS
WITH all_documents AS (
    SELECT
        document.id AS document_id,
        document.confirmed_at,
        lead(document.confirmed_at) OVER (ORDER BY document.confirmed_at) AS next_confirmed_at
    FROM public.inventory_documents document
    WHERE document.document_type = 'stocktake_adjustment'
      AND document.status = 'confirmed'
), missing_documents AS (
    SELECT document.*
    FROM all_documents document
    WHERE NOT EXISTS (
          SELECT 1
          FROM public.inventory_document_items item
          WHERE item.document_id = document.document_id
      )
), matched_movements AS (
    SELECT
        document.document_id,
        movement.id AS movement_id,
        row_number() OVER (
            PARTITION BY document.document_id
            ORDER BY movement.created_at, movement.id
        ) AS line_no,
        coalesce(nullif(movement.cost_price, 0), batch.cost_price, base_unit.cost_price, 0) AS repaired_cost
    FROM missing_documents document
    JOIN public.inventory_movements movement
      ON movement.document_id IS NULL
     AND movement.movement_type = 'stocktake_adjustment'
     AND movement.created_at >= document.confirmed_at
     AND movement.created_at < least(
         coalesce(document.next_confirmed_at, document.confirmed_at + interval '15 minutes'),
         document.confirmed_at + interval '15 minutes'
     )
    LEFT JOIN public.product_batches batch
      ON batch.id = movement.batch_id
    LEFT JOIN public.product_units base_unit
      ON base_unit.product_id = movement.product_id
     AND base_unit.is_base_unit = true
)
SELECT * FROM matched_movements;

INSERT INTO public.inventory_document_items (
    document_id, line_no, product_id, batch_id, product_name, product_code,
    batch_number, expiry_date, quantity_base, counted_quantity_base,
    cost_price, reason, note, created_at
)
SELECT
    repair.document_id,
    repair.line_no,
    movement.product_id,
    movement.batch_id,
    movement.product_name,
    movement.product_code,
    movement.batch_number,
    batch.expiry_date,
    movement.quantity_base,
    NULL,
    repair.repaired_cost,
    movement.reason,
    movement.note,
    movement.created_at
FROM stocktake_line_repair repair
JOIN public.inventory_movements movement
  ON movement.id = repair.movement_id
LEFT JOIN public.product_batches batch
  ON batch.id = movement.batch_id;

UPDATE public.inventory_movements movement
SET document_id = repair.document_id,
    cost_price = repair.repaired_cost
FROM stocktake_line_repair repair
WHERE movement.id = repair.movement_id;
