-- Keep virtual combo availability fresh when any component batch changes.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'product_batches'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.product_batches;
    END IF;
END;
$$;
