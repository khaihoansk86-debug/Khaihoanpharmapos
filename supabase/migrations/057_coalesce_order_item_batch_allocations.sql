-- Legacy/fallback combo checkout builds heterogeneous order item rows.
-- PostgREST fills an omitted batch_allocations field with NULL when another
-- row in the same bulk insert includes the field. Keep the database contract
-- strict while normalizing that transport-level NULL before constraints run.
CREATE OR REPLACE FUNCTION public.coalesce_order_item_batch_allocations()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.batch_allocations := COALESCE(NEW.batch_allocations, '[]'::jsonb);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_items_coalesce_batch_allocations
ON public.order_items;

CREATE TRIGGER order_items_coalesce_batch_allocations
BEFORE INSERT OR UPDATE OF batch_allocations
ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.coalesce_order_item_batch_allocations();
