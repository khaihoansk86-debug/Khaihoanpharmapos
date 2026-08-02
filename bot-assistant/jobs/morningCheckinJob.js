import { initBrowser, sendZaloMessage } from '../services/zaloService.js';

export async function jobMorningCheckin(currentConfig) {
    if (!currentConfig) return;
    console.log('\n--- Đang chạy kịch bản: Nhắc điểm danh ---');
    try {
        const msg = '🌞 Chúc mọi người một ngày làm việc năng lượng!\nCác bạn nhân viên ca sáng vui lòng chụp ảnh quầy và check-in tại đây nhé!';

        const browser = await initBrowser();
        const page = await browser.newPage();
        await page.goto('https://chat.zalo.me/', { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForSelector('#contact-search-input', { timeout: 180000 });

        for (const target of currentConfig.report_receivers) {
            await sendZaloMessage(page, target, msg);
        }
        await browser.close();
    } catch (e) { console.error('Lỗi Job Checkin:', e); }
}
