import { initLayout } from '../../components/layout.js';
import { fetchDashboardAnalytics } from './reportService.js';

let currentAnalytics = null;
let productSearch = '';
let reportMode = 'quantity';
let currentOrderType = 'all';
let activeInsight = 'low-stock-hot';
let productSubTab = 'retail'; // 'retail' or 'dose' for sub-tab filtering in Tổng hợp tab

// Khởi tạo Chế độ nhân viên dựa trên phân quyền người dùng
const userStr = localStorage.getItem('pos_user');
const user = userStr ? JSON.parse(userStr) : null;
const isAdmin = user && user.role === 'admin';
// Chỉ admin xem đầy đủ lợi nhuận. Manager và Staff luôn ở chế độ nhân viên (ẩn lợi nhuận)
let employeeMode = !isAdmin;

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
        if (errorText) errorText.innerHTML = message;
    }
}

function updateTabStyles() {
    const btn = document.querySelector('[data-report-mode="missing-cost"]');
    const missingCount = Number(btn?.dataset.missingCount || 0);

    document.querySelectorAll('[data-report-mode]').forEach(button => {
        const isMissingCostTab = button.dataset.reportMode === 'missing-cost';
        const isProfitTab = button.dataset.reportMode === 'profit';
        const isRevenueTab = button.dataset.reportMode === 'revenue';
        const isQuantityTab = button.dataset.reportMode === 'quantity';
        const active = button.dataset.reportMode === reportMode;

        // TMĐT: ẩn tab Lợi nhuận, đổi tên Doanh thu → Giá vốn, Bán mạnh → SL xuất
        if (currentOrderType === 'ecommerce') {
            if (isProfitTab) { button.classList.add('hidden'); }
            else { button.classList.remove('hidden'); }
            if (isRevenueTab) button.innerHTML = 'Giá vốn';
            if (isQuantityTab) button.innerHTML = 'SL xuất';
        } else {
            button.classList.remove('hidden');
            if (isRevenueTab) button.innerHTML = 'Doanh thu';
            if (isQuantityTab) button.innerHTML = 'Bán mạnh';
        }

        button.classList.toggle('is-active', active);
        button.classList.toggle('bg-blue-600', active);
        button.classList.toggle('text-white', active);
        button.classList.toggle('shadow-sm', active);

        button.classList.toggle('bg-slate-100', !active && (!isMissingCostTab || missingCount === 0));
        button.classList.toggle('dark:bg-slate-800', !active && (!isMissingCostTab || missingCount === 0));
        button.classList.toggle('text-slate-700', !active && (!isMissingCostTab || missingCount === 0));
        button.classList.toggle('dark:text-slate-200', !active && (!isMissingCostTab || missingCount === 0));

        if (isMissingCostTab) {
            const hasAlert = missingCount > 0 && !active;
            button.classList.toggle('bg-red-50', hasAlert);
            button.classList.toggle('border-red-200', hasAlert);
            button.classList.toggle('text-red-600', hasAlert);
            button.classList.toggle('dark:bg-red-950/20', hasAlert);
            button.classList.toggle('dark:border-red-900/50', hasAlert);
            button.classList.toggle('dark:text-red-400', hasAlert);
            button.classList.toggle('animate-pulse', hasAlert);

            if (!hasAlert) {
                button.classList.remove('bg-red-50', 'border-red-200', 'text-red-600', 'dark:bg-red-950/20', 'dark:border-red-900/50', 'dark:text-red-400', 'animate-pulse');
            }
        }
    });
}

function updateMissingCostTab(analytics) {
    const btn = document.querySelector('[data-report-mode="missing-cost"]');
    if (!btn) return;

    const missingCount = Number(analytics.summary.missingCostItems || 0);

    if (missingCount > 0) {
        btn.innerHTML = `Thiếu giá vốn <span class="ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-md bg-red-600 text-white animate-bounce inline-block">${missingCount}</span>`;
    } else {
        btn.innerHTML = 'Thiếu giá vốn';
    }

    btn.dataset.missingCount = missingCount;
    updateTabStyles();
}

function setActiveReportMode(mode) {
    reportMode = mode;
    updateTabStyles();
    renderProductTable();
}

function compareText(delta, type = 'money', suffix = 'hôm qua') {
    const value = Number(delta || 0);
    const icon = value > 0 ? 'fa-arrow-trend-up' : value < 0 ? 'fa-arrow-trend-down' : 'fa-minus';
    const color = value > 0 ? 'text-emerald-600 dark:text-emerald-400' : value < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400';
    const text = type === 'money' ? formatCurrency(Math.abs(value)) : formatNumber(Math.abs(value));
    const prefix = value > 0 ? '+' : value < 0 ? '-' : '';
    return `<span class="inline-flex items-center gap-1 ${color}"><i class="fa-solid ${icon}"></i>${prefix}${text} so với ${suffix}</span>`;
}

