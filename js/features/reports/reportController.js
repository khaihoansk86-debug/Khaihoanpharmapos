import { initLayout } from '../../components/layout.js';
import { fetchDashboardAnalytics } from './reportService.js';

let currentAnalytics = null;
let productSearch = '';
let reportMode = 'quantity';
let currentOrderType = 'all';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

const REPORT_MODES = {
    quantity: { title: 'Hàng bán mạnh hôm nay', hint: 'Xếp theo số lượng bán ra', sort: (a, b) => b.quantity - a.quantity },
    revenue: { title: 'Doanh thu theo mặt hàng hôm nay', hint: 'Xếp theo doanh thu cao nhất', sort: (a, b) => b.revenue - a.revenue },
    profit: { title: 'Lợi nhuận theo mặt hàng hôm nay', hint: 'Xếp theo lợi nhuận gộp cao nhất', sort: (a, b) => b.profit - a.profit },
    'missing-cost': { title: 'Mặt hàng thiếu giá vốn hôm nay', hint: 'Cần bổ sung giá vốn để báo cáo lợi nhuận đúng', sort: (a, b) => b.missingCost - a.missingCost || b.revenue - a.revenue }
};

function formatCurrency(value) {
    return currency.format(Number(value || 0));
}

function formatNumber(value) {
    return number.format(Number(value || 0));
}

function formatDate(value) {
    return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[char]));
}

function setState(state, message = '') {
    document.getElementById('loadingState')?.classList.toggle('hidden', state !== 'loading');
    document.getElementById('errorState')?.classList.toggle('hidden', state !== 'error');
    document.getElementById('dashboardContent')?.classList.toggle('hidden', state !== 'ready');
    if (message) {
        const errorText = document.getElementById('errorText');
        if (errorText) errorText.textContent = message;
    }
}

function setActiveReportMode(mode) {
    reportMode = mode;
    document.querySelectorAll('[data-report-mode]').forEach(button => {
        const active = button.dataset.reportMode === mode;
        button.classList.toggle('is-active', active);
        button.classList.toggle('bg-blue-600', active);
        button.classList.toggle('text-white', active);
        button.classList.toggle('shadow-sm', active);
        button.classList.toggle('bg-slate-100', !active);
        button.classList.toggle('dark:bg-slate-800', !active);
        button.classList.toggle('text-slate-700', !active);
        button.classList.toggle('dark:text-slate-200', !active);
    });
    renderProductTable();
}

function compareText(delta, type = 'money') {
    const value = Number(delta || 0);
    const icon = value > 0 ? 'fa-arrow-trend-up' : value < 0 ? 'fa-arrow-trend-down' : 'fa-minus';
    const color = value > 0 ? 'text-emerald-600 dark:text-emerald-400' : value < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400';
    const text = type === 'money' ? formatCurrency(Math.abs(value)) : formatNumber(Math.abs(value));
    const prefix = value > 0 ? '+' : value < 0 ? '-' : '';
    return `<span class="inline-flex items-center gap-1 ${color}"><i class="fa-solid ${icon}"></i>${prefix}${text} so với hôm qua</span>`;
}

