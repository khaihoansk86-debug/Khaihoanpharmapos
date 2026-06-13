-- Migration 019: Create audit_logs table for tracking critical actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    performer_name TEXT NOT NULL,
    performer_role TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for reading and inserting logs
DROP POLICY IF EXISTS "Allow anon read audit_logs" ON public.audit_logs;
CREATE POLICY "Allow anon read audit_logs"
ON public.audit_logs FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Allow anon insert audit_logs" ON public.audit_logs;
CREATE POLICY "Allow anon insert audit_logs"
ON public.audit_logs FOR INSERT
TO anon
WITH CHECK (true);
