-- Migration 018: Create device_sync_status table for tracking offline queues across devices
CREATE TABLE IF NOT EXISTS public.device_sync_status (
    device_key TEXT PRIMARY KEY, -- Unique key stored in LocalStorage
    device_name TEXT NOT NULL,
    unsynced_count INTEGER NOT NULL DEFAULT 0,
    last_user_name TEXT,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.device_sync_status ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for the POS client (anon key)
DROP POLICY IF EXISTS "Allow anon read device_sync_status" ON public.device_sync_status;
CREATE POLICY "Allow anon read device_sync_status"
ON public.device_sync_status FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Allow anon insert device_sync_status" ON public.device_sync_status;
CREATE POLICY "Allow anon insert device_sync_status"
ON public.device_sync_status FOR INSERT
TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update device_sync_status" ON public.device_sync_status;
CREATE POLICY "Allow anon update device_sync_status"
ON public.device_sync_status FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
