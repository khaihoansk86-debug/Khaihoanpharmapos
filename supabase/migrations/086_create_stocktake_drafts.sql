-- Recoverable stocktake drafts. Confirmed stock movements still use migration 082.
CREATE TABLE IF NOT EXISTS public.stocktake_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    draft_key TEXT NOT NULL DEFAULT 'default' CHECK (char_length(draft_key) BETWEEN 1 AND 80),
    payload JSONB NOT NULL CHECK (
        jsonb_typeof(payload) = 'object'
        AND octet_length(payload::text) <= 5242880
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, draft_key)
);

CREATE INDEX IF NOT EXISTS idx_stocktake_drafts_user_updated
    ON public.stocktake_drafts(user_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_stocktake_draft_audit_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.user_id := auth.uid();
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_stocktake_draft_audit_fields ON public.stocktake_drafts;
CREATE TRIGGER set_stocktake_draft_audit_fields
    BEFORE INSERT OR UPDATE ON public.stocktake_drafts
    FOR EACH ROW EXECUTE FUNCTION public.set_stocktake_draft_audit_fields();

ALTER TABLE public.stocktake_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own stocktake draft" ON public.stocktake_drafts;
CREATE POLICY "Users read own stocktake draft"
    ON public.stocktake_drafts FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own stocktake draft" ON public.stocktake_drafts;
CREATE POLICY "Users insert own stocktake draft"
    ON public.stocktake_drafts FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own stocktake draft" ON public.stocktake_drafts;
CREATE POLICY "Users update own stocktake draft"
    ON public.stocktake_drafts FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own stocktake draft" ON public.stocktake_drafts;
CREATE POLICY "Users delete own stocktake draft"
    ON public.stocktake_drafts FOR DELETE TO authenticated
    USING (user_id = auth.uid());

REVOKE ALL ON public.stocktake_drafts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stocktake_drafts TO authenticated;

COMMENT ON TABLE public.stocktake_drafts IS
    'Per-user recoverable UI drafts; never changes inventory until the existing atomic stocktake RPC succeeds.';
