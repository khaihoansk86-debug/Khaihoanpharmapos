export function renderHeader(activeMenuId) {
    const menus = [
        { id: 'dashboard', label: 'Tổng quan', link: '#' },
        { id: 'products', label: 'Hàng hóa', link: '../pages/products.html' },
        { id: 'orders', label: 'Đơn hàng', link: '#' },
        { id: 'employees', label: 'Nhân viên', link: '#' },
        { id: 'customers', label: 'Khách hàng', link: '#' },
        { id: 'cashbook', label: 'Sổ quỹ', link: '#' },
        { id: 'reports', label: 'Báo cáo', link: '#' }
    ];

    const menuHtml = menus.map(menu => {
        const isActive = menu.id === activeMenuId;
        const activeClass = isActive 
            ? 'text-white dark:text-blue-500 font-bold border-b-4 border-white dark:border-blue-500' 
            : 'text-blue-100 dark:text-slate-400 font-medium hover:text-white dark:hover:text-white border-b-2 border-transparent';
            
        return `<a href="${menu.link}" class="${activeClass} text-sm transition-colors duration-200 h-full flex items-center cursor-pointer px-1">${menu.label}</a>`;
    }).join('');

    return `
    <header class="sticky top-0 z-50 bg-blue-700 dark:bg-slate-950 border-b border-blue-800 dark:border-slate-800 transition-colors duration-300 shadow-md">
        <div class="container mx-auto px-4 h-16 flex items-center justify-between">
            <!-- Trái: Logo & Menu -->
            <div class="flex items-center gap-12 h-full">
                <!-- Logo -->
                <div class="flex items-center gap-2 text-white shrink-0">
                    <i class="fa-solid fa-notes-medical text-2xl"></i>
                    <h1 class="text-lg font-bold tracking-tight hidden lg:block text-white transition-colors">
                        Khải Hoàn<span class="text-blue-200 font-normal ml-1">POS</span>
                    </h1>
                </div>

                <!-- Menu Navigation -->
                <nav class="hidden md:flex items-center gap-8 h-full overflow-x-auto hide-scrollbar whitespace-nowrap">
                    ${menuHtml}
                </nav>
            </div>

            <!-- Phải: Search, Dark Mode & User -->
            <div class="flex items-center justify-end gap-4 shrink-0">
                <!-- Nút Dark Mode -->
                <button onclick="window.toggleDarkMode()" class="bg-blue-800/50 dark:bg-slate-800 text-blue-100 dark:text-slate-400 w-9 h-9 rounded-full flex items-center justify-center hover:bg-blue-800 dark:hover:bg-slate-700 transition-colors border border-blue-600 dark:border-slate-700">
                    <i id="theme-icon" class="fa-solid fa-moon"></i>
                </button>

                <!-- Cụm User -->
                <div class="flex items-center gap-3 bg-blue-800/50 dark:bg-slate-800 px-3 py-1.5 rounded-full transition-colors border border-blue-600 dark:border-slate-700">
                    <div class="flex items-center gap-2 cursor-pointer group">
                        <div class="w-6 h-6 bg-white dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xs">A</div>
                        <span class="text-sm font-semibold text-white dark:text-slate-300 group-hover:text-blue-100 dark:group-hover:text-white transition-colors hidden lg:block">Admin</span>
                    </div>
                    <div class="h-3 w-px bg-blue-600 dark:bg-slate-600"></div>
                    <button class="text-blue-200 dark:text-slate-400 hover:text-white dark:hover:text-red-400 transition-colors text-sm font-medium" title="Đăng xuất">Đăng xuất</button>
                </div>
            </div>
        </div>
    </header>
    `;
}

export function initLayout(activeMenuId) {
    const headerContainer = document.getElementById('app-header');
    if (headerContainer) {
        headerContainer.innerHTML = renderHeader(activeMenuId);
    }
}