function renderSummary(summary, comparison) {
    const isSingleDay = currentAnalytics?.range?.currentKeys?.length === 1;
    const suffix = isSingleDay ? 'hôm qua' : 'chu kỳ trước';

    let cards = [];
    if (employeeMode) {
        if (currentOrderType === 'all') {
            const retailDelta = summary.retailRevenue - (summary.yesterdayRetailRevenue || 0);
            const retailInvoiceDelta = summary.retailInvoices - (summary.yesterdayRetailInvoices || 0);
            const doseRevenueDelta = (summary.dosePackageRevenue || 0) - (summary.yesterdayDosePackageRevenue || 0);
            const doseItemsSoldDelta = (summary.doseItemsSold || 0) - (summary.yesterdayDoseItemsSold || 0);

            cards = [
                ['Doanh thu Bán lẻ', formatCurrency(summary.retailRevenue), compareText(retailDelta, 'money', suffix), 'fa-shop', 'text-blue-600', 'bg-blue-50 border-blue-200'],
                ['Số hóa đơn Bán lẻ', formatNumber(summary.retailInvoices), compareText(retailInvoiceDelta, 'number', suffix), 'fa-receipt', 'text-emerald-600', 'bg-emerald-50 border-emerald-200'],
                ['Doanh thu Thuốc liều', formatCurrency(summary.dosePackageRevenue || 0), compareText(doseRevenueDelta, 'money', suffix), 'fa-capsules', 'text-indigo-600', 'bg-indigo-50 border-indigo-200'],
                ['Số liều bán ra', `${formatNumber(summary.doseItemsSold || 0)} gói`, compareText(doseItemsSoldDelta, 'number', suffix), 'fa-boxes-stacked', 'text-violet-600', 'bg-violet-50 border-violet-200']
            ];
        } else if (currentOrderType === 'dose_cut') {
            const deltaItemsSold = summary.itemsSold - (summary.yesterdayItemsSold || 0);
            cards = [
                ['Doanh thu Định lượng', formatCurrency(summary.revenue), compareText(comparison.revenueDelta, 'money', suffix), 'fa-chart-line', 'text-indigo-600', 'bg-indigo-50 border-indigo-200'],
                ['Hóa đơn thuốc liều', formatNumber(summary.invoices), compareText(comparison.invoiceDelta, 'number', suffix), 'fa-receipt', 'text-violet-600', 'bg-violet-50 border-violet-200'],
                ['Lượng bán thuốc liều', `${formatNumber(summary.itemsSold)} sản phẩm`, compareText(deltaItemsSold, 'number', suffix), 'fa-boxes-stacked', 'text-amber-600', 'bg-amber-50 border-amber-200'],
                ['Giá trị đơn TB', formatCurrency(summary.averageOrder), compareText(comparison.averageOrderDelta, 'money', suffix), 'fa-calculator', 'text-orange-600', 'bg-orange-50 border-orange-200']
            ];
        } else if (currentOrderType === 'ecommerce') {
            const ecommerceCostDelta = summary.ecommerceCost - (summary.yesterdayEcommerceCost || 0);
            const ecommerceItemsSoldDelta = summary.ecommerceItemsSold - (summary.yesterdayEcommerceItemsSold || 0);
            const ecommerceInvoicesDelta = summary.ecommerceInvoices - (summary.yesterdayEcommerceInvoices || 0);
            cards = [
                ['Giá vốn TMĐT', formatCurrency(summary.ecommerceCost), compareText(ecommerceCostDelta, 'money', suffix), 'fa-box-open', 'text-pink-600', 'bg-pink-50 border-pink-200'],
                ['Số đơn hàng TMĐT', `${formatNumber(summary.ecommerceInvoices)} đơn`, compareText(ecommerceInvoicesDelta, 'number', suffix), 'fa-receipt', 'text-emerald-600', 'bg-emerald-50 border-emerald-200'],
                ['Lượng bán TMĐT', `${formatNumber(summary.ecommerceItemsSold)} sản phẩm`, compareText(ecommerceItemsSoldDelta, 'number', suffix), 'fa-boxes-stacked', 'text-violet-600', 'bg-violet-50 border-violet-200'],
                ['Giá vốn TB/đơn', formatCurrency(summary.ecommerceInvoices ? summary.ecommerceCost / summary.ecommerceInvoices : 0), '', 'fa-calculator', 'text-orange-600', 'bg-orange-50 border-orange-200']
            ];
        } else {
            // Bán lẻ
            const retailRevenueDelta = summary.retailRevenue - (summary.yesterdayRetailRevenue || 0);
            const retailInvoiceDelta = summary.retailInvoices - (summary.yesterdayRetailInvoices || 0);
            const retailItemsSoldDelta = summary.retailItemsSold - (summary.yesterdayRetailItemsSold || 0);
            const averageOrderVal = summary.retailInvoices ? summary.retailRevenue / summary.retailInvoices : 0;
            const yesterdayAverageOrderVal = summary.yesterdayRetailInvoices ? summary.yesterdayRetailRevenue / summary.yesterdayRetailInvoices : 0;
            const retailAverageOrderDelta = averageOrderVal - yesterdayAverageOrderVal;

            cards = [
                ['Doanh thu Bán lẻ', formatCurrency(summary.retailRevenue), compareText(retailRevenueDelta, 'money', suffix), 'fa-chart-line', 'text-blue-600', 'bg-blue-50 border-blue-200'],
                ['Số hóa đơn', formatNumber(summary.retailInvoices), compareText(retailInvoiceDelta, 'number', suffix), 'fa-receipt', 'text-emerald-600', 'bg-emerald-50 border-emerald-200'],
                ['Lượng bán', `${formatNumber(summary.retailItemsSold)} sản phẩm`, compareText(retailItemsSoldDelta, 'number', suffix), 'fa-boxes-stacked', 'text-violet-600', 'bg-violet-50 border-violet-200'],
                ['Giá trị đơn TB', formatCurrency(averageOrderVal), compareText(retailAverageOrderDelta, 'money', suffix), 'fa-calculator', 'text-orange-600', 'bg-orange-50 border-orange-200']
            ];
        }
    } else {
        if (currentOrderType === 'all') {
            const retailDelta = summary.retailRevenue - (summary.yesterdayRetailRevenue || 0);
            const retailProfitDelta = summary.retailProfit - (summary.yesterdayRetailProfit || 0);
            const doseRevenueDelta = (summary.dosePackageRevenue || 0) - (summary.yesterdayDosePackageRevenue || 0);
            const yesterdayDoseProfit = (summary.yesterdayDosePackageRevenue || 0) - (summary.yesterdayDoseIngredientCost || 0);
            const doseProfitDelta = (summary.doseProfit || 0) - yesterdayDoseProfit;

            cards = [
                ['Doanh thu Bán lẻ', formatCurrency(summary.retailRevenue), compareText(retailDelta, 'money', suffix), 'fa-shop', 'text-blue-600', 'bg-blue-50 border-blue-200'],
                ['Lợi nhuận Bán lẻ', formatCurrency(summary.retailProfit), compareText(retailProfitDelta, 'money', suffix), 'fa-sack-dollar', 'text-emerald-600', 'bg-emerald-50 border-emerald-200'],
                ['Doanh thu Thuốc liều', formatCurrency(summary.dosePackageRevenue || 0), compareText(doseRevenueDelta, 'money', suffix), 'fa-capsules', 'text-indigo-600', 'bg-indigo-50 border-indigo-200'],
                ['Lợi nhuận Thuốc liều', formatCurrency(summary.doseProfit || 0), compareText(doseProfitDelta, 'money', suffix), 'fa-sack-dollar', 'text-violet-600', 'bg-violet-50 border-violet-200']
            ];
        } else if (currentOrderType === 'dose_cut') {
            const costDelta = comparison.revenueDelta - comparison.profitDelta;
            let costValText = formatCurrency(summary.doseIngredientCost || summary.cost || 0);
            if (summary.doseIngredientPOSCost > 0 || summary.doseIngredientInternalCost > 0) {
                const posStr = formatCurrency(summary.doseIngredientPOSCost || 0);
                const intStr = formatCurrency(summary.doseIngredientInternalCost || 0);
                costValText += `<span class="text-[11px] text-slate-500 font-bold block mt-1">(POS: ${posStr} | Xuất kho: ${intStr})</span>`;
            }
            cards = [
                ['Doanh thu Định lượng', formatCurrency(summary.dosePackageRevenue || 0), compareText(comparison.revenueDelta, 'money', suffix), 'fa-chart-line', 'text-indigo-600', 'bg-indigo-50 border-indigo-200'],
                ['Vốn định lượng', costValText, compareText(costDelta, 'money', suffix), 'fa-box-open', 'text-amber-600', 'bg-amber-50 border-amber-200'],
                ['Lợi nhuận thuốc liều', formatCurrency(summary.doseProfit || 0), compareText(comparison.profitDelta, 'money', suffix), 'fa-sack-dollar', 'text-emerald-600', 'bg-emerald-50 border-emerald-200'],
                ['Hóa đơn thuốc liều', formatNumber(summary.invoices), compareText(comparison.invoiceDelta, 'number', suffix), 'fa-receipt', 'text-violet-600', 'bg-violet-50 border-violet-200']
            ];
        } else if (currentOrderType === 'ecommerce') {
            const ecommerceCostDelta = summary.ecommerceCost - (summary.yesterdayEcommerceCost || 0);
            const ecommerceItemsSoldDelta = summary.ecommerceItemsSold - (summary.yesterdayEcommerceItemsSold || 0);
            const ecommerceInvoicesDelta = summary.ecommerceInvoices - (summary.yesterdayEcommerceInvoices || 0);
            cards = [
                ['Giá vốn TMĐT', formatCurrency(summary.ecommerceCost), compareText(ecommerceCostDelta, 'money', suffix), 'fa-box-open', 'text-pink-600', 'bg-pink-50 border-pink-200'],
                ['Số đơn hàng TMĐT', `${formatNumber(summary.ecommerceInvoices)} đơn`, compareText(ecommerceInvoicesDelta, 'number', suffix), 'fa-receipt', 'text-emerald-600', 'bg-emerald-50 border-emerald-200'],
                ['Lượng bán TMĐT', `${formatNumber(summary.ecommerceItemsSold)} sản phẩm`, compareText(ecommerceItemsSoldDelta, 'number', suffix), 'fa-boxes-stacked', 'text-violet-600', 'bg-violet-50 border-violet-200'],
                ['Giá vốn TB/đơn', formatCurrency(summary.ecommerceInvoices ? summary.ecommerceCost / summary.ecommerceInvoices : 0), '', 'fa-calculator', 'text-orange-600', 'bg-orange-50 border-orange-200']
            ];
        } else {
            // Bán lẻ
            const retailRevenueDelta = summary.retailRevenue - (summary.yesterdayRetailRevenue || 0);
            const retailCostDelta = summary.retailCost - (summary.yesterdayRetailCost || 0);
            const retailProfitDelta = summary.retailProfit - (summary.yesterdayRetailProfit || 0);
            const retailInvoiceDelta = summary.retailInvoices - (summary.yesterdayRetailInvoices || 0);

            cards = [
                ['Doanh thu Bán lẻ', formatCurrency(summary.retailRevenue), compareText(retailRevenueDelta, 'money', suffix), 'fa-chart-line', 'text-blue-600', 'bg-blue-50 border-blue-200'],
                ['Giá vốn Bán lẻ', formatCurrency(summary.retailCost), compareText(retailCostDelta, 'money', suffix), 'fa-box-open', 'text-amber-600', 'bg-amber-50 border-amber-200'],
                ['Lợi nhuận gộp', formatCurrency(summary.retailProfit), compareText(retailProfitDelta, 'money', suffix), 'fa-sack-dollar', 'text-emerald-600', 'bg-emerald-50 border-emerald-200'],
                ['Số hóa đơn', formatNumber(summary.retailInvoices), compareText(retailInvoiceDelta, 'number', suffix), 'fa-receipt', 'text-violet-600', 'bg-violet-50 border-violet-200']
            ];
        }
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
        <button type="button" data-insight-key="${label === 'Bán mạnh tồn thấp' ? 'low-stock-hot' : label === 'Thiếu giá vốn' ? 'missing-cost' : label === 'Hóa đơn hủy' ? 'cancelled' : 'returns'}" class="rounded-2xl border px-4 py-3 ${tones[tone] || tones.slate} flex items-center gap-3 text-left w-full hover:shadow-sm transition-all">
            <div class="w-9 h-9 rounded-xl bg-white/70 dark:bg-slate-950/30 flex items-center justify-center shrink-0"><i class="fa-solid ${icon}"></i></div>
            <div>
                <p class="text-[10px] font-black uppercase tracking-widest opacity-75">${label}</p>
                <p class="mt-0.5 text-sm font-black">${value}</p>
            </div>
        </button>
    `;
}

function renderAlerts(alerts) {
    let cards = [];
    if (employeeMode) {
        const totalInvoices = currentAnalytics?.summary?.invoices || 0;
        cards = [
            alertCard('fa-receipt', 'Tổng hóa đơn', `${formatNumber(totalInvoices)} hóa đơn`, 'slate'),
            alertCard('fa-boxes-stacked', 'Bán mạnh tồn thấp', `${formatNumber(alerts.lowStockHotProducts)} mặt hàng`, alerts.lowStockHotProducts ? 'red' : 'emerald'),
            alertCard('fa-ban', 'Hóa đơn hủy', `${formatNumber(alerts.cancelledOrders)} hóa đơn`, alerts.cancelledOrders ? 'red' : 'slate'),
            alertCard('fa-rotate-left', 'Trả hàng', `${formatNumber(alerts.returnOrders)} hóa đơn`, alerts.returnOrders ? 'amber' : 'slate')
        ];
    } else {
        cards = [
            alertCard('fa-triangle-exclamation', 'Thiếu giá vốn', `${formatNumber(alerts.missingCostItems)} dòng bán`, alerts.missingCostItems ? 'amber' : 'emerald'),
            alertCard('fa-boxes-stacked', 'Bán mạnh tồn thấp', `${formatNumber(alerts.lowStockHotProducts)} mặt hàng`, alerts.lowStockHotProducts ? 'red' : 'emerald'),
            alertCard('fa-ban', 'Hóa đơn hủy', `${formatNumber(alerts.cancelledOrders)} hóa đơn`, alerts.cancelledOrders ? 'red' : 'slate'),
            alertCard('fa-rotate-left', 'Trả hàng', `${formatNumber(alerts.returnOrders)} hóa đơn`, alerts.returnOrders ? 'amber' : 'slate')
        ];
    }
    document.getElementById('alertStrip').innerHTML = cards.join('');
}

function formatDateTimeShort(value) {
    if (!value) return 'Chưa có';
    return new Date(value).toLocaleDateString('vi-VN');
}

function insightSummaryCards(current) {
    const rows = current.rows || [];
    if (!rows.length) return '';

    if (current.type === 'stale') {
        const totalStock = rows.reduce((sum, item) => sum + Number(item.stock || 0), 0);
        const neverSold = rows.filter(item => item.daysSinceLastSold === null).length;
        const oldestDays = rows.reduce((max, item) => Math.max(max, Number(item.daysSinceLastSold || 0)), 0);
        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div class="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
                    <div class="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Mặt hàng cần xử lý</div>
                    <div class="mt-1 text-xl font-black text-amber-900 dark:text-amber-100">${formatNumber(rows.length)}</div>
                </div>
                <div class="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3">
                    <div class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Tổng tồn treo</div>
                    <div class="mt-1 text-xl font-black text-slate-900 dark:text-white">${formatNumber(totalStock)}</div>
                </div>
                <div class="rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3">
                    <div class="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-300">Lâu nhất chưa bán</div>
                    <div class="mt-1 text-xl font-black text-rose-900 dark:text-rose-100">${neverSold ? `${formatNumber(neverSold)} chưa bán` : `${formatNumber(oldestDays)} ngày`}</div>
                </div>
            </div>
        `;
    }

    const totalQuantity = rows.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const totalStock = rows.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const totalValue = rows.reduce((sum, item) => sum + Number(current.type === 'high-profit' ? item.profit : item.revenue || 0), 0);
    const valueLabel = current.type === 'high-profit' ? 'Tổng lợi nhuận' : 'Tổng doanh thu';
    const quantityLabel = current.type === 'slow-moving' ? 'SL bán chậm' : 'SL bán';
    const stockLabel = current.type === 'low-stock-hot' ? 'Tồn còn lại' : 'Tồn cần theo dõi';

    return `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div class="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3">
                <div class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">${quantityLabel}</div>
                <div class="mt-1 text-xl font-black text-slate-900 dark:text-white">${formatNumber(totalQuantity)}</div>
            </div>
            <div class="rounded-2xl ${current.type === 'low-stock-hot' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'} border px-4 py-3">
                <div class="text-[10px] font-black uppercase tracking-widest ${current.type === 'low-stock-hot' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}">${stockLabel}</div>
                <div class="mt-1 text-xl font-black ${current.type === 'low-stock-hot' ? 'text-red-900 dark:text-red-100' : 'text-amber-900 dark:text-amber-100'}">${formatNumber(totalStock)}</div>
            </div>
            <div class="rounded-2xl ${current.type === 'high-profit' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'} border px-4 py-3">
                <div class="text-[10px] font-black uppercase tracking-widest ${current.type === 'high-profit' ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300'}">${valueLabel}</div>
                <div class="mt-1 text-xl font-black ${current.type === 'high-profit' ? 'text-emerald-900 dark:text-emerald-100' : 'text-blue-900 dark:text-blue-100'}">${formatCurrency(totalValue)}</div>
            </div>
        </div>
    `;
}

