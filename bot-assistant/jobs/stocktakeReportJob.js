import { getTodayStocktakeDocuments } from '../services/dbService.js';
import { initBrowser, sendZaloMessage } from '../services/zaloService.js';
import {
    buildStocktakeReportMessage,
    getVietnamDateKey
} from '../rules/stocktakeReportRules.js';

export async function jobStocktakeReport(currentConfig, options = {}) {
    if (!currentConfig || !Array.isArray(currentConfig.report_receivers)) {
        return { sent: 0, status: 'skipped' };
    }

    const now = options.now || new Date();
    const dateKey = options.dateKey || getVietnamDateKey(now);
    const fetchDocuments = options.fetchDocuments || getTodayStocktakeDocuments;
    console.log(`\n--- Đang chạy báo cáo kiểm kho ngày ${dateKey} ---`);

    let documents = [];
    let queryError = null;
    try {
        documents = await fetchDocuments({ dateKey, now });
    } catch (error) {
        queryError = error;
        console.error('Lỗi truy vấn báo cáo kiểm kho:', error.message);
    }

    const message = buildStocktakeReportMessage({ dateKey, documents, error: queryError });
    if (options.dryRun === true) {
        return {
            sent: 0,
            status: queryError ? 'query_error' : 'ready',
            dateKey,
            documents,
            message
        };
    }

    const browser = await initBrowser();
    let sent = 0;
    try {
        for (const target of currentConfig.report_receivers) {
            await sendZaloMessage(browser, target, message);
            sent += 1;
        }
    } finally {
        await browser.disconnect();
    }
    return {
        sent,
        status: queryError ? 'query_error' : 'sent',
        dateKey,
        documentCount: documents.length
    };
}
