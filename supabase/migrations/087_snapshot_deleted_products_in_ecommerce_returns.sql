-- Preserve ecommerce return snapshots after deleting products or batches.
-- Product identity, batch identity, quantity and cost are already persisted
-- on ecommerce_return_items; only the live catalog references become null.

ALTER TABLE public.ecommerce_return_items
    ALTER COLUMN product_id DROP NOT NULL,
    ALTER COLUMN batch_id DROP NOT NULL;

ALTER TABLE public.ecommerce_return_items
    DROP CONSTRAINT IF EXISTS ecommerce_return_items_product_id_fkey,
    ADD CONSTRAINT ecommerce_return_items_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.ecommerce_return_items
    DROP CONSTRAINT IF EXISTS ecommerce_return_items_batch_id_fkey,
    ADD CONSTRAINT ecommerce_return_items_batch_id_fkey
        FOREIGN KEY (batch_id) REFERENCES public.product_batches(id) ON DELETE SET NULL;
