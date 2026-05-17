// js/components/layout.js

/**
 * Khởi tạo Layout cho trang
 * @param {'admin'|'pos'} pageType
 * @param {'products'|'invoices'|'inventory'|'employees'|'customers'|'suppliers'|'overview'} activeTab
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

    // Đăng ký Service Worker cho Offline Mode
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')

                .then(reg => console.log('SW: Đã đăng ký thành công', reg.scope))

                .catch(err => console.log('SW: Lỗi đăng ký', err));
        });
    }
}

/**
 * Render Header cho Trang Quản trị
 * Các tab có trang thật: products, invoices, inventory
 * Các tab planned: overview, purchase, partners, cashbook, reports — hiện dạng disabled
 */
export function renderAdminHeader(activeTab = 'products') {
    const isDark = localStorage.getItem('darkMode') === 'true';

    return `
    <header class="sticky top-0 z-[100] w-full bg-slate-900 text-white h-14 flex items-center justify-between px-4 transition-all duration-300">
        <div class="flex items-center gap-6 h-full">
            <!-- Logo -->
            <a href="products.html" class="flex items-center gap-2 mr-4 shrink-0 group">

                <i class="fa-solid fa-house-medical text-blue-400 text-xl group-hover:text-blue-300 transition-colors"></i>

                <span class="font-black tracking-tighter uppercase text-sm hidden sm:block">Khải Hoàn</span>
            </a>

            <!-- Navigation tabs -->
            <nav class="flex items-center h-full gap-0.5" aria-label="Menu chính">

                ${renderTab('products',  'fa-boxes-stacked',      'Hàng hóa',  activeTab === 'products',  true)}

                ${renderTab('invoices',  'fa-file-invoice-dollar','Hóa đơn',   activeTab === 'invoices',  true)}

                ${renderInventoryMenu(activeTab)}

                ${renderTab('customers', 'fa-user-group', 'Khách hàng', activeTab === 'customers', true)}

                ${renderTab('employees', 'fa-user-clock',         'Nhân viên', activeTab === 'employees', true)}

                ${renderTab('overview', 'fa-chart-pie', 'Tổng quan', activeTab === 'overview', true)}

                ${renderTabDisabled('fa-cart-shopping', 'Mua hàng')}

                ${renderTab('suppliers', 'fa-users', 'Đối tác', activeTab === 'suppliers', true)}
                
                ${renderTab('settings', 'fa-gear', 'Cài đặt', activeTab === 'settings', true)}
            </nav>
        </div>

        <div class="flex items-center gap-3">
            <!-- User Info (Auth) -->
            <div id="headerUserInfo" class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-sm font-bold border border-slate-700">
                <i class="fa-solid fa-user-circle text-slate-400"></i>
                <span id="headerUserName" class="text-slate-200">User</span>
                <button onclick="window.handleLogout()" class="ml-2 text-slate-400 hover:text-red-400 transition-colors" title="Đăng xuất">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>

            <!-- Dark mode toggle -->
            <button data-action="toggle-dark-mode"

                class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-all"

                title="Chế độ tối/sáng"

                aria-label="Chuyển chế độ tối sáng">

                <i class="fa-solid ${isDark ? 'fa-sun' : 'fa-moon'} text-sm" id="darkModeIcon"></i>
            </button>

            <div class="h-6 w-px bg-slate-700"></div>

            <!-- Nút Bán hàng -->
            <a href="pos.html"
               class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
               aria-label="Đến trang bán hàng">

                <i class="fa-solid fa-cash-register"></i>

                <span class="hidden sm:inline">Bán hàng</span>
            </a>

            <!-- Avatar -->
            <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden shrink-0" title="Quản trị viên">

                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Admin" loading="lazy">
            </div>
        </div>
    </header>
    `;
}

/**
 * Render Header tối giản cho Trang Bán hàng (POS)
 * Không có nav tab — chỉ logo, giờ thực, nút quay về quản trị, dark mode
 */
