-- Correct three legacy imports where a pack cost was stored as the base-unit cost.
WITH corrected_base_cost(product_code, base_cost) AS (
    VALUES
        ('SP000886'::TEXT, 250::NUMERIC),
        ('SP0007480'::TEXT, 500::NUMERIC),
        ('SP001243'::TEXT, 1060::NUMERIC)
)
UPDATE public.product_units unit_row
SET cost_price = correction.base_cost * unit_row.conversion_rate
FROM public.products product
JOIN corrected_base_cost correction
  ON correction.product_code = product.product_code
WHERE unit_row.product_id = product.id;

-- A batch price is stored per base unit. Use the configured base-unit cost only
-- when the batch has stock and no usable historical cost of its own.
UPDATE public.product_batches batch
SET cost_price = base_unit.cost_price
FROM public.product_units base_unit
WHERE base_unit.product_id = batch.product_id
  AND base_unit.is_base_unit = true
  AND batch.stock_quantity > 0
  AND coalesce(batch.cost_price, 0) <= 0
  AND base_unit.cost_price > 0;

-- Align missing internal-use snapshots with the same base-unit cost. Existing
-- positive snapshots remain immutable historical values.
UPDATE public.inventory_movements movement
SET cost_price = base_unit.cost_price
FROM public.product_units base_unit
WHERE base_unit.product_id = movement.product_id
  AND base_unit.is_base_unit = true
  AND movement.movement_type = 'internal_use'
  AND movement.quantity_base <> 0
  AND coalesce(movement.cost_price, 0) <= 0
  AND base_unit.cost_price > 0;

UPDATE public.inventory_document_items item
SET cost_price = base_unit.cost_price
FROM public.inventory_documents document,
     public.product_units base_unit
WHERE document.id = item.document_id
  AND document.document_type = 'internal_use'
  AND base_unit.product_id = item.product_id
  AND base_unit.is_base_unit = true
  AND item.quantity_base <> 0
  AND coalesce(item.cost_price, 0) <= 0
  AND base_unit.cost_price > 0;