function insightRow(item, type, index) {
    if (type === 'stale') {
        return `
            <tr class="border-b border-slate-100 dark:border-slate-800">
                <td class="py-3 px-4 text-xs font-black text-slate-400">${index + 1}</td>
                <td class="py-3 px-4">
                    <div class="font-black text-slate-900 dark:text-white">${escapeHTML(item.name)}</div>
                    <div class="text-[11px] font-bold text-slate-500">${escapeHTML(item.code || 'Chưa có mã')}</div>
                </td>
                <td class="py-3 px-4 text-right font-black text-slate-700 dark:text-slate-200">${formatNumber(item.stock)}</td>
                <td class="py-3 px-4 text-right font-black text-amber-600 dark:text-amber-400">${item.daysSinceLastSold === null ? 'Chưa bán' : `${formatNumber(item.daysSinceLastSold)} ngày`}</td>
                <td class="py-3 px-4 text-right font-bold text-slate-500">${formatDateTimeShort(item.lastSoldAt)}</td>
            </tr>
        `;
    }

    return `
        <tr class="border-b border-slate-100 dark:border-slate-800">
            <td class="py-3 px-4 text-xs font-black text-slate-400">${index + 1}</td>
            <td class="py-3 px-4">
                <div class="font-black text-slate-900 dark:text-white">${escapeHTML(item.name)}</div>
                <div class="text-[11px] font-bold text-slate-500">${escapeHTML(item.code || 'Chưa có mã')}</div>
            </td>
            <td class="py-3 px-4 text-right font-black text-slate-700 dark:text-slate-200">${formatNumber(item.quantity || 0)}</td>
            <td class="py-3 px-4 text-right font-black ${type === 'low-stock-hot' ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}">${formatNumber(item.stock || 0)}</td>
            <td class="py-3 px-4 text-right font-black ${type === 'high-profit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}">${formatCurrency(type === 'high-profit' ? item.profit : item.revenue || 0)}</td>
        </tr>
    `;
}