function renderSummary(summary, comparison) {
    let cards = [];
    if (currentOrderType === 'all') {
        const retailDelta = summary.retailRevenue - (summary.yesterdayRetailRevenue || 0);
        const retailProfitDelta = summary.retailProfit - (summary.yesterdayRetailProfit || 0);
        const ecommerceDelta = summary.ecommerceRevenue - (summary.yesterdayEcommerceRevenue || 0);
        const ecommerceItemsSoldDelta = summary.ecommerceItemsSold - (summary.yesterdayEcommerceItemsSold || 0);

        cards = [
            ['Doanh thu Bán lẻ (Offline)', formatCurrency(summary.retailRevenue), compareText(retailDelta), 'fa-shop', 'text-blue-600', 'bg-blue-50 border-blue-200'],
            ['Lợi nhuận Bán lẻ (Offline)', formatCurrency(summary.retailProfit), compareText(retailProfitDelta), 'fa-sack-dollar', 'text-emerald-600', 'bg-emerald-50 border-emerald-200'],
            ['Doanh thu TMĐT (Online)', formatCurrency(summary.ecommerceRevenue), compareText(ecommerceDelta), 'fa-globe', 'text-pink-600', 'bg-pink-50 border-pink-200'],
            ['Lượng bán TMĐT (Online)', `${formatNumber(summary.ecommerceItemsSold)} sản phẩm`, compareText(ecommerceItemsSoldDelta, 'number'), 'fa-boxes-stacked', 'text-violet-600', 'bg-violet-50 border-violet-200']
        ];
    } else {
        const titlePrefix = currentOrderType === 'ecommerce' ? 'TMĐT' : 'Bán lẻ';
        const colorClass = currentOrderType === 'ecommerce' ? 'text-pink-600' : 'text-blue-600';
        const bgClass = currentOrderType === 'ecommerce' ? 'bg-pink-50 border-pink-200' : 'bg-blue-50 border-blue-200';
        cards = [
            [`Doanh thu ${titlePrefix}`, formatCurrency(summary.revenue), compareText(comparison.revenueDelta), 'fa-chart-line', colorClass, bgClass],
            ['Lợi nhuận gộp', formatCurrency(summary.grossProfit), compareText(comparison.profitDelta), 'fa-sack-dollar', 'text-emerald-600', 'bg-emerald-50 border-emerald-200'],
            ['Số hóa đơn', formatNumber(summary.invoices), compareText(comparison.invoiceDelta, 'number'), 'fa-receipt', 'text-violet-600', 'bg-violet-50 border-violet-200'],
            ['Giá trị đơn TB', formatCurrency(summary.averageOrder), compareText(comparison.averageOrderDelta), 'fa-calculator', 'text-orange-600', 'bg-orange-50 border-orange-200']
        ];
    }

    document.getElementById('summaryCards').innerHTML = cards.map(card => `
        <article class="rounded-2xl border ${card[5]} dark:bg-slate-900 dark:border-slate-800 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">${card[0]}</p>
                    <p class="mt-3 text-2xl font-black text-slate-900 dark:text-white">${card[1]}</p>
                    <p class="mt-1 text-xs font-bold">${card[2]}</p>
                </div>
                <div class="w-11 h-11 rounded-xl ${card[4]} bg-white dark:bg-slate-800 border border-white/80 dark:border-slate-700 flex items-center justify-center shadow-sm">
                    <i class="fa-solid ${card[3]}"></i>
                </div>
            </div>
        </article>
    `).join('');
}

function alertCard(icon, label, value, tone) {
    const tones = {
        amber: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200',
        red: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200',
        slate: 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
    };
    return `
        <div class="rounded-2xl border px-4 py-3 ${tones[tone] || tones.slate} flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-white/70 dark:bg-slate-950/30 flex items-center justify-center shrink-0"><i class="fa-solid ${icon}"></i></div>
            <div>
                <p class="text-[10px] font-black uppercase tracking-widest opacity-75">${label}</p>
                <p class="mt-0.5 text-sm font-black">${value}</p>
            </div>
        </div>
    `;
}

function renderAlerts(alerts) {
    const cards = [
        alertCard('fa-triangle-exclamation', 'Thiếu giá vốn', `${formatNumber(alerts.missingCostItems)} dòng bán`, alerts.missingCostItems ? 'amber' : 'emerald'),
        alertCard('fa-boxes-stacked', 'Bán mạnh tồn thấp', `${formatNumber(alerts.lowStockHotProducts)} mặt hàng`, alerts.lowStockHotProducts ? 'red' : 'emerald'),
        alertCard('fa-ban', 'Hóa đơn hủy', `${formatNumber(alerts.cancelledOrders)} hóa đơn`, alerts.cancelledOrders ? 'red' : 'slate'),
        alertCard('fa-rotate-left', 'Trả hàng', `${formatNumber(alerts.returnOrders)} hóa đơn`, alerts.returnOrders ? 'amber' : 'slate')
    ];
    document.getElementById('alertStrip').innerHTML = cards.join('');
}

function getShiftColorIndex(shiftName, startTime) {
    const name = String(shiftName || '').toLowerCase().trim();
    if (name.includes('sáng') || name.includes('morning') || name === 'ca 1') {
        return 0; // Blue
    }
    if (name.includes('chiều') || name.includes('afternoon') || name === 'ca 2') {
        return 1; // Indigo
    }
    if (name.includes('tối') || name.includes('đêm') || name.includes('night') || name === 'ca 3') {
        return 2; // Violet
    }
    if (name.includes('cả ngày') || name.includes('full') || name === 'ca 4') {
        return 3; // Purple
    }
    
    // Phân loại theo giờ bắt đầu nếu tên ca tùy chỉnh
    if (startTime) {
        const hour = parseInt(startTime.split(':')[0], 10);
        if (hour >= 5 && hour < 12) return 0;  // Morning
        if (hour >= 12 && hour < 17) return 1; // Afternoon
        if (hour >= 17 && hour < 22) return 2; // Evening
        return 3;                              // Night / Full day
    }
    
    return 4; // Fuchsia (Ca khác)
}

