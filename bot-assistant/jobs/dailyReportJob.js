import { getExpiringBatches, getLowStockProducts } from '../services/dbService.js';
import { initBrowser, sendZaloMessage } from '../services/zaloService.js';

export async function jobDailyReport(currentConfig) {
    if (!currentConfig) return;
    console.log('\n--- Đang chạy kịch bản: Báo cáo hàng ngày ---');
    try {
        const expiring = await getExpiringBatches(currentConfig.expiring_days);
        const lowStock = await getLowStockProducts(currentConfig.low_stock_threshold);

        let report = '📊 BÁO CÁO KHO HÀNG NGÀY 📊\n\n';

        report += '⚠️ THUỐC CẬN DATE:\n';
        if (expiring.length === 0) report += '- Không có.\n';
        else expiring.forEach(b => { report += '- ' + (b.products ? b.products.name : '') + ' (HSD: ' + b.expiry_date + ')\n'; });

        report += '\n🔻 SẮP HẾT HÀNG:\n';
        if (lowStock.length === 0) report += '- Không có.\n';
        else lowStock.forEach(p => { report += '- ' + p.name + ' (Tồn: ' + p.total_stock + ')\n'; });

        const browser = await initBrowser();
        const page = await browser.newPage();
        await page.goto('https://chat.zalo.me/', { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForSelector('#contact-search-input', { timeout: 180000 });

        for (const target of currentConfig.report_receivers) {
            await sendZaloMessage(page, target, report);
        }
        await browser.close();
    } catch (e) { console.error('Lỗi Job Báo cáo:', e); }
}
