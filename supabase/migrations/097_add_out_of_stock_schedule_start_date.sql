-- Keep the out-of-stock schedule changeover explicit. The bot skips the old
-- day's run and starts the 11:30 report from 2026-08-16 onward.

ALTER TABLE public.zalo_bot_settings
    ADD COLUMN IF NOT EXISTS cron_out_of_stock_start_date DATE
        NOT NULL DEFAULT DATE '2026-08-16';

UPDATE public.zalo_bot_settings
SET cron_out_of_stock_start_date = DATE '2026-08-16',
    updated_at = now();
