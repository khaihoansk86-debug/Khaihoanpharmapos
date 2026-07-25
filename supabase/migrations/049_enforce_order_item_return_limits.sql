-- Preserve a direct link to the sold line and prevent cumulative returns
-- from exceeding the quantity originally sold. This applies to standard
-- products and combo parent rows; combo component rows remain linked through
-- parent_order_item_id and keep their original batch snapshot.

ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS source_order_item_id uuid
        REFERENCES public.order_items(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_order_items_source_order_item_id
    ON public.order_items(source_order_item_id)
    WHERE source_order_item_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.enforce_order_item_return_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_source public.order_items%ROWTYPE;
    v_already_returned numeric;
    v_requested numeric;
BEGIN
    IF NEW.source_order_item_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.quantity >= 0 THEN
        RAISE EXCEPTION 'RETURN_LINE_MUST_BE_NEGATIVE';
    END IF;

    SELECT *
    INTO v_source
    FROM public.order_items
    WHERE id = NEW.source_order_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RETURN_SOURCE_ITEM_NOT_FOUND';
    END IF;

    IF v_source.quantity <= 0
       OR v_source.line_type NOT IN ('standard', 'combo_parent')
       OR NEW.line_type <> v_source.line_type THEN
        RAISE EXCEPTION 'INVALID_RETURN_SOURCE_ITEM';
    END IF;

    SELECT COALESCE(SUM(ABS(return_item.quantity)), 0)
    INTO v_already_returned
    FROM public.order_items return_item
    JOIN public.orders return_order ON return_order.id = return_item.order_id
    WHERE return_item.source_order_item_id = NEW.source_order_item_id
      AND return_order.status <> 'cancelled';

    v_requested := ABS(NEW.quantity);
    IF v_already_returned + v_requested > ABS(v_source.quantity) THEN
        RAISE EXCEPTION 'RETURN_QUANTITY_EXCEEDED: source %, sold %, already returned %, requested %',
            NEW.source_order_item_id,
            ABS(v_source.quantity),
            v_already_returned,
            v_requested;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_order_item_return_limit_trigger
    ON public.order_items;
CREATE TRIGGER enforce_order_item_return_limit_trigger
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_order_item_return_limit();

COMMENT ON COLUMN public.order_items.source_order_item_id IS
    'Immutable link from a return line to the original sold order item.';
