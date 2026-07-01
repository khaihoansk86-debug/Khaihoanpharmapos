-- Migration: Add QR payment type setting
-- Created at: 2026-07-01

ALTER TABLE public.branch_settings
ADD COLUMN IF NOT EXISTS qr_payment_type varchar(20) DEFAULT 'none';

-- Tự động migrate data cũ (nếu họ đã bật sepay thì set qr_payment_type = 'sepay')
UPDATE public.branch_settings
SET qr_payment_type = 'sepay'
WHERE enable_sepay = true;
