import { initBrowser, sendZaloMessage } from '../services/zaloService.js';
import { getRandomProductsForInventoryCheck } from '../services/dbService.js';
import { CONFIG } from '../config/settings.js';

export async function jobRandomAudit() {
    console.log('\n--- Đang chạy kịch bản: Giao việc kiểm kê đột xuất ---');
    try {
        const randomCheck = await getRandomProductsForInventoryCheck(5);
        if (randomCheck.length === 0) return;

        let msg = '\uD83C\uDFB2 YÊU CẦU KIỂM KÊ ĐỘT XUẤT:\nNhờ bạn kiểm đếm thực tế mặt hàng sau và báo lại số lượng:\n\n';
        randomCheck.forEach(p => { msg += '- ' + p.name + ' (Mã: ' + p.product_code + ')\n'; });

        const browser = await initBrowser();
        const page = await browser.newPage();
        await page.goto('https://chat.zalo.me/', { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForSelector('#contact-search-input', { timeout: 180000 });

        for (const target of CONFIG.STAFF_LIST) {
            await sendZaloMessage(page, target, msg);
        }
        await browser.close();
    } catch (e) { console.error('Lỗi Job Kiểm kê:', e); }
}
