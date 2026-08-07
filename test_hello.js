import { initBrowser, sendZaloMessage } from './bot-assistant/services/zaloService.js';

(async () => {
    console.log('Khởi tạo server...');
    await initBrowser();
    console.log('Gửi tin nhắn xin chào...');
    await sendZaloMessage(null, 'lê đoàn khanh', 'Xin chào! Hệ thống Bot gửi tin nhắn tự động từ trình duyệt đã được thiết lập thành công!');
    console.log('Tin nhắn đã được đưa vào hàng đợi. Vui lòng kiểm tra tab Zalo trên Chrome.');
    // Keep alive to let the extension poll
})();
