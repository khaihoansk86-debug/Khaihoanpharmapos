// js/features/pos/aiService.js

const CROSS_SELL_RULES = [
    {
        keywords: ['KHÁNG SINH', 'AUGMENTIN', 'AMOX', 'CEFA'],
        suggestions: [
            { name: 'Men vi sinh', code: 'MEN-VISINH', note: 'Uống kèm kháng sinh để tránh tiêu chảy' },
            { name: 'Vitamin C', code: 'VIT-C', note: 'Tăng cường đề kháng' }
        ]
    },
    {
        keywords: ['GIẢM ĐAU', 'PARACETAMOL', 'PANADOL', 'HẠ SỐT'],
        suggestions: [
            { name: 'Vitamin C', code: 'VIT-C', note: 'Hỗ trợ giảm mệt mỏi khi sốt' },
            { name: 'Oresol', code: 'ORESOL', note: 'Bù nước nếu có sốt cao' }
        ]
    },
    {
        keywords: ['HO', 'HO-CO-DAM', 'PROSPAN', 'ACEMUC'],
        suggestions: [
            { name: 'Kẹo ngậm ho', code: 'KEO-NGAM', note: 'Dịu họng, giảm kích ứng' },
            { name: 'Xịt họng', code: 'XIT-HONG', note: 'Sát khuẩn tại chỗ' }
        ]
    },
    {
        keywords: ['DẠ DÀY', 'BAO-TU', 'PHOSPHALUGEL', 'GAVISCON'],
        suggestions: [
            { name: 'Men tiêu hóa', code: 'MEN-TIEU-HOA', note: 'Hỗ trợ tiêu hóa tốt hơn' }
        ]
    }
];

/**
 * Phân tích giỏ hàng và đưa ra gợi ý bán kèm (Cross-sell) cho người bán ở POS
 */
export function getAISuggestions(cart, allProducts) {
    if (!cart || cart.length === 0) return [];

    const suggestions = new Map();

    cart.forEach(item => {
        const itemName = (item.name || '').toUpperCase();
        
        CROSS_SELL_RULES.forEach(rule => {
            const match = rule.keywords.some(kw => itemName.includes(kw));
            if (match) {
                rule.suggestions.forEach(sug => {
                    // Tránh gợi ý sản phẩm đã có trong giỏ
                    const alreadyInCart = cart.some(i => (i.code || '').includes(sug.code) || (i.name || '').toUpperCase().includes(sug.name.toUpperCase()));
                    if (!alreadyInCart) {
                        // Tìm sản phẩm thực tế trong kho để lấy mã chính xác
                        const realProduct = allProducts.find(p => (p.name || '').toUpperCase().includes(sug.name.toUpperCase()));
                        suggestions.set(sug.name, {
                            type: 'cross-sell',
                            name: sug.name,
                            code: sug.code,
                            note: sug.note,
                            realCode: realProduct?.product_code || null
                        });
                    }
                });
            }
        });
    });

    return Array.from(suggestions.values());
}

/**
 * Render danh sách gợi ý bán kèm vào bóng chat AI hỗ trợ bán hàng
 */
export function renderAISuggestions(suggestions) {
    const container = document.getElementById('aiSuggestions');
    if (!container) return;

    if (suggestions.length === 0) {
        container.innerHTML = `
            <div class="px-4 py-2 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-white/50 dark:border-slate-700/50 shrink-0">
                <p class="text-[11px] text-slate-500 italic">Thêm sản phẩm để AI bắt đầu tư vấn...</p>
            </div>
        `;
        return;
    }

    container.innerHTML = suggestions.map(sug => `
        <div class="px-5 py-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-900 shadow-sm shrink-0 flex items-center gap-3 group hover:border-blue-500 transition-all cursor-pointer" 
             onclick="window.selectProduct('${sug.realCode || sug.code}')" title="Bấm để thêm sản phẩm gợi ý này vào giỏ">
            <div class="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-lg shrink-0">
                <i class="fa-solid fa-plus"></i>
            </div>
            <div class="min-w-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                    <span class="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-black rounded uppercase tracking-wider">Bán Kèm</span>
                    <div class="text-sm font-black text-slate-700 dark:text-slate-200 uppercase truncate max-w-[150px]">${sug.name}</div>
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]">${sug.note}</div>
            </div>
        </div>
    `).join('');
}
