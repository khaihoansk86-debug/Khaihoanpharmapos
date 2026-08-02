import { triggerAndGetDailyInventoryTasks } from '../services/dbService.js';
import { initBrowser, sendZaloMessageCdp } from '../services/zaloService.js';
import {
    buildInventoryAuditMessages,
    resolveInventoryAuditTargets
} from '../rules/inventoryAuditRules.js';
import { saveInventoryAuditSnapshot } from '../services/inventoryAuditStateService.js';

export async function jobRandomAudit(currentConfig, options = {}) {
    if (!currentConfig) return { sent: 0, tasks: 0 };
    console.log('\n--- Đang chạy: Giao kiểm kê hàng ngày (chu kỳ 20 ngày) ---');

    const targets = resolveInventoryAuditTargets(currentConfig);
    if (targets.length === 0) {
        console.warn('Chưa cấu hình nhóm nhận kiểm kê. Đặt ZALO_AUDIT_GROUP hoặc staff_list.');
        return { sent: 0, tasks: 0 };
    }

    try {
        const auditList = await triggerAndGetDailyInventoryTasks();
        if (auditList.length === 0) {
            console.log('Hôm nay không có mặt hàng cần giao kiểm kê.');
            return { sent: 0, tasks: 0 };
        }

        const messages = buildInventoryAuditMessages(auditList);
        if (options.dryRun === true) {
            return { sent: 0, tasks: auditList.length, targets, messages };
        }

        const browser = await initBrowser();
        let sent = 0;
        try {
            for (const target of targets) {
                for (const message of messages) {
                    const ok = await sendZaloMessageCdp(browser, target, message);
                    if (ok === true) sent += 1;
                }
            }
        } finally {
            await browser.disconnect();
        }

        if (sent === messages.length * targets.length) {
            await saveInventoryAuditSnapshot(auditList);
        } else {
            console.warn('Không lưu mốc báo cáo 2 giờ vì danh sách chưa được gửi đầy đủ.');
        }
        console.log(`✅ Đã gửi ${messages.length} phần kiểm kê tới: ${targets.join(', ')}`);
        return { sent, tasks: auditList.length, targets };
    } catch (error) {
        console.error('Lỗi Job Kiểm kê:', error);
        return { sent: 0, tasks: 0, error };
    }
}
