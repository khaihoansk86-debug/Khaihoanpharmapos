-- Durable inventory-audit follow-up state shared by PharmaPOS and the Zalo bot.

CREATE TABLE IF NOT EXISTS public.zalo_inventory_audit_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_key DATE NOT NULL UNIQUE,
    sent_at TIMESTAMPTZ NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    reported_at TIMESTAMPTZ,
    metadata JSONB,
    tasks JSONB NOT NULL CHECK (jsonb_typeof(tasks) = 'array'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT zalo_inventory_audit_snapshot_times_check CHECK (
        due_at >= sent_at
        AND (reported_at IS NULL OR reported_at >= sent_at)
    ),
    CONSTRAINT zalo_inventory_audit_snapshot_metadata_check CHECK (
        metadata IS NULL OR jsonb_typeof(metadata) = 'object'
    )
);

CREATE INDEX IF NOT EXISTS idx_zalo_inventory_audit_snapshots_due
    ON public.zalo_inventory_audit_snapshots(reported_at, due_at);

ALTER TABLE public.zalo_inventory_audit_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.zalo_inventory_audit_snapshots
    FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.zalo_inventory_audit_snapshots
    TO service_role;
