-- Migration: Create Zalo Bot Settings
-- Bảng lưu trữ cấu hình cho Zalo Bot

create table if not exists public.zalo_bot_settings (
    id uuid primary key default gen_random_uuid(),
    cron_morning text not null default '0 7 * * *',
    cron_audit text not null default '0 12 * * *',
    cron_report text not null default '0 18 * * *',
    report_receivers jsonb not null default '[]'::jsonb,
    staff_list jsonb not null default '[]'::jsonb,
    low_stock_threshold integer not null default 10,
    expiring_days integer not null default 90,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Trigger cập nhật thời gian
drop trigger if exists set_zalo_bot_settings_updated_at on public.zalo_bot_settings;
create trigger set_zalo_bot_settings_updated_at
before update on public.zalo_bot_settings
for each row
execute function public.set_updated_at();

-- RLS policies
alter table public.zalo_bot_settings enable row level security;

drop policy if exists "Allow anon read zalo_bot_settings" on public.zalo_bot_settings;
create policy "Allow anon read zalo_bot_settings"
on public.zalo_bot_settings for select
to anon
using (true);

drop policy if exists "Allow anon insert zalo_bot_settings" on public.zalo_bot_settings;
create policy "Allow anon insert zalo_bot_settings"
on public.zalo_bot_settings for insert
to anon
with check (true);

drop policy if exists "Allow anon update zalo_bot_settings" on public.zalo_bot_settings;
create policy "Allow anon update zalo_bot_settings"
on public.zalo_bot_settings for update
to anon
using (true)
with check (true);

-- Insert dữ liệu mặc định nếu chưa có
INSERT INTO public.zalo_bot_settings (cron_morning, cron_audit, cron_report, report_receivers, staff_list)
SELECT '0 7 * * *', '0 12 * * *', '0 18 * * *', '["Nhóm Báo Cáo Nhà Thuốc"]', '["lê đoàn khanh"]'
WHERE NOT EXISTS (SELECT 1 FROM public.zalo_bot_settings);
