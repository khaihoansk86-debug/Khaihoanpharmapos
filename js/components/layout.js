// js/components/layout.js

/**
 * Khởi tạo Layout cho trang
 */
export function initLayout(pageType = 'admin', activeTab = 'products') {
    const headerContainer = document.getElementById('app-header');
    if (headerContainer) {
        if (pageType === 'pos') {
            headerContainer.innerHTML = renderPOSHeader();
        } else {
            headerContainer.innerHTML = renderAdminHeader(activeTab);
        }
        bindLayoutEvents();
    }

    // Kích hoạt Dark Mode
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.documentElement.classList.add('dark');
    }
}

/**
 * Render Header cho Trang Quản trị
 */
export function renderAdminHeader(activeTab = 'products') {
    const isDark = localStorage.getItem('darkMode') === 'true';

    return `
    <header class="sticky top-0 z-[100] w-full bg-slate-900 text-white h-14 flex items-center justify-between px-4 transition-all duration-300">
        <div class="flex items-center gap-6 h-full">
            <div class="flex items-center gap-2 mr-4">
                <i class="fa-solid fa-house-medical text-blue-400 text-xl"></i>
                <span class="font-black tracking-tighter uppercase text-sm">Khải Hoàn</span>
            </div>

            <nav class="flex items-center h-full gap-1">
                ${renderTab('products',  'fa-boxes-stacked',         'Hàng hóa',  activeTab === 'products')}
                ${renderTab('invoices',  'fa-file-invoice-dollar',   'Hóa đơn',   activeTab === 'invoices')}
                ${renderTab('inventory', 'fa-warehouse',             'Tồn kho',   activeTab === 'inventory')}
                ${renderTabDisabled('fa-chart-pie',       'Tổng quan')}
                ${renderTabDisabled('fa-cart-shopping',   'Mua hàng')}
                ${renderTabDisabled('fa-users',           'Đối tác')}
                ${renderTabDisabled('fa-chart-line',      'Báo cáo')}
            </nav>
        </div>

        <div class="flex items-center gap-4">
            <!-- Search nhanh -->
            <div class="relative hidden xl:block">
                <input type="text" placeholder="Tìm kiếm..." class="bg-slate-800 border-none rounded-lg py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-blue-500 w-48 outline-none text-white">
                <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]"></i>
            </div>

            <button data-action="toggle-dark-mode" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-all" title="Chế độ tối/sáng">
                <i class="fa-solid ${isDark ? 'fa-sun' : 'fa-moon'} text-sm" id="darkModeIcon"></i>
            </button>

            <div class="h-6 w-[1px] bg-slate-700"></div>

            <!-- NÚT BÁN HÀNG (Nằm tách biệt bên phải) -->
            <a href="pos.html" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20">
                <i class="fa-solid fa-cash-register"></i>
                <span>Bán hàng</span>
            </a>

            <div class="flex items-center gap-2 pl-2 group cursor-pointer">
                <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Admin">
                </div>
            </div>
        </div>
    </header>
    `;
}

/**
 * Render Header tối giản cho Trang Bán hàng (POS)
 */
export function renderPOSHeader() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    return `
    <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between transition-all">
        <div class="flex items-center gap-3">
            <a href="products.html" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 transition-all" title="Về trang quản trị">
                <i class="fa-solid fa-arrow-left"></i>
            </a>
            <div class="flex items-center gap-2">
                <i class="fa-solid fa-house-medical text-blue-600"></i>
                <h1 class="font-black text-base tracking-tighter text-slate-800 dark:text-white uppercase">Khải Hoàn <span class="text-blue-600 text-xs">POS</span></h1>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <span id="posTime" class="text-sm font-bold text-slate-500 dark:text-slate-400 tabular-nums"></span>
            <button data-action="toggle-dark-mode" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <i class="fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}" id="darkModeIcon"></i>
            </button>
        </div>
    </header>
    `;
}

function renderTab(id, icon, label, isActive) {
    return `
    <a href="${id}.html" class="flex items-center gap-2 px-4 h-full text-[13px] font-bold transition-all border-b-2 ${isActive ? 'border-blue-500 text-blue-400 bg-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}">
        <i class="fa-solid ${icon}"></i>
        <span>${label}</span>
    </a>`;
}

function renderTabDisabled(icon, label) {
    return `
    <span class="flex items-center gap-2 px-4 h-full text-[13px] font-bold border-b-2 border-transparent text-slate-600 cursor-not-allowed select-none opacity-50" title="${label} (Sắp ra mắt)">
        <i class="fa-solid ${icon}"></i>
        <span class="hidden lg:inline">${label}</span>
    </span>`;
}

function bindLayoutEvents() {
    document.querySelectorAll('[data-action="toggle-dark-mode"]').forEach(button => {
        button.addEventListener('click', toggleDarkMode);
    });
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    const icon = document.getElementById('darkModeIcon');
    if (icon) icon.className = isDark ? 'fa-solid fa-sun text-lg' : 'fa-solid fa-moon text-lg';
}

window.toggleDarkMode = toggleDarkMode;
