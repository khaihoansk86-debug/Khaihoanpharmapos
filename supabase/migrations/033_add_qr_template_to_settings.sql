-- Migration: Add QR template setting
-- Created at: 2026-07-01

ALTER TABLE public.branch_settings
ADD COLUMN IF NOT EXISTS qr_template varchar(50) DEFAULT 'compact2.png';