export function renderPOSHeader() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    return `
    <header class="bg-white/95 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 px-4 py-2 flex items-center justify-between transition-all shadow-sm backdrop-blur">
        <div class="flex items-center gap-3">
            <a href="products.html"
               class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
               title="Về trang quản trị"
               aria-label="Quay về trang quản trị">

                <i class="fa-solid fa-arrow-left"></i>
            </a>
            <div class="flex items-center gap-2">

                <i class="fa-solid fa-house-medical text-blue-600"></i>

                <h1 class="font-black text-base text-slate-800 dark:text-white uppercase">Khải Hoàn <span class="text-blue-600 text-xs">POS</span></h1>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <a href="products.html" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-blue-600 transition-colors" title="Quản trị">

                <i class="fa-solid fa-table-columns text-sm"></i>
            </a>
            <a href="invoices.html" class="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors" title="Trả hàng">

                <i class="fa-solid fa-rotate-left text-sm"></i>
            </a>
            <span id="posTime" class="text-sm font-bold text-slate-500 dark:text-slate-400 tabular-nums"></span>
            <button data-action="toggle-dark-mode" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">

                <i class="fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}" id="darkModeIcon"></i>
            </button>
        </div>
    </header>
    `;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function renderInventoryMenu(activeTab) {
    const isActive = activeTab === 'inventory';
    const activeClasses = 'border-blue-500 text-blue-400 bg-slate-800';
    const inactiveClasses = 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50';
    return `
    <div class="relative h-full group">
        <a href="inventory.html"
           class="flex items-center gap-1.5 px-3 xl:px-4 h-full text-[13px] font-bold transition-all border-b-2 ${isActive ? activeClasses : inactiveClasses}"
           ${isActive ? 'aria-current="page"' : ''}
           title="Tồn kho">
            <i class="fa-solid fa-warehouse"></i>
            <span class="hidden md:inline">Tồn kho</span>
            <i class="fa-solid fa-chevron-down text-[10px] opacity-70 hidden md:inline"></i>
        </a>
        <div class="absolute left-0 top-full hidden group-hover:block pt-2 z-[120]">
            <div class="w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1">

                <a href="inventory.html" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800">Tồn kho hiện tại</a>

                <a href="inventory.html#receive" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800">Tạo phiếu nhập hàng</a>

                <a href="inventory.html#internal-issue" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800">Tạo phiếu xuất nội bộ</a>

                <a href="inventory.html#stocktake" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800">Tạo phiếu kiểm kê</a>
            </div>
        </div>
    </div>`;
}
/**
 * Tab điều hướng có trang thật
 * @param {string}  id       - Tên route (không có .html), ví dụ 'products'
 * @param {string}  icon     - Font Awesome class, ví dụ 'fa-boxes-stacked'
 * @param {string}  label    - Nhãn hiển thị
 * @param {boolean} isActive - Tab hiện tại đang active
 * @param {boolean} enabled  - Tab có thể click được
 */
function renderTab(id, icon, label, isActive, enabled = true) {
    const activeClasses   = 'border-blue-500 text-blue-400 bg-slate-800';
    const inactiveClasses = 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50';
    return `
    <a href="${id}.html"
       class="flex items-center gap-1.5 px-3 xl:px-4 h-full text-[13px] font-bold transition-all border-b-2 ${isActive ? activeClasses : inactiveClasses}"
       ${isActive ? 'aria-current="page"' : ''}
       title="${label}">
        <i class="fa-solid ${icon}"></i>
        <span class="hidden md:inline">${label}</span>
    </a>`;
}

/**
 * Tab placeholder cho tính năng chưa phát triển
 * Hiển thị mờ, không click được, không tạo broken link
 */
function renderTabDisabled(icon, label) {
    return `
    <span class="flex items-center gap-1.5 px-3 xl:px-4 h-full text-[13px] font-bold border-b-2 border-transparent text-slate-600 cursor-not-allowed select-none hidden xl:flex"
          title="${label} (Sắp ra mắt)"
          aria-disabled="true">
        <i class="fa-solid ${icon}"></i>
        <span>${label}</span>
    </span>`;
}

// ─── Events ───────────────────────────────────────────────────────────────────

function bindLayoutEvents() {
    document.querySelectorAll('[data-action="toggle-dark-mode"]').forEach(button => {
        button.addEventListener('click', toggleDarkMode);
    });
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', String(isDark));
    const icon = document.getElementById('darkModeIcon');
    if (icon) icon.className = isDark ? 'fa-solid fa-sun text-lg' : 'fa-solid fa-moon text-lg';
}

window.toggleDarkMode = toggleDarkMode;
