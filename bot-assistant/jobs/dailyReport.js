import { initBrowser, sendZaloMessage } from '../services/zaloService.js';
import { getExpiringBatches, getLowStockProducts } from '../services/dbService.js';
import { CONFIG } from '../config/settings.js';

export async function jobDailyReport() {
    console.log('\n--- Đang chạy kịch bản: Báo cáo hàng ngày ---');
    try {
        const expiring = await getExpiringBatches(CONFIG.EXPIRING_DAYS);
        const lowStock = await getLowStockProducts(CONFIG.LOW_STOCK_THRESHOLD);

        let report = '\uD83D\uDCCA BÁO CÁO KHO HÀNG NGÀY \uD83D\uDCCA\n\n';

        report += '\u26A0\uFE0F THUỐC CẬN DATE:\n';
        if (expiring.length === 0) report += '- Không có.\n';
        else expiring.forEach(b => { report += '- ' + (b.products ? b.products.name : '') + ' (HSD: ' + b.expiry_date + ')\n'; });

        report += '\n\uD83D\uDD3B SẮP HẾT HÀNG:\n';
        if (lowStock.length === 0) report += '- Không có.\n';
        else lowStock.forEach(p => { report += '- ' + p.name + ' (Tồn: ' + p.total_stock + ')\n'; });

        const browser = await initBrowser();
        const page = await browser.newPage();
        await page.goto('https://chat.zalo.me/', { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForSelector('#contact-search-input', { timeout: 180000 });

        for (const target of CONFIG.REPORT_RECEIVERS) {
            await sendZaloMessage(page, target, report);
        }
        await browser.close();
    } catch (e) { console.error('Lỗi Job Báo cáo:', e); }
}
