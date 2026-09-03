-- Run the daily joint inventory audit at 11:30 Vietnam time.
-- Move the out-of-stock report to 11:00 so the two jobs do not overlap.
UPDATE public.zalo_bot_settings
SET cron_audit = '30 11 * * *',
    cron_out_of_stock = '0 11 * * *',
    updated_at = now()
WHERE cron_audit IS NULL OR cron_audit IN ('0 12 * * *', '30 11 * * *');