function renderBusinessInsights() {
    if (!currentAnalytics?.businessInsights) return;
    const insightMap = {
        'low-stock-hot': {
            title: 'Bán mạnh tồn thấp',
            hint: 'Ưu tiên nhập thêm ngay để tránh mất doanh thu',
            rows: currentAnalytics.businessInsights.lowStockHotProducts || [],
            type: 'low-stock-hot',
            empty: 'Không có mặt hàng bán mạnh nào đang ở mức tồn thấp.'
        },
        'slow-moving': {
            title: 'Bán chậm',
            hint: 'Hàng còn tồn nhưng tốc độ bán thấp trong kỳ đang xem',
            rows: currentAnalytics.businessInsights.slowMovingProducts || [],
            type: 'slow-moving',
            empty: 'Không có mặt hàng bán chậm nổi bật trong kỳ.'
        },
        'stale': {
            title: 'Lâu chưa bán',
            hint: 'Theo dõi hàng tồn lâu để đẩy bán hoặc xử lý tồn',
            rows: currentAnalytics.businessInsights.staleProducts || [],
            type: 'stale',
            empty: 'Không có mặt hàng tồn lâu chưa bán đáng chú ý.'
        },
        'high-profit': {
            title: 'Lãi cao',
            hint: 'Các mặt hàng đóng góp lợi nhuận gộp tốt nhất',
            rows: currentAnalytics.businessInsights.highProfitProducts || [],
            type: 'high-profit',
            empty: 'Chưa có dữ liệu lợi nhuận nổi bật trong kỳ.'
        }
    };
    const highProfitBtn = document.querySelector('[data-business-insight="high-profit"]');
    if (highProfitBtn) {
        highProfitBtn.classList.toggle('hidden', employeeMode);
    }
    if (employeeMode && activeInsight === 'high-profit') {
        activeInsight = 'low-stock-hot';
    }

    const current = insightMap[activeInsight] || insightMap['low-stock-hot'];
    const titleEl = document.getElementById('businessInsightTitle');
    const hintEl = document.getElementById('businessInsightHint');
    const bodyEl = document.getElementById('businessInsightBody');
    if (titleEl) titleEl.textContent = current.title;
    if (hintEl) hintEl.textContent = current.hint;
    document.querySelectorAll('[data-business-insight]').forEach(button => {
        const active = button.dataset.businessInsight === activeInsight;
        button.classList.toggle('bg-slate-900', active);
        button.classList.toggle('text-white', active);
        button.classList.toggle('dark:bg-white', active);
        button.classList.toggle('dark:text-slate-900', active);
        button.classList.toggle('bg-slate-100', !active);
        button.classList.toggle('dark:bg-slate-800', !active);
    });
    if (!bodyEl) return;
    if (!current.rows.length) {
        bodyEl.innerHTML = `<div class="py-10 text-center text-sm font-bold text-slate-400">${current.empty}</div>`;
        return;
    }
    const summary = insightSummaryCards(current);
    const header = current.type === 'stale'
        ? `
            <tr class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <th class="px-4 py-2 w-12">#</th>
                <th class="px-4 py-2">Mặt hàng</th>
                <th class="px-4 py-2 text-right">Tồn</th>
                <th class="px-4 py-2 text-right">Lâu chưa bán</th>
                <th class="px-4 py-2 text-right">Bán gần nhất</th>
            </tr>
        `
        : `
            <tr class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <th class="px-4 py-2 w-12">#</th>
                <th class="px-4 py-2">Mặt hàng</th>
                <th class="px-4 py-2 text-right">SL bán</th>
                <th class="px-4 py-2 text-right">Tồn</th>
                <th class="px-4 py-2 text-right">${current.type === 'high-profit' ? 'Lợi nhuận' : 'Doanh thu'}</th>
            </tr>
        `;
    bodyEl.innerHTML = `
        ${summary}
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-slate-50 dark:bg-slate-900/60">${header}</thead>
                <tbody>${current.rows.map((item, index) => insightRow(item, current.type, index)).join('')}</tbody>
            </table>
        </div>
    `;
}

