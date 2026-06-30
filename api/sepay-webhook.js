import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase Client sử dụng biến môi trường của Vercel
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Tốt nhất nên dùng SUPABASE_SERVICE_ROLE_KEY để bỏ qua RLS khi ghi webhook vào database
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    // SePay Webhook thường gọi bằng phương thức POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const payload = req.body;
        console.log('Nhận được webhook từ SePay:', JSON.stringify(payload));

        // Kiểm tra token xác thực nếu có (tùy thuộc vào cấu hình Header trong SePay)
        // Ví dụ SePay cho phép cấu hình header Authorization: Bearer <API_TOKEN>
        const authHeader = req.headers.authorization;
        const EXPECTED_TOKEN = process.env.SEPAY_WEBHOOK_TOKEN;
        if (EXPECTED_TOKEN && authHeader !== `Bearer ${EXPECTED_TOKEN}`) {
             console.error('Xác thực Webhook thất bại');
             return res.status(401).json({ error: 'Unauthorized' });
        }

        // Tùy theo cấu trúc JSON của SePay, thông thường bao gồm:
        // { id, amount, content, ... }
        // (Bạn có thể xem cấu trúc chính xác trên tài liệu của SePay)
        const transactionId = payload.id || payload.transaction_id;
        const amount = payload.amount || payload.transferAmount;
        const content = payload.content || payload.transferContent || payload.description || '';
        const bankAccount = payload.bank_account || payload.gateway || '';
        
        if (!transactionId || !amount) {
            return res.status(400).json({ error: 'Invalid payload missing id or amount' });
        }

        // Trích xuất mã đơn hàng từ nội dung chuyển khoản
        // Giả sử mã đơn hàng bắt đầu bằng HD, PX, XTMDT, TH và theo sau là chuỗi số
        let orderCode = null;
        const orderMatch = content.match(/(HD|PX|XTMDT|TH)\d{12,16}/i);
        if (orderMatch) {
            orderCode = orderMatch[0].toUpperCase();
        }

        // Lưu vào cơ sở dữ liệu
        const { data, error } = await supabase
            .from('sepay_webhooks')
            .upsert({
                transaction_id: String(transactionId),
                amount: Number(amount),
                transfer_content: content,
                order_code: orderCode,
                bank_account: bankAccount,
                raw_data: payload,
                status: 'pending' // POS sẽ lắng nghe dòng này và xử lý đơn hàng
            }, { onConflict: 'transaction_id' });

        if (error) {
            console.error('Lỗi khi lưu webhook vào Supabase:', error);
            throw error;
        }

        return res.status(200).json({ success: true, message: 'Webhook received successfully' });
    } catch (error) {
        console.error('Lỗi xử lý Webhook SePay:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
