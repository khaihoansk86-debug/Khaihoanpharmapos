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
 * Quét toàn bộ kho hàng để tìm các mặt hàng cận hạn hoặc tồn lâu chưa bán
 */
export function getInventoryAlerts(allProducts) {
    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nearExpiryBatches = [];
    const slowMovingBatches = [];

    (allProducts || []).forEach(product => {
        // Bỏ qua hàng combo hoặc thuốc cắt liều (thuốc cắt liều không quản lý tồn theo lô thực tế)
        const catName = product.product_categories?.name || product.categories?.name || '';
        const isCombo = catName.toLowerCase().includes('combo');
        const isDose = catName.toLowerCase().includes('cắt liều') || catName.toLowerCase().includes('thuốc liều') || product.product_code?.startsWith('DOSE-');
        if (isCombo || isDose) return;

        (product.product_batches || []).forEach(batch => {
            const stock = Number(batch.stock_quantity || 0);
            if (stock <= 0) return;

            // 1. Kiểm tra hàng hết hạn hoặc cận hạn (trong vòng 90 ngày)
            if (batch.expiry_date) {
                const expiry = new Date(`${batch.expiry_date}T00:00:00`);
                if (!isNaN(expiry.getTime())) {
                    const daysLeft = Math.ceil((expiry - today) / 86400000);
                    if (daysLeft <= 90) { 
                        nearExpiryBatches.push({
                            product,
                            batch,
                            daysLeft
                        });
                    }
                }
            }

            // 2. Kiểm tra hàng tồn lâu chưa bán (nhập >= 30 ngày trước)
            if (batch.created_at) {
                const importDate = new Date(batch.created_at);
                if (!isNaN(importDate.getTime())) {
                    const ageInDays = Math.floor((today - importDate) / 86400000);
                    if (ageInDays >= 30) {
                        slowMovingBatches.push({
                            product,
                            batch,
                            ageInDays
                        });
                    }
                }
            }
        });
    });

    // Sắp xếp cận hạn tăng dần (nguy cấp nhất lên đầu)
    nearExpiryBatches.sort((a, b) => a.daysLeft - b.daysLeft);
    
    // Sắp xếp tồn lâu giảm dần (lâu nhất lên đầu)
    slowMovingBatches.sort((a, b) => b.ageInDays - a.ageInDays);

    // BỘ ĐỆM DEMO TỒN LÂU:
    // Nếu danh sách tồn lâu rỗng (do dữ liệu demo mới import hôm nay, ageInDays = 0),
    // ta lấy tạm 3 lô có ngày nhập xa nhất trong cơ sở dữ liệu để làm mẫu hiển thị.
    if (slowMovingBatches.length === 0 && allProducts.length > 0) {
        const tempBatches = [];
        allProducts.forEach(product => {
            const catName = product.product_categories?.name || product.categories?.name || '';
            if (catName.toLowerCase().includes('combo') || catName.toLowerCase().includes('cắt liều') || product.product_code?.startsWith('DOSE-')) return;

            (product.product_batches || []).forEach(batch => {
                const stock = Number(batch.stock_quantity || 0);
                if (stock > 0 && batch.created_at) {
                    const importDate = new Date(batch.created_at);
                    if (!isNaN(importDate.getTime())) {
                        const ageInDays = Math.floor((today - importDate) / 86400000);
                        tempBatches.push({ product, batch, ageInDays });
                    }
                }
            });
        });
        tempBatches.sort((a, b) => new Date(a.batch.created_at) - new Date(b.batch.created_at));
        slowMovingBatches.push(...tempBatches.slice(0, 3));
    }

    // Chuyển đổi các lô cận hạn thành gợi ý AI
    nearExpiryBatches.slice(0, 3).forEach(item => {
        const days = item.daysLeft;
        let note = '';
        let type = 'near-expiry';
        if (days < 0) {
            note = `⚠️ ĐÃ HẾT HẠN từ ${Math.abs(days)} ngày trước! Lô: ${item.batch.batch_number}`;
            type = 'expired';
        } else if (days === 0) {
            note = `⚠️ Hết hạn HÔM NAY! Lô: ${item.batch.batch_number}`;
        } else {
            note = `⏳ Cận date: Còn ${days} ngày (HSD: ${new Date(item.batch.expiry_date).toLocaleDateString('vi-VN')}). Lô: ${item.batch.batch_number}`;
        }

        alerts.push({
            type,
            name: item.product.name,
            code: item.product.product_code,
            realCode: item.product.product_code,
            note: `${note} (Tồn: ${item.batch.stock_quantity})`
        });
    });

    // Chuyển đổi các lô tồn lâu thành gợi ý AI
    slowMovingBatches.slice(0, 3).forEach(item => {
        const timeText = item.ageInDays > 0 
            ? `${item.ageInDays} ngày trước` 
            : 'hôm nay (mẫu thử)';
        alerts.push({
            type: 'slow-moving',
            name: item.product.name,
            code: item.product.product_code,
            realCode: item.product.product_code,
            note: `📦 Tồn lâu: Nhập từ ${timeText} chưa bán hết. Lô: ${item.batch.batch_number} (Tồn: ${item.batch.stock_quantity})`
        });
    });

    return alerts;
}

