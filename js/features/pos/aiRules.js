// js/features/pos/aiRules.js

/**
 * Danh mục quy tắc tư vấn của Trợ lý AI Khải Hoàn
 * Bạn có thể thêm, sửa hoặc xóa các quy tắc tại đây.
 */
export const AI_RULES = [
    { 
        keyword: ['AUGMENTIN', 'AMOX', 'CEF', 'KHANG SINH', 'ZINNAT', 'CLAMYLIN'], 
        type: 'cross-sell', 
        content: 'Đơn có Kháng sinh: Mời khách mua thêm <span class="text-emerald-600 dark:text-emerald-400 font-black underline">Men vi sinh</span> để bảo vệ đường ruột.' 
    },
    { 
        keyword: ['PANADOL', 'PARACETAMOL', 'HAPACOL', 'EFFERALGAN'], 
        type: 'script', 
        content: 'Lưu ý: Không uống quá 8 viên/ngày. Tuyệt đối không uống rượu bia khi dùng thuốc.' 
    },
    { 
        keyword: ['PANADOL'], 
        type: 'cross-sell', 
        content: 'Kịch bản tư vấn Calci (10k): "Đau mình đau mẩy lấy thêm vỉ <span class="text-emerald-600 dark:text-emerald-400 font-black underline">Calci</span> này về uống cho nó mạnh gân khỏe cốt".' 
    },
    { 
        keyword: ['AUGMENTIN', 'KLAVUNAM'], 
        type: 'script', 
        content: 'Dặn khách: Nên uống ngay đầu bữa ăn để giảm tác dụng phụ lên dạ dày và hấp thu tốt nhất.' 
    },
    { 
        keyword: ['LIỀU', 'LIEU'], 
        type: 'script', 
        content: 'Kịch bản: Hỏi kỹ khách về tiền sử dị ứng hoặc các bệnh mạn tính (Tim mạch, Tiểu đường) đang điều trị.' 
    },
    {
        keyword: ['CATAFLAM', 'VOLTAREN', 'DICLOFENAC'],
        type: 'script',
        content: 'Cảnh báo: Thuốc này hại dạ dày, dặn khách uống khi no và không dùng nếu có tiền sử loét dạ dày.'
    },
    {
        keyword: ['GINKGO', 'HOẠT HUYẾT', 'TANAKAN'],
        type: 'cross-sell',
        content: 'Tư vấn thêm: Khách dùng bổ não có thể dùng kèm <span class="text-emerald-600 dark:text-emerald-400 font-black underline">Magie B6</span> để giảm đau đầu, mất ngủ hiệu quả hơn.'
    }
];
