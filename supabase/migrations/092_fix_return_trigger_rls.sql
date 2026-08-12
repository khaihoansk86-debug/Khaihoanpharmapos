-- The return-limit trigger locks the original order item with FOR UPDATE.
-- Authenticated POS sessions intentionally do not have an UPDATE policy on
-- order_items, so an invoker-security function sees zero rows and incorrectly
-- raises RETURN_SOURCE_ITEM_NOT_FOUND. Run the integrity check as the database
-- owner while keeping the client unable to write arbitrary source links.

ALTER FUNCTION public.enforce_order_item_return_limit()
    SECURITY DEFINER;

ALTER FUNCTION public.enforce_order_item_return_limit()
    SET search_path = pg_catalog, public;
