import { ensureZaloHealthy, initBrowser } from '../services/zaloService.js';

export async function jobZaloHeartbeat() {
    let browser;
    try {
        browser = await initBrowser();
        const result = await ensureZaloHealthy(browser);
        console.log('Zalo heartbeat:', result);
        return result;
    } catch (error) {
        console.error('Zalo heartbeat lỗi:', error.message);
        return { healthy: false, action: 'chrome_unavailable', error: error.message };
    } finally {
        if (browser) await browser.disconnect();
    }
}
