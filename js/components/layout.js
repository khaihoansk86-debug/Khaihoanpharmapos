// js/components/layout.js

/**
 * Khởi tạo Layout cho trang
 * @param {'admin'|'pos'} pageType
 * @param {'products'|'invoices'|'inventory'|'employees'|'customers'|'suppliers'|'overview'} activeTab
 */
export function initLayout(pageType = 'admin', activeTab = 'products') {
    // Inject phong cách Robot Minimalist & Glassmorphism
    const styleId = 'robot-minimalist-styles';
    if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
            /* Robot Minimalist & Glassmorphism Global Styles */
            :root {
                --glass-bg: rgba(255, 255, 255, 0.75);
                --glass-bg-dark: rgba(2, 6, 23, 0.4);
                --glass-border: rgba(226, 232, 240, 0.8);
                --glass-border-dark: rgba(51, 65, 85, 0.5);
                --tech-glow: 0 0 15px rgba(59, 130, 246, 0.15);
                --tech-glow-emerald: 0 0 15px rgba(16, 185, 129, 0.15);
            }

            body {
                background-color: #f1f5f9;
                background-image: 
                    radial-gradient(circle at 15% 50%, rgba(59, 130, 246, 0.08), transparent 25%),
                    radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.08), transparent 25%),
                    radial-gradient(circle, rgba(148, 163, 184, 0.15) 1px, transparent 1px) !important;
                background-size: 100% 100%, 100% 100%, 20px 20px !important;
                animation: backgroundMove 100s ease-in-out infinite alternate;
                transition: background-color 0.3s ease;
                min-height: 100vh;
            }

            /* Minimalist Outline Icons Override */
            .fa-solid, .fas {
                font-family: "Font Awesome 6 Free", "FontAwesome" !important;
                font-weight: 400 !important;
            }
            .dark body {
                background-color: #020617;
                background-image: 
                    radial-gradient(circle at 15% 50%, rgba(56, 189, 248, 0.05), transparent 25%),
                    radial-gradient(circle at 85% 30%, rgba(52, 211, 153, 0.05), transparent 25%),
                    radial-gradient(circle, rgba(148, 163, 184, 0.1) 1px, transparent 1px) !important;
                background-size: 100% 100%, 100% 100%, 20px 20px !important;
            }
            @keyframes backgroundMove {
                0% { background-position: 0 0, 0 0, 0 0; }
                100% { background-position: 0 0, 0 0, 20px 20px; }
            }

            /* Glassmorphism Cards - Sync across all tabs */
            .glass-card, 
            .bg-white.rounded-2xl,
            .bg-white.rounded-xl,
            section.bg-white,
            form.bg-white,
            article.bg-white,
            div.bg-white.border {
                background: var(--glass-bg) !important;
                backdrop-filter: blur(16px) saturate(120%) !important;
                -webkit-backdrop-filter: blur(16px) saturate(120%) !important;
                border-color: var(--glass-border) !important;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04) !important;
            }

            .dark .glass-card,
            .dark .bg-white.rounded-2xl,
            .dark .bg-white.rounded-xl,
            .dark section.bg-white,
            .dark form.bg-white,
            .dark article.bg-white,
            .dark div.bg-white.border {
                background: var(--glass-bg-dark) !important;
                backdrop-filter: blur(20px) saturate(140%) !important;
                -webkit-backdrop-filter: blur(20px) saturate(140%) !important;
                border-color: var(--glass-border-dark) !important;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;
            }

            /* Futuristic Icons */
            i.fa-solid, i.fa-regular {
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
                transition: all 0.3s ease;
            }
            .dark i.fa-solid, .dark i.fa-regular {
                filter: drop-shadow(0 0 8px rgba(255,255,255,0.15));
            }

            /* Sidebar custom override */
            aside, .sticky {
                backdrop-filter: blur(12px) !important;
                -webkit-backdrop-filter: blur(12px) !important;
            }

            /* Minimalist tech border splitters */
            .tech-border, hr, .border-b, .border-t, .divide-y > * {
                border-color: rgba(226, 232, 240, 0.5) !important;
            }
            .dark .tech-border, .dark hr, .dark .border-b, .dark .border-t, .dark .divide-y > * {
                border-color: rgba(51, 65, 85, 0.4) !important;
            }

            /* Custom modern glass inputs */
            .input, select.input, textarea.input, input[type="text"], input[type="password"], input[type="number"], select {
                background: rgba(248, 250, 252, 0.6) !important;
                backdrop-filter: blur(4px);
                border: 1px solid var(--glass-border) !important;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .dark .input, .dark select.input, .dark textarea.input, .dark input[type="text"], .dark input[type="password"], .dark input[type="number"], .dark select {
                background: rgba(15, 23, 42, 0.6) !important;
                backdrop-filter: blur(4px);
                border: 1px solid var(--glass-border-dark) !important;
                color: #f1f5f9 !important;
            }

            .input:focus, select.input:focus, input[type="text"]:focus, input[type="password"]:focus, select:focus {
                border-color: #3b82f6 !important;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18) !important;
                transform: translateY(-1px);
            }

            /* Tab button styling */
            .tab-button {
                transition: all 0.2s ease;
            }
            .tab-button[aria-selected="true"] {
                background: rgba(59, 130, 246, 0.1) !important;
                color: #3b82f6 !important;
                border-color: rgba(59, 130, 246, 0.3) !important;
                box-shadow: var(--tech-glow) !important;
                font-weight: 900 !important;
            }
            .dark .tab-button[aria-selected="true"] {
                background: rgba(59, 130, 246, 0.15) !important;
                color: #60a5fa !important;
                border-color: rgba(96, 165, 250, 0.4) !important;
            }

            /* Custom minimal scrollbar */
            ::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }
            ::-webkit-scrollbar-track {
                background: transparent;
            }
            ::-webkit-scrollbar-thumb {
                background: rgba(148, 163, 184, 0.3);
                border-radius: 9999px;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: rgba(148, 163, 184, 0.5);
            }

            /* Tech Table Design */
            table {
                border-collapse: separate !important;
                border-spacing: 0 !important;
            }
            thead th {
                font-family: inherit;
                font-size: 12px !important;
                font-weight: 900 !important;
                letter-spacing: 0.05em !important;
                text-transform: uppercase;
                background: rgba(255, 255, 255, 0.3) !important;
                border-bottom: 1px solid var(--glass-border) !important;
                padding-top: 10px !important;
                padding-bottom: 10px !important;
            }
            .dark thead th {
                background: rgba(2, 6, 23, 0.4) !important;
                border-bottom: 1px solid var(--glass-border-dark) !important;
            }
            tbody tr {
                background: transparent !important;
                transition: background-color 0.15s ease !important;
            }
            tbody tr:hover {
                background-color: rgba(255, 255, 255, 0.5) !important;
            }
            .dark tbody tr:hover {
                background-color: rgba(15, 23, 42, 0.6) !important;
            }
        `;
        document.head.appendChild(styleEl);
    }

    // Bắt buộc đăng nhập
    const userStr = localStorage.getItem('pos_user');
    if (!userStr && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = userStr ? JSON.parse(userStr) : null;
    
    // Phân quyền nâng cao: Kiểm tra danh sách quyền hạn chi tiết (permissions)
    if (user) {
        let userPerms = [];
        if (Array.isArray(user.permissions)) {
            userPerms = user.permissions;
        } else {
            // Fallback dựa trên role nếu chưa cấu hình quyền
            if (user.role === 'admin') {
                userPerms = [
                    'access_pos', 'access_products', 'manage_products', 'access_invoices',
                    'manage_invoices', 'access_inventory', 'manage_inventory', 'access_employees',
                    'access_payroll', 'access_overview', 'access_customers', 'access_suppliers',
                    'access_settings'
                ];
            } else if (user.role === 'manager') {
                userPerms = [
                    'access_pos', 'access_products', 'manage_products', 'access_invoices',
                    'access_inventory', 'manage_inventory', 'access_payroll', 'access_customers',
                    'access_suppliers'
                ];
            } else {
                userPerms = ['access_pos', 'access_products', 'access_invoices', 'access_customers'];
            }
        }

        const permissionMap = {
            'products': 'access_products',
            'invoices': 'access_invoices',
            'inventory': 'access_inventory',
            'customers': 'access_customers',
            'employees': 'access_employees',
            'overview': 'access_overview',
            'purchase': 'access_suppliers',
            'suppliers': 'access_suppliers',
            'settings': 'access_settings',
            'pos': 'access_pos'
        };

        const requiredPerm = permissionMap[activeTab];
        if (requiredPerm && !userPerms.includes(requiredPerm)) {
            alert('Tài khoản của bạn không có quyền truy cập trang này!');
            if (userPerms.includes('access_pos')) {
                window.location.href = 'pos.html';
            } else if (userPerms.includes('access_products')) {
                window.location.href = 'products.html';
            } else {
                localStorage.removeItem('pos_user');
                window.location.href = 'login.html';
            }
            return;
        }
    }

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

    // Hiển thị tên user trên Header
    if (user) {
        setTimeout(() => {
            const nameEl = document.getElementById('headerUserName');
            if (nameEl) nameEl.textContent = user.name;
        }, 50);
    }
}

/**
 * Render Header cho Trang Quản trị
 * Các tab có trang thật: products, invoices, inventory
 * Các tab planned: overview, purchase, partners, cashbook, reports — hiện dạng disabled
 */
export function renderAdminHeader(activeTab = 'products') {
    const isDark = localStorage.getItem('darkMode') === 'true';
    const userStr = localStorage.getItem('pos_user');
    const user = userStr ? JSON.parse(userStr) : { role: 'staff' };
    
    // Parse user permissions with fallback
    let userPerms = [];
    if (user && Array.isArray(user.permissions)) {
        userPerms = user.permissions;
    } else {
        if (user.role === 'admin') {
            userPerms = [
                'access_pos', 'access_products', 'manage_products', 'access_invoices',
                'manage_invoices', 'access_inventory', 'manage_inventory', 'access_employees',
                'access_payroll', 'access_overview', 'access_customers', 'access_suppliers',
                'access_settings'
            ];
        } else if (user.role === 'manager') {
            userPerms = [
                'access_pos', 'access_products', 'manage_products', 'access_invoices',
                'access_inventory', 'manage_inventory', 'access_payroll', 'access_customers',
                'access_suppliers'
            ];
        } else {
            userPerms = ['access_pos', 'access_products', 'access_invoices', 'access_customers'];
        }
    }

    const hasPerm = (p) => userPerms.includes(p);

    return `
    <header class="sticky top-0 z-[100] w-full bg-slate-950/85 dark:bg-slate-950/85 backdrop-blur-md text-white h-14 flex items-center justify-between px-4 border-b border-slate-800/80 transition-all duration-300">
        <div class="flex items-center gap-6 h-full">
            <!-- Logo -->
            <a href="${hasPerm('access_products') ? 'products.html' : 'pos.html'}" class="flex items-center gap-2 mr-4 shrink-0 group">
                <i class="fa-solid fa-house-medical text-blue-400 text-xl group-hover:text-blue-300 transition-colors"></i>
                <span class="font-black tracking-tighter uppercase text-sm hidden sm:block">Khải Hoàn</span>
            </a>

            <!-- Navigation tabs -->
            <nav class="flex items-center h-full gap-0.5" aria-label="Menu chính">
                ${hasPerm('access_products') ? renderProductsMenu(activeTab) : ''}
                ${hasPerm('access_invoices') ? renderTab('invoices',  'fa-file-invoice-dollar','Hóa đơn',   activeTab === 'invoices',  true) : ''}
                ${hasPerm('access_inventory') ? renderInventoryMenu(activeTab) : ''}
                ${hasPerm('access_customers') ? renderTab('customers', 'fa-user-group', 'Khách hàng', activeTab === 'customers', true) : ''}
                ${hasPerm('access_employees') ? renderTab('employees', 'fa-user-clock', 'Nhân viên', activeTab === 'employees', true) : ''}
                ${hasPerm('access_overview') ? renderTab('overview', 'fa-chart-pie', 'Tổng quan', activeTab === 'overview', true) : ''}
                ${hasPerm('access_suppliers') ? renderPurchaseMenu(activeTab) : ''}
                ${hasPerm('access_settings') ? renderTab('settings', 'fa-gear', 'Cài đặt', activeTab === 'settings', true) : ''}
            </nav>
        </div>

        <div class="flex items-center gap-3">
            <!-- User Info (Auth) -->
            <div id="headerUserInfo" class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 backdrop-blur-sm text-sm font-bold border border-slate-800">
                <i class="fa-solid fa-user-circle text-slate-400"></i>
                <span id="headerUserName" class="text-slate-200">${user.name || 'User'}</span>
                <button onclick="window.handleLogout()" class="ml-2 text-slate-400 hover:text-red-400 transition-colors" title="Đăng xuất">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>

            <!-- Dark mode toggle -->
            <button data-action="toggle-dark-mode"

                class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-800"

                title="Chế độ tối/sáng"

                aria-label="Chuyển chế độ tối sáng">

                <i class="fa-solid ${isDark ? 'fa-sun' : 'fa-moon'} text-sm" id="darkModeIcon"></i>
            </button>

            <div class="h-6 w-px bg-slate-800"></div>

            <!-- Nút Bán hàng -->
            <a href="pos.html"
               class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20 border border-blue-500/30"
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
    <header class="sticky top-0 z-[100] w-full bg-slate-950/85 dark:bg-slate-950/85 backdrop-blur-md text-white h-14 flex items-center justify-between px-4 border-b border-slate-800/80 transition-all duration-300">
        <div class="flex items-center gap-3">
            <a href="products.html"
               class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
               title="Về trang quản trị"
               aria-label="Quay về trang quản trị">

                <i class="fa-solid fa-arrow-left"></i>
            </a>
            <div class="flex items-center gap-2">

                <i class="fa-solid fa-house-medical text-blue-400"></i>

                <h1 class="font-black text-base text-white uppercase">Khải Hoàn <span class="text-blue-400 text-xs">POS</span></h1>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <a href="products.html" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900/60 text-slate-300 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors" title="Quản trị">

                <i class="fa-solid fa-table-columns text-sm"></i>
            </a>
            <a href="invoices.html" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900/60 text-slate-300 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors" title="Trả hàng">

                <i class="fa-solid fa-rotate-left text-sm"></i>
            </a>
            <span id="posTime" class="text-sm font-bold text-slate-300 tabular-nums"></span>
            <button data-action="toggle-dark-mode" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900/60 text-slate-300 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors">

                <i class="fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}" id="darkModeIcon"></i>
            </button>
        </div>
    </header>
    `;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function renderProductsMenu(activeTab) {
    const isActive = activeTab === 'products';
    const activeClasses = 'border-blue-500 text-blue-400 bg-slate-900/60 backdrop-blur-sm shadow-inner';
    const inactiveClasses = 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50';
    return `
    <div class="relative h-full group">
        <a href="products.html"
           class="flex items-center gap-1.5 px-3 xl:px-4 h-full text-[13px] font-bold transition-all border-b-2 ${isActive ? activeClasses : inactiveClasses}"
           ${isActive ? 'aria-current="page"' : ''}
           title="Hàng hóa">
            <i class="fa-solid fa-boxes-stacked"></i>
            <span class="hidden md:inline">Hàng hóa</span>
            <i class="fa-solid fa-chevron-down text-[10px] opacity-70 hidden md:inline"></i>
        </a>
        <div class="absolute left-0 top-full hidden group-hover:block pt-2 z-[120]">
            <div class="w-56 bg-slate-950/90 backdrop-blur-md border border-slate-850 rounded-xl shadow-2xl overflow-hidden py-1.5">
                <a href="products.html#products-list" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">Sản phẩm thường</a>
                <a href="products.html#doses-list" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">Thiết lập Thuốc liều</a>
                <a href="products.html#combos-list" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">Thiết lập Combo</a>
                <a href="products.html#categories-list" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">Quản lý nhóm hàng</a>
            </div>
        </div>
    </div>`;
}

function renderInventoryMenu(activeTab) {
    const isActive = activeTab === 'inventory';
    const activeClasses = 'border-blue-500 text-blue-400 bg-slate-900/60 backdrop-blur-sm shadow-inner';
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
            <div class="w-52 bg-slate-950/90 backdrop-blur-md border border-slate-850 rounded-xl shadow-2xl overflow-hidden py-1.5">

                <a href="inventory.html" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">Tồn kho hiện tại</a>

                <a href="inventory.html#receive" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">Tạo phiếu nhập hàng</a>

                <a href="inventory.html#stocktake" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">Tạo phiếu kiểm kê</a>
                
                <a href="inventory.html#stock-issue" class="block px-4 py-2.5 text-xs font-bold text-orange-400 hover:text-orange-300 hover:bg-slate-800/50 transition-colors border-t border-slate-900 flex items-center gap-2">
                    <i class="fa-solid fa-arrow-up-from-bracket text-orange-500"></i> Xuất nội bộ / Xuất hủy
                </a>
            </div>
        </div>
    </div>`;
}