function renderTrend(daily) {
    const maxRevenue = Math.max(1, ...daily.map(day => Math.abs(day.revenue)));
    
    // Cập nhật tiêu đề biểu đồ linh hoạt theo số ngày hiển thị
    const trendTitle = document.querySelector('#dailyTrend')?.closest('section')?.querySelector('h2');
    if (trendTitle) {
        trendTitle.textContent = `Doanh thu ${daily.length} ngày gần nhất`;
    }

    document.getElementById('dailyTrend').innerHTML = daily.map(day => {
        const isToday = day.date === currentAnalytics?.range?.todayKey;
        
        // Xây dựng danh sách các phân đoạn (segments) cho ngày đó
        const segments = [];
        
        if (currentOrderType === 'all') {
            const ecommerceVal = Number(day.ecommerceRevenue || 0);
            if (ecommerceVal > 0) {
                segments.push({
                    label: 'TMĐT',
                    value: ecommerceVal,
                    colorClass: 'bg-pink-500 dark:bg-pink-600'
                });
            }
            
            // Thêm các ca làm việc
            if (day.shifts && day.shifts.length > 0) {
                const shiftColors = [
                    'bg-blue-600 dark:bg-blue-700',      // Sáng / Ca 1
                    'bg-indigo-500 dark:bg-indigo-600',  // Chiều / Ca 2
                    'bg-violet-500 dark:bg-violet-600',  // Tối / Ca 3
                    'bg-purple-500 dark:bg-purple-600',  // Cả ngày / Ca 4
                    'bg-fuchsia-500 dark:bg-fuchsia-600' // Ca khác
                ];
                day.shifts.forEach((s) => {
                    if (s.revenue > 0) {
                        const idx = getShiftColorIndex(s.name, s.start_time);
                        segments.push({
                            label: `Ca ${s.name}`,
                            value: s.revenue,
                            colorClass: shiftColors[idx]
                        });
                    }
                });
            }
            
            const unscheduledVal = Number(day.unscheduledRetailRevenue || 0);
            if (unscheduledVal > 0) {
                segments.push({
                    label: (day.shifts && day.shifts.length > 0) ? 'Ngoài ca' : 'Bán lẻ',
                    value: unscheduledVal,
                    colorClass: 'bg-sky-500 dark:bg-sky-600'
                });
            }
        } else if (currentOrderType === 'ecommerce') {
            const ecommerceVal = Number(day.revenue || 0);
            if (ecommerceVal > 0) {
                segments.push({
                    label: 'TMĐT',
                    value: ecommerceVal,
                    colorClass: 'bg-pink-500 dark:bg-pink-600'
                });
            }
        } else {
            // currentOrderType === 'retail' hoặc 'internal'
            // Thêm các ca làm việc
            if (day.shifts && day.shifts.length > 0) {
                const shiftColors = [
                    'bg-blue-600 dark:bg-blue-700',      // Sáng / Ca 1
                    'bg-indigo-500 dark:bg-indigo-600',  // Chiều / Ca 2
                    'bg-violet-500 dark:bg-violet-600',  // Tối / Ca 3
                    'bg-purple-500 dark:bg-purple-600',  // Cả ngày / Ca 4
                    'bg-fuchsia-500 dark:bg-fuchsia-600' // Ca khác
                ];
                day.shifts.forEach((s) => {
                    if (s.revenue > 0) {
                        const idx = getShiftColorIndex(s.name, s.start_time);
                        segments.push({
                            label: `Ca ${s.name}`,
                            value: s.revenue,
                            colorClass: shiftColors[idx]
                        });
                    }
                });
            }
            
            const unscheduledVal = Number(day.unscheduledRetailRevenue || 0);
            if (unscheduledVal > 0) {
                segments.push({
                    label: (day.shifts && day.shifts.length > 0) ? 'Ngoài ca' : 'Bán lẻ',
                    value: unscheduledVal,
                    colorClass: 'bg-blue-600 dark:bg-blue-700'
                });
            }
        }
        
        const totalVal = segments.reduce((sum, s) => sum + s.value, 0);
        const isZeroDay = totalVal === 0;
        
        let totalHeight = 0;
        if (totalVal > 0) {
            totalHeight = Math.max(10, Math.round(totalVal / maxRevenue * 150));
        } else {
            totalHeight = 8; // Chiều cao tối thiểu cho cột 0đ
        }

        // Làm nổi bật màu xanh lá cây cho ngày hôm nay nếu chỉ có 1 phân đoạn duy nhất
        if (isToday && segments.length === 1) {
            segments[0].colorClass = 'bg-emerald-600';
        }

        // Tính toán chiều cao thực tế của từng phân đoạn
        let remainingHeight = totalHeight;
        const renderedSegments = segments.map((seg, idx) => {
            let segHeight = 0;
            if (idx === segments.length - 1) {
                segHeight = remainingHeight;
            } else {
                segHeight = Math.round(seg.value / totalVal * totalHeight);
                remainingHeight -= segHeight;
            }
            return {
                ...seg,
                height: Math.max(0, segHeight)
            };
        });

        const tooltip = isZeroDay 
            ? 'Không có doanh thu' 
            : renderedSegments.map(seg => `${seg.label}: ${formatCurrency(seg.value)}`).join(' | ');

        const segmentsHtml = isZeroDay ? '' : renderedSegments.map(seg => `
            <div class="w-full ${seg.colorClass}" style="height:${seg.height}px" title="${seg.label}: ${formatCurrency(seg.value)}"></div>
        `).join('');

        return `
            <div class="flex-1 min-w-14 flex flex-col items-center justify-end gap-2 group relative">
                <!-- Tooltip hiện khi di chuột -->
                <div class="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold rounded px-2 py-1 shadow-md z-30 whitespace-nowrap pointer-events-none">
                    ${tooltip}
                </div>
                
                <!-- Cột chồng hoặc cột xám nhạt nếu 0đ -->
                <div class="w-full max-w-10 flex flex-col justify-end rounded-t-xl overflow-hidden shadow-sm transition-all duration-300 ${isZeroDay ? 'bg-slate-200 dark:bg-slate-800' : ''}" style="height:${totalHeight}px">
                    ${segmentsHtml}
                </div>
                
                <div class="text-[10px] font-black ${isToday ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}">${formatDate(day.date)}</div>
            </div>
        `;
    }).join('');
}

