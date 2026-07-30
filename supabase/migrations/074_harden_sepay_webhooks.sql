-- SePay writes must only come from the server-side webhook.
-- Authenticated POS clients retain read access for Realtime confirmation.
REVOKE ALL ON TABLE public.sepay_webhooks FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.sepay_webhooks
FROM authenticated;
GRANT SELECT ON TABLE public.sepay_webhooks TO authenticated;

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'sepay_webhooks'
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.sepay_webhooks',
            policy_record.policyname
        );
    END LOOP;
END
$$;

CREATE POLICY "Authenticated POS can read SePay confirmations"
ON public.sepay_webhooks
FOR SELECT
TO authenticated
USING (true);
