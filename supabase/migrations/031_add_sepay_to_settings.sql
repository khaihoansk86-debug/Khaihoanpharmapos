-- Migration: Add SePay configuration fields to branch_settings
-- Created at: 2026-07-01

ALTER TABLE public.branch_settings
ADD COLUMN IF NOT EXISTS enable_sepay boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_bin varchar(50),
ADD COLUMN IF NOT EXISTS bank_account varchar(100),
ADD COLUMN IF NOT EXISTS bank_account_name varchar(255);