function productRow(product, index) {
    const profitClass = product.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
    const stockText = product.stock === null || product.stock === undefined ? '-' : formatNumber(product.stock);
    const stockClass = product.isLowStock ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300';
    const highlightClass = reportMode === 'missing-cost' && product.missingCost
        ? 'bg-amber-50 dark:bg-amber-900/10'
        : product.isLowStock
            ? 'bg-red-50/60 dark:bg-red-900/10'
            : 'bg-white dark:bg-slate-900';

    return `
        <tr class="group ${highlightClass} transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="py-4 px-4 border-y border-l border-slate-200 dark:border-slate-800 rounded-l-2xl font-black text-slate-400 text-xs">${index + 1}</td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800">
                <div class="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">${escapeHTML(product.name)}</div>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>${escapeHTML(product.code || 'Chưa có mã')}</span>
                    <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>${escapeHTML(product.unit || 'Đơn vị')}</span>
                    ${product.missingCost ? '<span class="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Thiếu giá vốn</span>' : ''}
                    ${product.isLowStock ? '<span class="px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Tồn thấp</span>' : ''}
                </div>
            </td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right font-black text-slate-900 dark:text-white">${formatNumber(product.quantity)}</td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right font-black ${stockClass}">${stockText}</td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right font-black text-blue-600 dark:text-blue-400">${formatCurrency(product.revenue)}</td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right font-black text-amber-600 dark:text-amber-500">${formatCurrency(product.cost)}</td>
            <td class="py-4 px-4 border-y border-r border-slate-200 dark:border-slate-800 rounded-r-2xl text-right font-black ${profitClass}">${formatCurrency(product.profit)}</td>
        </tr>
    `;
}

function getFilteredProducts() {
    if (!currentAnalytics) return [];
    const keyword = productSearch.toLowerCase();
    const mode = REPORT_MODES[reportMode] || REPORT_MODES.quantity;
    return [...currentAnalytics.productPerformance]
        .filter(product => reportMode !== 'missing-cost' || product.missingCost > 0)
        .filter(product => `${product.name} ${product.code}`.toLowerCase().includes(keyword))
        .sort(mode.sort)
        .slice(0, 80);
}

