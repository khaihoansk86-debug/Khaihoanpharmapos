-- 055_guard_ecommerce_return_cost.sql
-- Khong cho phep ghi nhan phieu hoan TMDT neu lo hang chua co gia von.
-- Trigger nam trong cung transaction voi create_ecommerce_return, nen neu bi chan
-- thi order, ton kho va inventory movement da tao truoc do deu duoc rollback.

CREATE OR REPLACE FUNCTION public.guard_ecommerce_return_item_cost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF COALESCE(NEW.cost_price_snapshot, 0) <= 0
       OR COALESCE(NEW.total_cost, 0) <= 0 THEN
        RAISE EXCEPTION 'Lo chua co gia von, khong the lap phieu hoan TMDT.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_ecommerce_return_item_cost
    ON public.ecommerce_return_items;

CREATE TRIGGER trg_guard_ecommerce_return_item_cost
BEFORE INSERT OR UPDATE OF cost_price_snapshot, total_cost
ON public.ecommerce_return_items
FOR EACH ROW
EXECUTE FUNCTION public.guard_ecommerce_return_item_cost();

REVOKE ALL ON FUNCTION public.guard_ecommerce_return_item_cost() FROM PUBLIC;