/**
 * Phân tích giỏ hàng và đưa ra gợi ý bán kèm và các nhắc nhở kho hàng thông minh
 */
export function getAISuggestions(cart, allProducts) {
    const suggestions = new Map();

    // 1. Tạo gợi ý bán kèm (Cross-sell) nếu có sản phẩm trong giỏ
    if (cart && cart.length > 0) {
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
                            suggestions.set('cross_' + sug.name, {
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
    }

    // 2. Luôn quét kho để lấy các nhắc nhở hàng cận date và hàng tồn kho lâu
    const inventoryAlerts = getInventoryAlerts(allProducts);
    inventoryAlerts.forEach(alert => {
        // Chỉ nhắc nhở các sản phẩm chưa có trong giỏ hàng
        const alreadyInCart = cart ? cart.some(i => i.code === alert.code) : false;
        if (!alreadyInCart) {
            suggestions.set(alert.type + '_' + alert.code, alert);
        }
    });

    return Array.from(suggestions.values());
}

/**
 * Render danh sách gợi ý vào bóng chat AI
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

    container.innerHTML = suggestions.map(sug => {
        let themeClasses = '';
        let iconHtml = '';
        let prefixBadge = '';

        if (sug.type === 'expired' || sug.type === 'near-expiry') {
            const isExpired = sug.type === 'expired';
            themeClasses = isExpired
                ? 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 hover:border-red-500'
                : 'border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10 hover:border-amber-500';
            
            iconHtml = isExpired
                ? '<i class="fa-solid fa-triangle-exclamation text-red-500"></i>'
                : '<i class="fa-solid fa-hourglass-half text-amber-500 animate-pulse"></i>';
                
            prefixBadge = isExpired
                ? '<span class="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[9px] font-black rounded uppercase tracking-wider">Hết Hạn</span>'
                : '<span class="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[9px] font-black rounded uppercase tracking-wider">Cận Hạn</span>';
        } else if (sug.type === 'slow-moving') {
            themeClasses = 'border-violet-200 dark:border-violet-900/50 bg-violet-50/30 dark:bg-violet-950/10 hover:border-violet-500';
            iconHtml = '<i class="fa-solid fa-calendar-minus text-violet-500"></i>';
            prefixBadge = '<span class="px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-[9px] font-black rounded uppercase tracking-wider">Tồn Lâu</span>';
        } else {
            // Cross-sell
            themeClasses = 'border-blue-100 dark:border-blue-900 bg-white dark:bg-slate-800 hover:border-blue-500';
            iconHtml = '<i class="fa-solid fa-plus text-blue-600 dark:text-blue-400"></i>';
            prefixBadge = '<span class="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-black rounded uppercase tracking-wider">Bán Kèm</span>';
        }

        const realCode = sug.realCode || sug.code;

        return `
            <div class="px-5 py-3 rounded-xl border shadow-sm shrink-0 flex items-center gap-3 group transition-all cursor-pointer ${themeClasses}" 
                 onclick="window.selectProduct('${realCode}')" title="Bấm để chọn bán sản phẩm này">
                <div class="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-base shrink-0">
                    ${iconHtml}
                </div>
                <div class="min-w-0">
                    <div class="flex items-center gap-1.5 mb-0.5">
                        ${prefixBadge}
                        <div class="text-sm font-black text-slate-700 dark:text-slate-200 uppercase truncate max-w-[150px]" title="${sug.name}">${sug.name}</div>
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]" title="${sug.note}">${sug.note}</div>
                </div>
            </div>
        `;
    }).join('');
}