function renderProductTable() {
    if (!currentAnalytics) return;
    const mode = REPORT_MODES[reportMode] || REPORT_MODES.quantity;
    const rows = getFilteredProducts();

    document.getElementById('analysisTitle').textContent = mode.title;
    document.getElementById('productTableBody').innerHTML = rows.length
        ? rows.map(productRow).join('')
        : '<tr><td colspan="7" class="py-12 text-center text-sm font-bold text-slate-400">Hôm nay chưa có dữ liệu phù hợp</td></tr>';
    document.getElementById('productCountText').textContent = `${formatNumber(rows.length)} mặt hàng - ${mode.hint}`;
}

function renderEcommercePlatforms(platforms) {
    const section = document.getElementById('ecommercePlatformsSection');
    const container = document.getElementById('platformsContainer');
    if (!section || !container) return;

    if (currentOrderType !== 'ecommerce' || !platforms || platforms.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    container.innerHTML = platforms.map(p => `
        <div class="bg-pink-50/50 dark:bg-pink-900/20 p-4 rounded-xl border border-pink-100 dark:border-pink-800/50 flex flex-col gap-1">
            <span class="text-xs font-black text-pink-500 uppercase tracking-widest">${p.name}</span>
            <span class="text-xl font-black text-slate-800 dark:text-white">${formatNumber(p.revenue)}đ</span>
            <span class="text-xs font-bold text-slate-500">${formatNumber(p.orders)} đơn hàng</span>
        </div>
    `).join('');
}

function renderAnalytics(analytics) {
    currentAnalytics = analytics;
    renderSummary(analytics.summary, analytics.comparison);
    renderAlerts(analytics.alerts);
    renderTrend(analytics.daily);
    renderProductTable();
    renderEcommercePlatforms(analytics.platformsPerformance);
    document.getElementById('rangeLabel').textContent = `${new Date(analytics.range.dateFrom).toLocaleDateString('vi-VN')} - ${new Date(analytics.range.dateTo).toLocaleDateString('vi-VN')}`;
}

async function loadDashboard() {
    setState('loading');
    try {
        const dateFrom = document.getElementById('dateFromInput')?.value || null;
        const dateTo = document.getElementById('dateToInput')?.value || null;
        const analytics = await fetchDashboardAnalytics(currentOrderType, dateFrom, dateTo);
        renderAnalytics(analytics);
        setState('ready');
    } catch (error) {
        console.error('[reports] Lỗi tải báo cáo:', error);
        setState('error', error.message || 'Không tải được dữ liệu báo cáo.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initLayout('admin', 'overview');
    
    // Khởi tạo khoảng ngày mặc định là 7 ngày gần nhất
    const today = new Date();
    const dateToVal = today.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    const dateFromVal = sevenDaysAgo.toISOString().split('T')[0];
    
    const dateFromInput = document.getElementById('dateFromInput');
    const dateToInput = document.getElementById('dateToInput');
    if (dateFromInput) dateFromInput.value = dateFromVal;
    if (dateToInput) dateToInput.value = dateToVal;

    // Lắng nghe sự kiện thay đổi ngày
    dateFromInput?.addEventListener('change', () => loadDashboard());
    dateToInput?.addEventListener('change', () => loadDashboard());

    setActiveReportMode('quantity');
    loadDashboard();

    document.addEventListener('click', event => {
        const reportModeButton = event.target.closest('[data-report-mode]');
        if (reportModeButton) setActiveReportMode(reportModeButton.dataset.reportMode);

        const orderTypeBtn = event.target.closest('[data-order-type]');
        if (orderTypeBtn) {
            currentOrderType = orderTypeBtn.dataset.orderType;
            document.querySelectorAll('[data-order-type]').forEach(btn => {
                const active = btn.dataset.orderType === currentOrderType;
                btn.classList.toggle('active', active);
                btn.classList.toggle('bg-white', active);
                btn.classList.toggle('dark:bg-slate-700', active);
                btn.classList.toggle('text-blue-600', active);
                btn.classList.toggle('dark:text-blue-400', active);
                btn.classList.toggle('shadow-sm', active);
                btn.classList.toggle('text-slate-600', !active);
                btn.classList.toggle('dark:text-slate-400', !active);
                btn.classList.toggle('hover:text-slate-900', !active);
                btn.classList.toggle('dark:hover:text-white', !active);
            });
            loadDashboard();
        }

        const actionButton = event.target.closest('[data-action]');
        if (actionButton?.dataset.action === 'reload-dashboard') loadDashboard();
    });

    document.getElementById('productSearch')?.addEventListener('input', event => {
        productSearch = event.target.value.trim();
        renderProductTable();
    });
});