function renderTrend(daily) {
    const getTrendValue = (day) => {
        if (currentOrderType === 'ecommerce') return Number(day.ecommerceCost || day.ecommerceRevenue || 0);
        if (currentOrderType === 'dose_cut') return Number(day.dosePackageRevenue || day.revenue || 0);
        if (currentOrderType === 'all') return Number(day.revenue || 0);
        return Number(day.retailRevenue || 0);
    };

    const maxRevenue = Math.max(1, ...daily.map(day => Math.abs(getTrendValue(day))));

    // Cập nhật tiêu đề biểu đồ linh hoạt theo số ngày hiển thị
    const trendTitle = document.querySelector('#dailyTrend')?.closest('section')?.querySelector('h2');
    if (trendTitle) {
        if (currentOrderType === 'ecommerce') {
            trendTitle.textContent = `Giá vốn ${daily.length} ngày gần nhất`;
        } else {
            trendTitle.textContent = `Doanh thu ${daily.length} ngày gần nhất`;
        }
    }

    document.getElementById('dailyTrend').innerHTML = daily.map(day => {
        const isToday = day.date === currentAnalytics?.range?.todayKey;

        // Xây dựng danh sách các phân đoạn (segments) cho ngày đó
        const segments = [];
        const targetTotal = Math.max(0, getTrendValue(day));

        if (currentOrderType === 'all') {
            // Thêm các ca làm việc
            if (day.shifts && day.shifts.length > 0) {
                const shiftColors = [
                    'bg-blue-600 dark:bg-blue-700',      // Ca 1 (Blue)
                    'bg-amber-500 dark:bg-amber-600',    // Ca 2 (Amber)
                    'bg-violet-500 dark:bg-violet-600',  // Ca 3 (Violet)
                    'bg-emerald-500 dark:bg-emerald-600',// Ca 4 (Emerald)
                    'bg-cyan-500 dark:bg-cyan-600'       // Ca 5 (Cyan)
                ];
                // Sắp xếp các ca của ngày đó theo giờ bắt đầu tăng dần
                const sortedShifts = [...day.shifts].sort((a, b) => {
                    const timeA = a.start_time || '00:00:00';
                    const timeB = b.start_time || '00:00:00';
                    return timeA.localeCompare(timeB);
                });

                day.shifts.forEach((s) => {
                    if (s.revenue > 0) {
                        const idx = sortedShifts.findIndex(ss =>
                            ss.name === s.name &&
                            ss.start_time === s.start_time &&
                            ss.end_time === s.end_time
                        );
                        const colorIdx = idx >= 0 ? idx : 0;
                        segments.push({
                            label: /^[Cc][Aa]\s+/i.test(s.name) ? s.name : `Ca ${s.name}`,
                            value: s.revenue,
                            colorClass: shiftColors[colorIdx % shiftColors.length]
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
        } else if (currentOrderType === 'dose_cut') {
            // Thêm các ca làm việc cho phần định lượng thuốc liều
            if (day.shifts && day.shifts.length > 0) {
                const shiftColors = [
                    'bg-indigo-600 dark:bg-indigo-700',   // Ca 1 (Indigo)
                    'bg-violet-500 dark:bg-violet-600',   // Ca 2 (Violet)
                    'bg-fuchsia-500 dark:bg-fuchsia-600', // Ca 3 (Fuchsia)
                    'bg-pink-500 dark:bg-pink-600',       // Ca 4 (Pink)
                    'bg-purple-500 dark:bg-purple-600'    // Ca 5 (Purple)
                ];
                // Sắp xếp các ca của ngày đó theo giờ bắt đầu tăng dần
                const sortedShifts = [...day.shifts].sort((a, b) => {
                    const timeA = a.start_time || '00:00:00';
                    const timeB = b.start_time || '00:00:00';
                    return timeA.localeCompare(timeB);
                });

                day.shifts.forEach((s) => {
                    if (s.revenue > 0) {
                        const idx = sortedShifts.findIndex(ss =>
                            ss.name === s.name &&
                            ss.start_time === s.start_time &&
                            ss.end_time === s.end_time
                        );
                        const colorIdx = idx >= 0 ? idx : 0;
                        segments.push({
                            label: /^[Cc][Aa]\s+/i.test(s.name) ? s.name : `Ca ${s.name}`,
                            value: s.revenue,
                            colorClass: shiftColors[colorIdx % shiftColors.length]
                        });
                    }
                });
            }

            const unscheduledVal = Number(day.unscheduledRetailRevenue || 0);
            if (unscheduledVal > 0) {
                segments.push({
                    label: (day.shifts && day.shifts.length > 0) ? 'Ngoài ca' : 'Thuốc liều',
                    value: unscheduledVal,
                    colorClass: 'bg-purple-400 dark:bg-purple-500'
                });
            }
        } else {
            // currentOrderType === 'retail' hoặc 'internal'
            // Thêm các ca làm việc
            if (day.shifts && day.shifts.length > 0) {
                const shiftColors = [
                    'bg-blue-600 dark:bg-blue-700',      // Ca 1 (Blue)
                    'bg-amber-500 dark:bg-amber-600',    // Ca 2 (Amber)
                    'bg-violet-500 dark:bg-violet-600',  // Ca 3 (Violet)
                    'bg-emerald-500 dark:bg-emerald-600',// Ca 4 (Emerald)
                    'bg-cyan-500 dark:bg-cyan-600'       // Ca 5 (Cyan)
                ];
                // Sắp xếp các ca của ngày đó theo giờ bắt đầu tăng dần
                const sortedShifts = [...day.shifts].sort((a, b) => {
                    const timeA = a.start_time || '00:00:00';
                    const timeB = b.start_time || '00:00:00';
                    return timeA.localeCompare(timeB);
                });

                day.shifts.forEach((s) => {
                    if (s.revenue > 0) {
                        const idx = sortedShifts.findIndex(ss =>
                            ss.name === s.name &&
                            ss.start_time === s.start_time &&
                            ss.end_time === s.end_time
                        );
                        const colorIdx = idx >= 0 ? idx : 0;
                        segments.push({
                            label: /^[Cc][Aa]\s+/i.test(s.name) ? s.name : `Ca ${s.name}`,
                            value: s.revenue,
                            colorClass: shiftColors[colorIdx % shiftColors.length]
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

        const totalVal = targetTotal;
        const sourceTotal = segments.reduce((sum, s) => sum + s.value, 0);
        const isZeroDay = totalVal === 0;

        let totalHeight = 0;
        if (totalVal > 0) {
            totalHeight = Math.max(12, Math.round(totalVal / maxRevenue * 132));
        } else {
            totalHeight = 8; // Chiều cao tối thiểu cho cột 0đ
        }

        // Làm nổi bật màu xanh lá cây cho ngày hôm nay nếu chỉ có 1 phân đoạn duy nhất
        if (isToday && segments.length === 1) {
            segments[0].colorClass = 'bg-emerald-600';
        }

        // Tính toán chiều cao thực tế của từng phân đoạn
        const scaledSegments = sourceTotal > 0 && targetTotal > 0
            ? segments.map(seg => ({
                ...seg,
                value: targetTotal * (seg.value / sourceTotal)
            }))
            : segments;

        let remainingHeight = totalHeight;
        const renderedSegments = scaledSegments.map((seg, idx) => {
            let segHeight = 0;
            if (idx === scaledSegments.length - 1) {
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
            <div class="flex-1 min-w-14 flex flex-col items-center justify-end gap-3 group relative">
                <!-- Tooltip hiện khi di chuột -->
                <div class="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold rounded px-2 py-1 shadow-md z-30 whitespace-nowrap pointer-events-none">
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

    if (currentOrderType === 'ecommerce') {
        // TMĐT: chỉ hiển thị Giá vốn
        const costClass = product.cost > 0 ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400';
        return `
        <tr class="group ${highlightClass} transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="py-4 px-4 border-y border-l border-slate-200 dark:border-slate-800 rounded-l-2xl font-black text-slate-400 text-xs">${index + 1}</td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800">
                <div class="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">${escapeHTML(product.name)}</div>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>${escapeHTML(product.code || 'Chưa có mã')}</span>
                    <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>${escapeHTML(product.unit || 'Đơn vị')}</span>
                    ${product.isLowStock ? '<span class="px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Tồn thấp</span>' : ''}
                </div>
            </td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right font-black text-slate-900 dark:text-white">${formatNumber(product.quantity)}</td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right font-black ${stockClass}">${stockText}</td>
            <td class="py-4 px-4 border-y border-r border-slate-200 dark:border-slate-800 rounded-r-2xl text-right font-black ${costClass}">${formatCurrency(product.cost)}</td>
        </tr>
    `;
    }

    if (employeeMode) {
        return `
        <tr class="group ${highlightClass} transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="py-4 px-4 border-y border-l border-slate-200 dark:border-slate-800 rounded-l-2xl font-black text-slate-400 text-xs">${index + 1}</td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800">
                <div class="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">${escapeHTML(product.name)}</div>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>${escapeHTML(product.code || 'Chưa có mã')}</span>
                    <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>${escapeHTML(product.unit || 'Đơn vị')}</span>
                    ${product.isLowStock ? '<span class="px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Tồn thấp</span>' : ''}
                </div>
            </td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right font-black text-slate-900 dark:text-white">${formatNumber(product.quantity)}</td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right font-black ${stockClass}">${stockText}</td>
            <td class="py-4 px-4 border-y border-r border-slate-200 dark:border-slate-800 rounded-r-2xl text-right font-black text-blue-600 dark:text-blue-400">${formatCurrency(product.revenue)}</td>
        </tr>
    `;
    }

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

    // Cập nhật động cấu trúc thead tùy theo chế độ hiển thị
    const thead = document.querySelector('#productTableDetails table thead');
    if (thead) {
        if (currentOrderType === 'ecommerce') {
            thead.innerHTML = `
                <tr class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    <th class="px-4 py-2 w-14">#</th>
                    <th class="px-4 py-2 min-w-72">Mặt hàng</th>
                    <th class="px-4 py-2 text-right">SL xuất</th>
                    <th class="px-4 py-2 text-right">Tồn</th>
                    <th class="px-4 py-2 text-right border-r border-slate-200 dark:border-slate-800 rounded-r-2xl">Giá vốn</th>
                </tr>
            `;
        } else if (employeeMode) {
            thead.innerHTML = `
                <tr class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    <th class="px-4 py-2 w-14">#</th>
                    <th class="px-4 py-2 min-w-72">Mặt hàng</th>
                    <th class="px-4 py-2 text-right">SL bán</th>
                    <th class="px-4 py-2 text-right">Tồn</th>
                    <th class="px-4 py-2 text-right border-r border-slate-200 dark:border-slate-800 rounded-r-2xl">Doanh thu</th>
                </tr>
            `;
        } else {
            thead.innerHTML = `
                <tr class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    <th class="px-4 py-2 w-14">#</th>
                    <th class="px-4 py-2 min-w-72">Mặt hàng</th>
                    <th class="px-4 py-2 text-right">SL bán</th>
                    <th class="px-4 py-2 text-right">Tồn</th>
                    <th class="px-4 py-2 text-right">Doanh thu</th>
                    <th class="px-4 py-2 text-right">Giá vốn</th>
                    <th class="px-4 py-2 text-right border-r border-slate-200 dark:border-slate-800 rounded-r-2xl">Lợi nhuận</th>
                </tr>
            `;
        }
    }

    const colSpanVal = employeeMode ? 5 : 7;
    document.getElementById('productTableBody').innerHTML = rows.length
        ? rows.map(productRow).join('')
        : `<tr><td colspan="${colSpanVal}" class="py-12 text-center text-sm font-bold text-slate-400">Hôm nay chưa có dữ liệu phù hợp</td></tr>`;
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
            <span class="text-xl font-black text-slate-800 dark:text-white">${formatCurrency(p.revenue)}</span>
            <span class="text-xs font-bold text-slate-500">${formatNumber(p.orders)} đơn hàng</span>
        </div>
    `).join('');
}

function renderDoseStats(summary) {
    const section = document.getElementById('doseStatsSection');
    if (!section) return;

    if (currentOrderType === 'ecommerce' || currentOrderType === 'dose_cut') {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');

    const revenueVal = document.getElementById('doseRevenueVal');
    const costVal = document.getElementById('doseCostVal');
    const profitVal = document.getElementById('doseProfitVal');

    if (revenueVal) revenueVal.textContent = formatCurrency(summary.dosePackageRevenue || 0);

    const costCardLabel = costVal?.previousElementSibling;
    const profitCardLabel = profitVal?.previousElementSibling;

    if (employeeMode) {
        if (costCardLabel) costCardLabel.textContent = 'Số lượng gói liều bán ra';
        if (costVal) costVal.textContent = `${formatNumber(summary.doseItemsSold || 0)} gói`;

        if (profitCardLabel) {
            profitCardLabel.textContent = 'Tỷ trọng doanh thu liều';
            profitCardLabel.className = 'text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest';
        }
        if (profitVal) {
            const pct = summary.retailRevenue ? ((summary.dosePackageRevenue || 0) / summary.retailRevenue * 100) : 0;
            profitVal.textContent = `${formatNumber(pct)}% doanh thu bán lẻ`;
            profitVal.className = 'text-xl font-black text-emerald-600 dark:text-emerald-400';
        }
    } else {
        if (costCardLabel) costCardLabel.textContent = 'Vốn định lượng';
        if (costVal) {
            let valText = formatCurrency(summary.doseIngredientCost || 0);
            if (summary.doseIngredientPOSCost > 0 || summary.doseIngredientInternalCost > 0) {
                const posStr = formatCurrency(summary.doseIngredientPOSCost || 0);
                const intStr = formatCurrency(summary.doseIngredientInternalCost || 0);
                valText += `<span class="text-[11px] text-slate-500 font-bold block mt-1">(POS: ${posStr} | Xuất kho: ${intStr})</span>`;
            }
            costVal.innerHTML = valText;
        }

        if (profitCardLabel) {
            profitCardLabel.textContent = 'Lợi nhuận cắt liều';
            profitCardLabel.className = 'text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest';
        }
        if (profitVal) {
            const profit = summary.doseProfit || 0;
            profitVal.textContent = formatCurrency(profit);
            profitVal.className = 'text-xl font-black ' +
                (profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400');
        }
    }
}

function renderAnalytics(analytics) {
    currentAnalytics = analytics;
    renderSummary(analytics.summary, analytics.comparison);
    renderAlerts(analytics.alerts);
    renderTrend(analytics.daily);
    renderProductTable();
    renderBusinessInsights();
    updateMissingCostTab(analytics);
    renderEcommercePlatforms(analytics.platformsPerformance);
    renderDoseStats(analytics.summary);
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
        const stackHTML = error.stack ? `<pre class="text-left bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-auto mt-2 text-xs font-mono text-red-600 max-w-full">${error.stack}</pre>` : '';
        setState('error', (error.message || 'Không tải được dữ liệu báo cáo.') + stackHTML);
    }
}

function updateEmployeeToggleUI() {
    const toggleContainer = document.getElementById('employeeModeToggleContainer');
    if (toggleContainer) {
        // Luôn ẩn toggle - manager và staff không được phép tắt chế độ nhân viên
        toggleContainer.classList.add('hidden');
    }

    // Ẩn/hiện các tab báo cáo & phân tích dựa trên Chế độ nhân viên
    const profitModeBtn = document.querySelector('[data-report-mode="profit"]');
    const missingCostModeBtn = document.querySelector('[data-report-mode="missing-cost"]');
    const highProfitBtn = document.querySelector('[data-business-insight="high-profit"]');

    if (profitModeBtn) profitModeBtn.classList.toggle('hidden', employeeMode);
    if (missingCostModeBtn) missingCostModeBtn.classList.toggle('hidden', employeeMode);
    if (highProfitBtn) highProfitBtn.classList.toggle('hidden', employeeMode);

    if (employeeMode) {
        if (reportMode === 'profit' || reportMode === 'missing-cost') {
            reportMode = 'quantity';
            updateTabStyles();
        }
        if (activeInsight === 'high-profit') {
            activeInsight = 'low-stock-hot';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initLayout('admin', 'overview');

    // Đồng bộ UI nút Toggle Chế độ nhân viên
    updateEmployeeToggleUI();

    // Đã bỏ toggle - employeeMode luôn cố định theo role

    // Khởi tạo khoảng ngày mặc định là ngày hôm nay
    const today = new Date();
    const dateToVal = today.toISOString().split('T')[0];
    const dateFromVal = dateToVal;

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
        if (reportModeButton) {
            setActiveReportMode(reportModeButton.dataset.reportMode);
            document.getElementById('productTableDetails')?.setAttribute('open', '');
        }

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

        const insightButton = event.target.closest('[data-business-insight]');
        if (insightButton) {
            activeInsight = insightButton.dataset.businessInsight;
            renderBusinessInsights();
            document.getElementById('businessInsightDetails')?.setAttribute('open', '');
        }

        const alertButton = event.target.closest('[data-insight-key]');
        if (alertButton) {
            const key = alertButton.dataset.insightKey;
            if (key === 'low-stock-hot') {
                activeInsight = 'low-stock-hot';
                renderBusinessInsights();
                document.getElementById('businessInsightDetails')?.setAttribute('open', '');
                document.getElementById('businessInsightSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (key === 'missing-cost') {
                setActiveReportMode('missing-cost');
                document.getElementById('productTableDetails')?.setAttribute('open', '');
                document.getElementById('productSearch')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

    document.getElementById('productSearch')?.addEventListener('input', event => {
        productSearch = event.target.value.trim();
        if (productSearch) {
            document.getElementById('productTableDetails')?.setAttribute('open', '');
        }
        renderProductTable();
    });
});
