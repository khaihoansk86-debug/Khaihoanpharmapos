import {
    getInventoryAuditMovements,
    getInventoryAuditProductDetails
} from '../services/dbService.js';
import {
    getDueInventoryAuditSnapshots,
    markInventoryAuditSnapshotReported
} from '../services/inventoryAuditStateService.js';
import { initBrowser, sendZaloMessageCdp } from '../services/zaloService.js';
import { buildInventoryAuditFollowup } from '../rules/inventoryAuditRules.js';

function getAdminTargets(config = {}) {
    const phone = String(
        config.audit_admin_phone
        || process.env.ZALO_AUDIT_ADMIN_PHONE
        || '0333630635'
    ).trim();
    const fallbackName = String(
        config.audit_admin_name
        || process.env.ZALO_AUDIT_ADMIN_NAME
        || 'Lê Đoàn Khanh'
    ).trim();
    return [...new Set([phone, fallbackName].filter(Boolean))];
}

export async function jobInventoryAuditFollowup(currentConfig = {}, options = {}) {
    const snapshots = await getDueInventoryAuditSnapshots(options.now || new Date());
    if (snapshots.length === 0) return { reports: 0 };

    const browser = options.dryRun ? null : await initBrowser();
    let reports = 0;
    try {
        for (const snapshot of snapshots) {
            const productIds = snapshot.tasks.map(task => task.product_id);
            const [currentDetails, movements] = await Promise.all([
                getInventoryAuditProductDetails(productIds),
                getInventoryAuditMovements(productIds, snapshot.sentAt)
            ]);
            const report = buildInventoryAuditFollowup(snapshot, currentDetails, movements);
            if (options.dryRun) {
                return { reports: 0, snapshot, report };
            }

            let sent = false;
            for (const target of getAdminTargets(currentConfig)) {
                if (await sendZaloMessageCdp(browser, target, report.message)) {
                    sent = true;
                    break;
                }
            }
            if (sent) {
                await markInventoryAuditSnapshotReported(snapshot.id);
                reports += 1;
            }
        }
    } finally {
        if (browser) await browser.disconnect();
    }
    return { reports };
}
