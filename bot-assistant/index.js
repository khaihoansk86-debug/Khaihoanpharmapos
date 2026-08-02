import cron from 'node-cron';
import { CONFIG } from './config/settings.js';
import { jobDailyReport } from './jobs/dailyReportJob.js';
import { jobMorningCheckin } from './jobs/morningCheckinJob.js';
import { jobRandomAudit } from './jobs/randomAuditJob.js';
import { jobStocktakeReport } from './jobs/stocktakeReportJob.js';
import { jobInventoryAuditFollowup } from './jobs/inventoryAuditFollowupJob.js';
import { jobZaloHeartbeat } from './jobs/zaloHeartbeatJob.js';
import { supabase } from './services/dbService.js';

let scheduledJobs = [];
let currentConfig = null;

function getLocalFallbackConfig() {
    return {
        cron_morning: CONFIG.CRON.MORNING_CHECKIN,
        cron_audit: CONFIG.CRON.RANDOM_AUDIT,
        cron_report: CONFIG.CRON.DAILY_REPORT,
        report_receivers: CONFIG.REPORT_RECEIVERS,
        staff_list: CONFIG.STAFF_LIST,
        low_stock_threshold: CONFIG.LOW_STOCK_THRESHOLD,
        expiring_days: CONFIG.EXPIRING_DAYS,
        audit_admin_phone: CONFIG.AUDIT_ADMIN_PHONE,
        audit_admin_name: CONFIG.AUDIT_ADMIN_NAME
    };
}

async function loadConfigAndSchedule() {
    try {
        const { data, error } = await supabase
            .from('zalo_bot_settings')
            .select('*')
            .limit(1)
            .single();

        const resolvedConfig = error ? getLocalFallbackConfig() : data;
        if (error) {
            console.warn('Không lấy được cấu hình bot từ DB; đang dùng cấu hình cục bộ.', error.message);
        }

        const newConfigStr = JSON.stringify(resolvedConfig);
        if (JSON.stringify(currentConfig) === newConfigStr) return;

        console.log('\n🔄 Cấu hình thay đổi, đang cập nhật lịch chạy...');
        currentConfig = resolvedConfig;
        scheduledJobs.forEach(job => job.stop());
        scheduledJobs = [];

        if (currentConfig.cron_morning) {
            scheduledJobs.push(cron.schedule(
                currentConfig.cron_morning,
                () => jobMorningCheckin(currentConfig),
                { timezone: 'Asia/Ho_Chi_Minh' }
            ));
            console.log(`- Nhắc điểm danh: ${currentConfig.cron_morning}`);
        }
        if (currentConfig.cron_audit) {
            scheduledJobs.push(cron.schedule(
                currentConfig.cron_audit,
                () => jobRandomAudit(currentConfig),
                { timezone: 'Asia/Ho_Chi_Minh' }
            ));
            console.log(`- Kiểm kê chu kỳ 20 ngày: ${currentConfig.cron_audit}`);
        }
        if (currentConfig.cron_report) {
            scheduledJobs.push(cron.schedule(
                currentConfig.cron_report,
                () => jobDailyReport(currentConfig),
                { timezone: 'Asia/Ho_Chi_Minh' }
            ));
            console.log(`- Báo cáo cuối ngày: ${currentConfig.cron_report}`);
        }

        scheduledJobs.push(cron.schedule(
            '0 14 * * *',
            () => jobStocktakeReport(currentConfig),
            { timezone: 'Asia/Ho_Chi_Minh' }
        ));
        scheduledJobs.push(cron.schedule(
            '*/5 * * * *',
            () => jobInventoryAuditFollowup(currentConfig),
            { timezone: 'Asia/Ho_Chi_Minh' }
        ));
        scheduledJobs.push(cron.schedule(
            '0 * * * *',
            () => jobZaloHeartbeat(),
            { timezone: 'Asia/Ho_Chi_Minh' }
        ));
        console.log('- Báo cáo phiếu kiểm kho: 0 14 * * *');
        console.log('- Theo dõi kiểm kê sau 2 giờ: mỗi 5 phút kiểm tra một lần');
        console.log('- Zalo heartbeat: mỗi giờ');
        console.log('✅ Cập nhật lịch chạy thành công.');
    } catch (error) {
        console.error('Lỗi tải cấu hình bot:', error);
    }
}

console.log('🚀 Zalo Bot Assistant đã khởi động.');
console.log('Đang kết nối database để lấy cấu hình...');
loadConfigAndSchedule();
setInterval(loadConfigAndSchedule, 5 * 60 * 1000);
