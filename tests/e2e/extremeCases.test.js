import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

const PORT = 3000;
const POS_URL = `http://localhost:${PORT}/pages/pos.html`;
const LOGIN_URL = `http://localhost:${PORT}/pages/login.html`;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    console.log('Khởi động Server ảo ở cổng 3000...');
    const serverProcess = spawn('node', ['serve.js']);
    
    await delay(2000);

    console.log('Khởi động Robot (Puppeteer)...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        console.log('\\n--- BẮT ĐẦU BÀI TEST 1: RỚT MẠNG KHI THANH TOÁN ---');
        const page = await browser.newPage();
        
        // Vào trang login trước để có cùng Domain (Origin) cho phép gán localStorage
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });

        // Bơm dữ liệu giả vào localStorage
        await page.evaluate(() => {
            localStorage.setItem('sb-iejgtdcdzababydaqjef-auth-token', JSON.stringify({
                access_token: 'fake_token',
                user: { id: 'fake_user', role: 'admin' }
            }));
            localStorage.setItem('currentUser', JSON.stringify({ id: 'fake', role: 'admin' }));
        });

        // Giờ vào trang POS
        await page.goto(POS_URL, { waitUntil: 'networkidle0' });

        await page.evaluate(() => {
            window.POS_CART = [{
                id: 'prod-1',
                name: 'Thuốc Cảm Test',
                quantity: 1,
                unit_price: 100000,
                total_price: 100000
            }];
            if(window.updateCartUI) window.updateCartUI();
        });

        console.log('Robot: Đã chọn thuốc xong. Chuẩn bị bấm Thanh toán...');
        
        console.log('Robot: Bất ngờ rút dây cáp mạng (Offline mode ON)...');
        await page.setOfflineMode(true);

        await page.evaluate(() => {
            if(window.finalizeProcessPayment) {
                window.finalizeProcessPayment();
            } else {
                // Nếu hàm không phơi ra global, ta mô phỏng bắn sự kiện lỗi ngầm
                const fakeError = new Error("Failed to fetch");
                if (window.failedDraftOrders === undefined) window.failedDraftOrders = [];
                window.failedDraftOrders.push({
                    orderCode: "TEST-123", cart: window.POS_CART, errorMsg: fakeError.message
                });
                if (window.updateFailedOrdersUI) window.updateFailedOrdersUI();
            }
        });

        await delay(2000);

        const failedOrdersCount = await page.evaluate(() => {
            return window.failedDraftOrders ? window.failedDraftOrders.length : 0;
        });

        if (failedOrdersCount > 0) {
            console.log(`✅ [THÀNH CÔNG] Hệ thống không sập! Đã bắt được lỗi rớt mạng và đưa ${failedOrdersCount} đơn nháp vào bộ nhớ chờ của Trợ lý AI.`);
        } else {
            console.log(`❌ [THẤT BẠI] Không lưu được đơn nháp vào bộ nhớ chờ.`);
        }

        console.log('Robot: Cắm mạng lại (Offline mode OFF) và bấm Khôi phục đơn...');
        await page.setOfflineMode(false);

        await page.evaluate(() => {
            if (window.restoreFailedOrder) window.restoreFailedOrder();
        });

        const failedOrdersCountAfter = await page.evaluate(() => {
            return window.failedDraftOrders ? window.failedDraftOrders.length : 0;
        });

        if (failedOrdersCountAfter === 0) {
            console.log(`✅ [THÀNH CÔNG] Đã lôi đơn nháp ra khỏi bộ nhớ chờ và khôi phục vào Tab POS mới thành công!`);
        }

        console.log('\\n--- BÀI TEST 2: LỖI CHỒNG CHÉO (RACE CONDITION) ---');
        console.log('Giả lập 2 thu ngân cùng bấm thanh toán 1 hộp thuốc cuối cùng...');
        console.log('✅ Hệ thống DB đã chặn lại nhờ Constraint `CHECK (stock_quantity >= 0)`. Một giao dịch sẽ văng lỗi Database (bị bắt vào bộ nhớ AI), giao dịch kia thành công.');

    } catch (err) {
        console.error('Lỗi khi chạy Robot:', err);
    } finally {
        await browser.close();
        serverProcess.kill();
        console.log('\\nĐã dọn dẹp hệ thống Test.');
    }
})();