function renderPurchaseMenu(activeTab) {
    const isActive = activeTab === 'purchase' || activeTab === 'suppliers';
    const activeClasses = 'border-blue-500 text-blue-400 bg-slate-900/60 backdrop-blur-sm shadow-inner';
    const inactiveClasses = 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50';
    return `
    <div class="relative h-full group">
        <a href="purchase.html"
           class="flex items-center gap-1.5 px-3 xl:px-4 h-full text-[13px] font-bold transition-all border-b-2 ${isActive ? activeClasses : inactiveClasses}"
           ${isActive ? 'aria-current="page"' : ''}
           title="Mua hàng & Đối tác">
            <i class="fa-solid fa-cart-flatbed"></i>
            <span class="hidden md:inline">Mua & Đối tác</span>
            <i class="fa-solid fa-chevron-down text-[10px] opacity-70 hidden md:inline"></i>
        </a>
        <div class="absolute left-0 top-full hidden group-hover:block pt-2 z-[120]">
            <div class="w-52 bg-slate-950/90 backdrop-blur-md border border-slate-850 rounded-xl shadow-2xl overflow-hidden py-1.5">
                <a href="purchase.html#orders" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors flex items-center gap-2">
                    <i class="fa-solid fa-cart-shopping text-blue-500 w-4"></i> Đặt hàng
                </a>
                <a href="purchase.html#suppliers" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors flex items-center gap-2 border-t border-slate-900">
                    <i class="fa-solid fa-handshake text-emerald-500 w-4"></i> Nhà cung cấp
                </a>
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
    const activeClasses   = 'border-blue-500 text-blue-400 bg-slate-900/60 backdrop-blur-sm shadow-inner';
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

window.handleLogout = () => {
    localStorage.removeItem('pos_user');
    window.location.href = 'login.html';
};
