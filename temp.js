(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });

  // js/core/supabase.js
  var import_esm = __require("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  var SUPABASE_URL = "https://iejgtdcdzababydaqjef.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1";
  var supabaseClient = null;
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      supabaseClient = (0, import_esm.createClient)(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
      console.error("L\u1ED7i kh\u1EDFi t\u1EA1o Supabase:", error);
    }
  }

  // js/components/layout.js
  function initLayout(pageType = "admin", activeTab = "products") {
    const styleId = "robot-minimalist-styles";
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = `
            /* Robot Minimalist & Glassmorphism Global Styles */
            :root {
                --glass-bg: rgba(255, 255, 255, 0.78);
                --glass-bg-dark: rgba(2, 6, 23, 0.4);
                --glass-border: rgba(148, 163, 184, 0.45);
                --glass-border-dark: rgba(51, 65, 85, 0.5);
                --tech-glow: 0 0 15px rgba(59, 130, 246, 0.15);
                --tech-glow-emerald: 0 0 15px rgba(16, 185, 129, 0.15);
            }

            body {
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                min-height: 100vh;
            }

            /* Make app-surface transparent to inherit body background */
            .app-surface {
                background: transparent !important;
            }

            /* Minimalist Outline Icons Override */
            .fa-solid, .fas {
                font-family: "Font Awesome 6 Free", "FontAwesome" !important;
                font-weight: 400 !important;
            }
            .dark body {
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
            }
            @keyframes flowBackground {
                0% {
                    background-position: 0% 0%, 100% 100%, 20% 10%, 80% 90%, 0px 0px;
                }
                50% {
                    background-position: 50% 80%, 30% 20%, 70% 60%, 10% 30%, 12px 12px;
                }
                100% {
                    background-position: 100% 100%, 0% 0%, 10% 80%, 90% 15%, 24px 24px;
                }
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
                border-color: rgba(148, 163, 184, 0.3) !important;
            }
            .dark .tech-border, .dark hr, .dark .border-b, .dark .border-t, .dark .divide-y > * {
                border-color: rgba(51, 65, 85, 0.45) !important;
            }

            /* Custom modern glass inputs */
            .input, select.input, textarea.input, input[type="text"], input[type="password"], input[type="number"], select {
                background: rgba(248, 250, 252, 0.6) !important;
                backdrop-filter: blur(4px);
                border: 1px solid rgba(148, 163, 184, 0.45) !important;
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

            /* Selectors to make slate-100 search wrappers pop and stand out beautifully in light mode */
            .bg-slate-100:has(input[type="text"]),
            .bg-slate-100:has(input[id*="Search"]),
            div.flex-1.flex.items-center.gap-3.bg-slate-100,
            div[class*="bg-slate-100"][class*="rounded-xl"]:has(input) {
                border: 1.5px solid rgba(148, 163, 184, 0.45) !important;
                background-color: rgba(255, 255, 255, 0.95) !important;
            }
            .dark .bg-slate-100:has(input[type="text"]),
            .dark .bg-slate-100:has(input[id*="Search"]),
            .dark div.flex-1.flex.items-center.gap-3.bg-slate-100,
            .dark div[class*="bg-slate-100"][class*="rounded-xl"]:has(input) {
                border: 1.5px solid var(--glass-border-dark) !important;
                background-color: rgba(15, 23, 42, 0.6) !important;
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
                border-bottom: 2px solid rgba(148, 163, 184, 0.5) !important;
                padding-top: 10px !important;
                padding-bottom: 10px !important;
            }
            .dark thead th {
                background: rgba(2, 6, 23, 0.4) !important;
                border-bottom: 2px solid rgba(51, 65, 85, 0.7) !important;
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

            /* General Table cells dividing border enhancements */
            table td {
                border-bottom: 1px solid rgba(148, 163, 184, 0.25) !important;
            }
            .dark table td {
                border-bottom: 1px solid rgba(51, 65, 85, 0.35) !important;
            }

            /* Tech diagonal capsule background styling */
            .tech-bg-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: -2;
                overflow: hidden;
                
                background-color: #f5f7fb !important;
                background-image: 
                    radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.16) 0%, transparent 45%),
                    radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.14) 0%, transparent 45%),
                    radial-gradient(circle at 50% 15%, rgba(139, 92, 246, 0.12) 0%, transparent 35%),
                    radial-gradient(circle at 15% 85%, rgba(244, 63, 94, 0.1) 0%, transparent 35%),
                    radial-gradient(circle, rgba(148, 163, 184, 0.18) 1px, transparent 1px) !important;
                background-size: 150% 150%, 150% 150%, 150% 150%, 150% 150%, 24px 24px !important;
                animation: flowBackground 45s ease-in-out infinite alternate !important;
                transition: background-color 0.3s ease;
            }

            .dark .tech-bg-container {
                background-color: #020617 !important;
                background-image: 
                    radial-gradient(circle at 10% 20%, rgba(56, 189, 248, 0.12) 0%, transparent 45%),
                    radial-gradient(circle at 90% 80%, rgba(52, 211, 153, 0.1) 0%, transparent 45%),
                    radial-gradient(circle at 50% 15%, rgba(167, 139, 250, 0.1) 0%, transparent 35%),
                    radial-gradient(circle at 15% 85%, rgba(251, 113, 133, 0.08) 0%, transparent 35%),
                    radial-gradient(circle, rgba(148, 163, 184, 0.1) 1px, transparent 1px) !important;
                background-size: 150% 150%, 150% 150%, 150% 150%, 150% 150%, 24px 24px !important;
            }

            .tech-capsule {
                position: absolute;
                border-radius: 9999px;
                transform: rotate(-45deg);
                filter: blur(2px);
                animation: floatDiagonal 30s linear infinite;
                transform-origin: top left;
                box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
            }

            .capsule-1 {
                width: 12px;
                height: 240px;
                top: -120px;
                left: 10%;
                background: linear-gradient(to bottom, rgba(59, 130, 246, 0.28), rgba(96, 165, 250, 0.02)) !important;
                animation-duration: 25s;
                animation-delay: 0s;
            }
            .capsule-2 {
                width: 20px;
                height: 380px;
                top: -200px;
                left: 40%;
                background: linear-gradient(to bottom, rgba(16, 185, 129, 0.24), rgba(52, 211, 153, 0.02)) !important;
                animation-duration: 38s;
                animation-delay: -8s;
            }
            .capsule-3 {
                width: 8px;
                height: 160px;
                top: -80px;
                left: 70%;
                background: linear-gradient(to bottom, rgba(139, 92, 246, 0.24), rgba(167, 139, 250, 0.02)) !important;
                animation-duration: 30s;
                animation-delay: -15s;
            }
            .capsule-4 {
                width: 24px;
                height: 480px;
                top: -240px;
                left: 25%;
                background: linear-gradient(to bottom, rgba(236, 72, 153, 0.22), rgba(244, 63, 94, 0.02)) !important;
                animation-duration: 45s;
                animation-delay: -4s;
            }
            .capsule-5 {
                width: 14px;
                height: 280px;
                top: -140px;
                left: 55%;
                background: linear-gradient(to bottom, rgba(59, 130, 246, 0.24), rgba(16, 185, 129, 0.02)) !important;
                animation-duration: 28s;
                animation-delay: -22s;
            }
            .capsule-6 {
                width: 10px;
                height: 200px;
                top: -100px;
                left: 85%;
                background: linear-gradient(to bottom, rgba(139, 92, 246, 0.24), rgba(59, 130, 246, 0.02)) !important;
                animation-duration: 34s;
                animation-delay: -10s;
            }

            .dark .capsule-1 {
                background: linear-gradient(to bottom, rgba(56, 189, 248, 0.24), rgba(56, 189, 248, 0.02)) !important;
            }
            .dark .capsule-2 {
                background: linear-gradient(to bottom, rgba(52, 211, 153, 0.2), rgba(52, 211, 153, 0.02)) !important;
            }
            .dark .capsule-3 {
                background: linear-gradient(to bottom, rgba(167, 139, 250, 0.18), rgba(167, 139, 250, 0.02)) !important;
            }
            .dark .capsule-4 {
                background: linear-gradient(to bottom, rgba(251, 113, 133, 0.18), rgba(251, 113, 133, 0.02)) !important;
            }
            .dark .capsule-5 {
                background: linear-gradient(to bottom, rgba(56, 189, 248, 0.18), rgba(52, 211, 153, 0.02)) !important;
            }
            .dark .capsule-6 {
                background: linear-gradient(to bottom, rgba(167, 139, 250, 0.18), rgba(56, 189, 248, 0.02)) !important;
            }

            @keyframes floatDiagonal {
                0% {
                    transform: translateY(-400px) translateX(-400px) rotate(-45deg);
                    opacity: 0;
                }
                15% {
                    opacity: 0.8;
                }
                85% {
                    opacity: 0.8;
                }
                100% {
                    transform: translateY(110vh) translateX(110vw) rotate(-45deg);
                    opacity: 0;
                }
            }
        `;
      document.head.appendChild(styleEl);
    }
    if (!document.getElementById("dynamic-tech-bg")) {
      const techBg = document.createElement("div");
      techBg.id = "dynamic-tech-bg";
      techBg.className = "tech-bg-container";
      techBg.innerHTML = `
            <div class="tech-capsule capsule-1"></div>
            <div class="tech-capsule capsule-2"></div>
            <div class="tech-capsule capsule-3"></div>
            <div class="tech-capsule capsule-4"></div>
            <div class="tech-capsule capsule-5"></div>
            <div class="tech-capsule capsule-6"></div>
        `;
      if (document.body) {
        document.body.insertBefore(techBg, document.body.firstChild);
      } else {
        window.addEventListener("DOMContentLoaded", () => {
          document.body.insertBefore(techBg, document.body.firstChild);
        });
      }
    }
    const userStr2 = localStorage.getItem("pos_user");
    if (!userStr2 && !window.location.href.includes("login.html")) {
      window.location.href = "login.html";
      return;
    }
    const user2 = userStr2 ? JSON.parse(userStr2) : null;
    if (user2) {
      let userPerms = [];
      if (Array.isArray(user2.permissions) && user2.permissions.length > 0) {
        userPerms = user2.permissions;
      } else {
        if (user2.role === "admin") {
          userPerms = [
            "access_pos",
            "access_products",
            "manage_products",
            "access_invoices",
            "manage_invoices",
            "access_inventory",
            "manage_inventory",
            "access_employees",
            "access_payroll",
            "access_overview",
            "access_customers",
            "access_suppliers",
            "access_settings"
          ];
        } else if (user2.role === "manager") {
          userPerms = [
            "access_pos",
            "access_products",
            "manage_products",
            "access_invoices",
            "access_inventory",
            "manage_inventory",
            "access_payroll",
            "access_customers",
            "access_suppliers",
            "access_overview"
          ];
        } else {
          userPerms = ["access_pos", "access_products", "access_invoices", "access_customers", "access_overview"];
        }
      }
      if (user2.role === "admin" || user2.role === "manager" || user2.role === "staff") {
        if (!userPerms.includes("access_overview")) {
          userPerms = [...userPerms, "access_overview"];
        }
      }
      const permissionMap = {
        "products": "access_products",
        "invoices": "access_invoices",
        "inventory": "access_inventory",
        "customers": "access_customers",
        "employees": ["access_employees", "manage_shifts", "access_payroll"],
        "overview": "access_overview",
        "purchase": "access_suppliers",
        "suppliers": "access_suppliers",
        "settings": "access_settings",
        "pos": "access_pos",
        "logs": "access_settings"
      };
      const requiredPerm = permissionMap[activeTab];
      const hasRequiredPerm = Array.isArray(requiredPerm) ? requiredPerm.some((permission) => userPerms.includes(permission)) : !requiredPerm || userPerms.includes(requiredPerm);
      if (!hasRequiredPerm) {
        alert("T\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp trang n\xE0y!");
        if (userPerms.includes("access_pos")) {
          window.location.href = "pos.html";
        } else if (userPerms.includes("access_products")) {
          window.location.href = "products.html";
        } else {
          localStorage.removeItem("pos_user");
          window.location.href = "login.html";
        }
        return;
      }
    }
    const headerContainer = document.getElementById("app-header");
    if (headerContainer) {
      if (pageType === "pos") {
        headerContainer.innerHTML = renderPOSHeader();
      } else {
        headerContainer.innerHTML = renderAdminHeader(activeTab);
      }
      bindLayoutEvents();
    }
    const isDark = localStorage.getItem("darkMode") === "true";
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then((reg) => console.log("SW: \u0110\xE3 \u0111\u0103ng k\xFD th\xE0nh c\xF4ng", reg.scope)).catch((err) => console.log("SW: L\u1ED7i \u0111\u0103ng k\xFD", err));
      });
    }
    if (user2) {
      setTimeout(() => {
        const nameEl = document.getElementById("headerUserName");
        if (nameEl) nameEl.textContent = user2.name;
      }, 50);
    }
  }
  function renderAdminHeader(activeTab = "products") {
    const isDark = localStorage.getItem("darkMode") === "true";
    const userStr2 = localStorage.getItem("pos_user");
    const user2 = userStr2 ? JSON.parse(userStr2) : { role: "staff" };
    let userPerms = [];
    if (user2 && Array.isArray(user2.permissions) && user2.permissions.length > 0) {
      userPerms = user2.permissions;
    } else {
      if (user2.role === "admin") {
        userPerms = [
          "access_pos",
          "access_products",
          "manage_products",
          "access_invoices",
          "manage_invoices",
          "access_inventory",
          "manage_inventory",
          "access_employees",
          "access_payroll",
          "access_overview",
          "access_customers",
          "access_suppliers",
          "access_settings"
        ];
      } else if (user2.role === "manager") {
        userPerms = [
          "access_pos",
          "access_products",
          "manage_products",
          "access_invoices",
          "access_inventory",
          "manage_inventory",
          "access_payroll",
          "access_customers",
          "access_suppliers",
          "access_overview"
        ];
      } else {
        userPerms = ["access_pos", "access_products", "access_invoices", "access_customers", "access_overview"];
      }
    }
    if (user2.role === "admin" || user2.role === "manager" || user2.role === "staff") {
      if (!userPerms.includes("access_overview")) {
        userPerms = [...userPerms, "access_overview"];
      }
    }
    const hasPerm = (p) => {
      if (p === "access_employees") {
        return userPerms.includes("access_employees") || userPerms.includes("manage_shifts") || userPerms.includes("access_payroll");
      }
      return userPerms.includes(p);
    };
    return `
    <header class="sticky top-0 z-[100] w-full bg-slate-950/85 dark:bg-slate-950/85 backdrop-blur-md text-white h-14 flex items-center justify-between px-4 border-b border-slate-800/80 transition-all duration-300">
        <div class="flex items-center gap-6 h-full">
            <!-- Logo -->
            <a href="${hasPerm("access_products") ? "products.html" : "pos.html"}" class="flex items-center gap-2 mr-4 shrink-0 group">
                <i class="fa-solid fa-house-medical text-blue-400 text-xl group-hover:text-blue-300 transition-colors"></i>
                <span class="font-black tracking-tighter uppercase text-sm hidden sm:block">Kh\u1EA3i Ho\xE0n</span>
            </a>

            <!-- Mobile Navigation Menu -->
            <details id="mobileNavMenu" class="lg:hidden relative h-full flex items-center ml-2">
                <summary class="flex items-center justify-center text-slate-300 hover:text-white w-9 h-9 cursor-pointer list-none rounded-lg border border-slate-800 bg-slate-900/50 transition-colors">
                    <i class="fa-solid fa-bars text-base"></i>
                </summary>
                <div class="absolute top-full left-0 mt-2 w-56 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl z-[120] flex flex-col py-2 gap-1">
                    ${hasPerm("access_products") ? renderMobileTab("products", "fa-box", "H\xE0ng h\xF3a", activeTab === "products") : ""}
                    ${hasPerm("access_invoices") ? renderMobileTab("invoices", "fa-file-invoice-dollar", "H\xF3a \u0111\u01A1n & S\u1ED5 qu\u1EF9", activeTab === "invoices") : ""}
                    ${hasPerm("access_inventory") ? renderMobileTab("inventory", "fa-warehouse", "Kho h\xE0ng", activeTab === "inventory") : ""}
                    ${hasPerm("access_customers") ? renderMobileTab("customers", "fa-user-group", "Kh\xE1ch h\xE0ng", activeTab === "customers") : ""}
                    ${hasPerm("access_employees") ? renderMobileTab("employees", "fa-user-clock", "Nh\xE2n vi\xEAn", activeTab === "employees") : ""}
                    ${hasPerm("access_overview") ? renderMobileTab("overview", "fa-chart-pie", "T\u1ED5ng quan", activeTab === "overview") : ""}
                    ${hasPerm("access_suppliers") ? renderMobileTab("suppliers", "fa-truck-field", "Nh\u1EADp h\xE0ng", activeTab === "suppliers") : ""}
                    ${hasPerm("access_settings") ? renderMobileTab("settings", "fa-gear", "C\xE0i \u0111\u1EB7t", activeTab === "settings") : ""}
                    ${user2.role === "admin" || user2.role === "manager" ? renderMobileTab("logs", "fa-clock-rotate-left", "Nh\u1EADt k\xFD ho\u1EA1t \u0111\u1ED9ng", activeTab === "logs") : ""}
                </div>
            </details>

            <!-- Desktop Navigation tabs -->
            <nav class="hidden lg:flex items-center h-full gap-0.5" aria-label="Menu ch\xEDnh">
                ${hasPerm("access_products") ? renderProductsMenu(activeTab) : ""}
                ${hasPerm("access_invoices") ? renderTab("invoices", "fa-file-invoice-dollar", "H\xF3a \u0111\u01A1n & S\u1ED5 qu\u1EF9", activeTab === "invoices", true) : ""}
                ${hasPerm("access_inventory") ? renderInventoryMenu(activeTab) : ""}
                ${hasPerm("access_customers") ? renderTab("customers", "fa-user-group", "Kh\xE1ch h\xE0ng", activeTab === "customers", true) : ""}
                ${hasPerm("access_employees") ? renderTab("employees", "fa-user-clock", "Nh\xE2n vi\xEAn", activeTab === "employees", true) : ""}
                ${hasPerm("access_overview") ? renderTab("overview", "fa-chart-pie", "T\u1ED5ng quan", activeTab === "overview", true) : ""}
                ${hasPerm("access_suppliers") ? renderPurchaseMenu(activeTab) : ""}
                ${hasPerm("access_settings") ? renderTab("settings", "fa-gear", "C\xE0i \u0111\u1EB7t", activeTab === "settings", true) : ""}
            </nav>
        </div>

        <div class="flex items-center gap-3">
            <!-- User Info (Auth) -->
            <div id="headerUserInfo" class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 backdrop-blur-sm text-sm font-bold border border-slate-800">
                <i class="fa-solid fa-user-circle text-slate-400"></i>
                <span id="headerUserName" class="text-slate-200">${user2.name || "User"}</span>
                <button onclick="window.openQuickUserSwitchModal()" class="ml-1.5 text-blue-400 hover:text-blue-300 transition-colors animate-pulse" title="Chuy\u1EC3n nhanh t\xE0i kho\u1EA3n">
                    <i class="fa-solid fa-arrows-rotate"></i>
                </button>
                <button onclick="window.handleLogout()" class="ml-2 text-slate-400 hover:text-red-400 transition-colors" title="\u0110\u0103ng xu\u1EA5t">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>

            <!-- Nh\u1EADt k\xFD ho\u1EA1t \u0111\u1ED9ng (admin & manager only) -->
            ${user2.role === "admin" || user2.role === "manager" ? `
            <a href="logs.html"
               class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-800 text-slate-300 hover:text-white ${activeTab === "logs" ? "bg-slate-800 text-white" : ""}"
               title="Nh\u1EADt k\xFD ho\u1EA1t \u0111\u1ED9ng"
               aria-label="Nh\u1EADt k\xFD ho\u1EA1t \u0111\u1ED9ng">
                <i class="fa-solid fa-clock-rotate-left text-sm"></i>
            </a>
            ` : ""}

            <!-- Dark mode toggle -->
            <button data-action="toggle-dark-mode"

                class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-800"

                title="Ch\u1EBF \u0111\u1ED9 t\u1ED1i/s\xE1ng"

                aria-label="Chuy\u1EC3n ch\u1EBF \u0111\u1ED9 t\u1ED1i s\xE1ng">

                <i class="fa-solid ${isDark ? "fa-sun" : "fa-moon"} text-sm" id="darkModeIcon"></i>
            </button>

            <div class="h-6 w-px bg-slate-800"></div>

            <!-- N\xFAt B\xE1n h\xE0ng -->
            <a href="pos.html"
               class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20 border border-blue-500/30"
               aria-label="\u0110\u1EBFn trang b\xE1n h\xE0ng">

                <i class="fa-solid fa-cash-register"></i>

                <span class="hidden sm:inline">B\xE1n h\xE0ng</span>
            </a>

            <!-- Avatar -->
            <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden shrink-0" title="Qu\u1EA3n tr\u1ECB vi\xEAn">

                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Admin" loading="lazy">
            </div>
        </div>
    </header>
    `;
  }
  function renderPOSHeader() {
    const isDark = localStorage.getItem("darkMode") === "true";
    return `
    <header class="sticky top-0 z-[100] w-full bg-slate-950/85 dark:bg-slate-950/85 backdrop-blur-md text-white h-14 flex items-center justify-between px-4 border-b border-slate-800/80 transition-all duration-300">
        <div class="flex items-center gap-3">
            <a href="products.html"
               class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
               title="V\u1EC1 trang qu\u1EA3n tr\u1ECB"
               aria-label="Quay v\u1EC1 trang qu\u1EA3n tr\u1ECB">

                <i class="fa-solid fa-arrow-left"></i>
            </a>
            <div class="flex items-center gap-2">

                <i class="fa-solid fa-house-medical text-blue-400"></i>

                <h1 class="font-black text-base text-white uppercase">Kh\u1EA3i Ho\xE0n <span class="text-blue-400 text-xs">POS</span></h1>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <a href="products.html" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900/60 text-slate-300 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors" title="Qu\u1EA3n tr\u1ECB">

                <i class="fa-solid fa-table-columns text-sm"></i>
            </a>
            <a href="invoices.html" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900/60 text-slate-300 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors" title="Tr\u1EA3 h\xE0ng">

                <i class="fa-solid fa-rotate-left text-sm"></i>
            </a>
            <div id="posActiveShiftContainer" class="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-bold mr-2 text-slate-300">
                <span class="text-slate-500">Ca hi\u1EC7n t\u1EA1i:</span>
                <span id="posActiveShiftName" class="text-blue-400">--</span>
                <button id="posEndShiftBtn" onclick="window.endCurrentShift()" class="ml-2 bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded transition-all text-[10px]" title="K\u1EBFt th\xFAc ca n\xE0y \u0111\u1EC3 chuy\u1EC3n sang ca ti\u1EBFp theo">K\u1EBFt ca</button>
            </div>
            <span id="posTime" class="text-sm font-bold text-slate-300 tabular-nums"></span>
            <button data-action="toggle-dark-mode" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900/60 text-slate-300 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors">

                <i class="fa-solid ${isDark ? "fa-sun" : "fa-moon"}" id="darkModeIcon"></i>
            </button>
        </div>
    </header>
    `;
  }
  function renderProductsMenu(activeTab) {
    const isActive = activeTab === "products";
    const activeClasses = "border-blue-500 text-blue-400 bg-slate-900/60 backdrop-blur-sm shadow-inner";
    const inactiveClasses = "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50";
    return `
    <div class="relative h-full group">
        <a href="products.html"
           class="flex items-center gap-1.5 px-3 xl:px-4 h-full text-[13px] font-bold transition-all border-b-2 ${isActive ? activeClasses : inactiveClasses}"
           ${isActive ? 'aria-current="page"' : ""}
           title="H\xE0ng h\xF3a">
            <i class="fa-solid fa-boxes-stacked"></i>
            <span class="hidden md:inline">H\xE0ng h\xF3a</span>
            <i class="fa-solid fa-chevron-down text-[10px] opacity-70 hidden md:inline"></i>
        </a>
        <div class="absolute left-0 top-full hidden group-hover:block pt-2 z-[120]">
            <div class="w-64 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-2 flex flex-col gap-1">
                <div class="px-3 py-1.5 text-[10px] font-black uppercase text-slate-500 tracking-wider">Danh m\u1EE5c h\xE0ng h\xF3a</div>
                <a href="products.html#products-list" class="block px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/40 rounded-lg transition-colors">
                    <i class="fa-solid fa-list-ul mr-1.5 opacity-70"></i> S\u1EA3n ph\u1EA9m th\u01B0\u1EDDng
                </a>
                <a href="products.html#doses-list" class="block px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/40 rounded-lg transition-colors">
                    <i class="fa-solid fa-notes-medical mr-1.5 opacity-70"></i> Thi\u1EBFt l\u1EADp Thu\u1ED1c li\u1EC1u
                </a>
                <a href="products.html#combos-list" class="block px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/40 rounded-lg transition-colors">
                    <i class="fa-solid fa-layer-group mr-1.5 opacity-70"></i> Thi\u1EBFt l\u1EADp Combo
                </a>
                <a href="products.html#categories-list" class="block px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/40 rounded-lg transition-colors">
                    <i class="fa-solid fa-folder-tree mr-1.5 opacity-70"></i> Qu\u1EA3n l\xFD nh\xF3m h\xE0ng
                </a>
                
                <a href="products.html#onetime-list" class="mt-1 p-3 rounded-xl bg-gradient-to-br from-emerald-950/60 to-teal-950/40 border border-emerald-500/20 hover:border-emerald-500/50 hover:from-emerald-900/50 hover:to-teal-900/40 text-emerald-400 hover:text-emerald-350 transition-all flex flex-col gap-1.5 group/quick">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-black flex items-center gap-1.5">
                            <i class="fa-solid fa-bolt text-emerald-400 animate-pulse group-hover/quick:scale-110 transition-transform"></i>
                            Nh\u1EADp nhanh h\xE0ng 1 l\u1EA7n
                        </span>
                        <span class="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">T\u1ED1i \u01B0u</span>
                    </div>
                    <p class="text-[10px] text-slate-400 font-medium leading-relaxed">
                        T\u1EF1 \u0111\u1ED9ng x\xF3a s\u1EA3n ph\u1EA9m kh\u1ECFi danh m\u1EE5c ngay khi b\xE1n h\u1EBFt.
                    </p>
                </a>
            </div>
        </div>
    </div>`;
  }
  function renderInventoryMenu(activeTab) {
    const isActive = activeTab === "inventory";
    const activeClasses = "border-blue-500 text-blue-400 bg-slate-900/60 backdrop-blur-sm shadow-inner";
    const inactiveClasses = "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50";
    return `
    <div class="relative h-full group">
        <a href="inventory.html"
           class="flex items-center gap-1.5 px-3 xl:px-4 h-full text-[13px] font-bold transition-all border-b-2 ${isActive ? activeClasses : inactiveClasses}"
           ${isActive ? 'aria-current="page"' : ""}
           title="T\u1ED3n kho">
            <i class="fa-solid fa-warehouse"></i>
            <span class="hidden md:inline">T\u1ED3n kho</span>
            <i class="fa-solid fa-chevron-down text-[10px] opacity-70 hidden md:inline"></i>
        </a>
        <div class="absolute left-0 top-full hidden group-hover:block pt-2 z-[120]">
            <div class="w-52 bg-slate-950/90 backdrop-blur-md border border-slate-850 rounded-xl shadow-2xl overflow-hidden py-1.5">

                <a href="inventory.html" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">T\u1ED3n kho hi\u1EC7n t\u1EA1i</a>

                <a href="inventory.html#receive" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">T\u1EA1o phi\u1EBFu nh\u1EADp h\xE0ng</a>

                <a href="inventory.html#stocktake" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">T\u1EA1o phi\u1EBFu ki\u1EC3m k\xEA</a>
                
                <a href="inventory.html#stock-issue" class="block px-4 py-2.5 text-xs font-bold text-orange-400 hover:text-orange-300 hover:bg-slate-800/50 transition-colors border-t border-slate-900 flex items-center gap-2">
                    <i class="fa-solid fa-arrow-up-from-bracket text-orange-500"></i> Xu\u1EA5t n\u1ED9i b\u1ED9 / Xu\u1EA5t h\u1EE7y
                </a>
            </div>
        </div>
    </div>`;
  }
  function renderPurchaseMenu(activeTab) {
    const isActive = activeTab === "purchase" || activeTab === "suppliers";
    const activeClasses = "border-blue-500 text-blue-400 bg-slate-900/60 backdrop-blur-sm shadow-inner";
    const inactiveClasses = "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50";
    return `
    <div class="relative h-full group">
        <a href="purchase.html"
           class="flex items-center gap-1.5 px-3 xl:px-4 h-full text-[13px] font-bold transition-all border-b-2 ${isActive ? activeClasses : inactiveClasses}"
           ${isActive ? 'aria-current="page"' : ""}
           title="Mua h\xE0ng & \u0110\u1ED1i t\xE1c">
            <i class="fa-solid fa-cart-flatbed"></i>
            <span class="hidden md:inline">Mua & \u0110\u1ED1i t\xE1c</span>
            <i class="fa-solid fa-chevron-down text-[10px] opacity-70 hidden md:inline"></i>
        </a>
        <div class="absolute left-0 top-full hidden group-hover:block pt-2 z-[120]">
            <div class="w-52 bg-slate-950/90 backdrop-blur-md border border-slate-850 rounded-xl shadow-2xl overflow-hidden py-1.5">
                <a href="purchase.html#orders" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors flex items-center gap-2">
                    <i class="fa-solid fa-cart-shopping text-blue-500 w-4"></i> \u0110\u1EB7t h\xE0ng
                </a>
                <a href="purchase.html#suppliers" class="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors flex items-center gap-2 border-t border-slate-900">
                    <i class="fa-solid fa-handshake text-emerald-500 w-4"></i> Nh\xE0 cung c\u1EA5p
                </a>
            </div>
        </div>
    </div>`;
  }
  function renderTab(id, icon, label, isActive, enabled = true) {
    const activeClasses = "border-blue-500 text-blue-400 bg-slate-900/60 backdrop-blur-sm shadow-inner";
    const inactiveClasses = "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50";
    return `
    <a href="${id}.html"
       class="flex items-center gap-1.5 px-3 xl:px-4 h-full text-[13px] font-bold transition-all border-b-2 ${isActive ? activeClasses : inactiveClasses}"
       ${isActive ? 'aria-current="page"' : ""}
       title="${label}">
        <i class="fa-solid ${icon}"></i>
        <span class="hidden md:inline">${label}</span>
    </a>`;
  }
  function renderMobileTab(id, icon, label, isActive) {
    const activeClasses = "text-blue-400 bg-slate-900/80";
    const inactiveClasses = "text-slate-300 hover:text-white hover:bg-slate-800/50";
    return `
    <a href="${id}.html" class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-bold transition-all ${isActive ? activeClasses : inactiveClasses}">
        <i class="fa-solid ${icon} w-5 text-center"></i>
        <span>${label}</span>
    </a>`;
  }
  function bindLayoutEvents() {
    document.querySelectorAll('[data-action="toggle-dark-mode"]').forEach((button) => {
      button.addEventListener("click", toggleDarkMode);
    });
    document.addEventListener("click", (e) => {
      const mobileMenu = document.getElementById("mobileNavMenu");
      if (mobileMenu && mobileMenu.hasAttribute("open") && !mobileMenu.contains(e.target)) {
        mobileMenu.removeAttribute("open");
      }
    });
  }
  function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("darkMode", String(isDark));
    const icon = document.getElementById("darkModeIcon");
    if (icon) icon.className = isDark ? "fa-solid fa-sun text-lg" : "fa-solid fa-moon text-lg";
  }
  window.toggleDarkMode = toggleDarkMode;
  window.handleLogout = () => {
    localStorage.removeItem("pos_user");
    window.location.href = "login.html";
  };
  async function hashPassword(str) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  window.openQuickUserSwitchModal = async function() {
    let modal = document.getElementById("quickUserSwitchModal");
    if (modal) modal.remove();
    modal = document.createElement("div");
    modal.id = "quickUserSwitchModal";
    modal.className = "fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4";
    modal.innerHTML = `
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh]">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 class="text-base font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <i class="fa-solid fa-users text-blue-500"></i> Chuy\u1EC3n t\xE0i kho\u1EA3n nhanh
                </h3>
                <button onclick="document.getElementById('quickUserSwitchModal').remove()" class="text-slate-400 hover:text-slate-200 transition-colors">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>
            
            <div id="quickUserList" class="flex flex-col gap-2 overflow-y-auto pr-1 py-1 max-h-[40vh]">
                <div class="text-center py-4 text-slate-400">
                    <i class="fa-solid fa-circle-notch fa-spin text-xl mr-2 text-blue-500"></i> \u0110ang t\u1EA3i danh s\xE1ch nh\xE2n vi\xEAn...
                </div>
            </div>

            <div id="quickUserPasswordArea" class="hidden flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <p class="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    Nh\u1EADp m\u1EADt kh\u1EA9u cho <span id="quickSwitchTargetName" class="text-blue-500 dark:text-blue-400 font-black"></span>:
                </p>
                <div class="relative">
                    <input type="password" id="quickSwitchPassword" placeholder="Nh\u1EADp m\u1EADt kh\u1EA9u..." 
                           class="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-blue-500 font-bold">
                    <button id="btnToggleQuickSwitchPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                        <i class="fa-solid fa-eye text-sm"></i>
                    </button>
                </div>
                <div id="quickSwitchError" class="text-red-500 text-xs font-bold hidden"></div>
                <div class="flex gap-2 justify-end">
                    <button id="btnCancelQuickSwitch" class="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">H\u1EE7y</button>
                    <button id="btnConfirmQuickSwitch" class="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all">
                        X\xE1c nh\u1EADn
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const userListContainer = document.getElementById("quickUserList");
    const passwordArea = document.getElementById("quickUserPasswordArea");
    const targetNameSpan = document.getElementById("quickSwitchTargetName");
    const passwordInput = document.getElementById("quickSwitchPassword");
    const errorDiv = document.getElementById("quickSwitchError");
    const btnConfirm = document.getElementById("btnConfirmQuickSwitch");
    const btnCancel = document.getElementById("btnCancelQuickSwitch");
    const btnTogglePass = document.getElementById("btnToggleQuickSwitchPass");
    let selectedEmp = null;
    btnTogglePass.onclick = () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
      const icon = btnTogglePass.querySelector("i");
      icon.className = type === "password" ? "fa-solid fa-eye text-sm" : "fa-solid fa-eye-slash text-sm";
    };
    try {
      if (!supabaseClient) throw new Error("Supabase client is not connected.");
      const { data: employees, error } = await supabaseClient.from("employees").select("id, name, username, role, status").eq("status", "active").order("name", { ascending: true });
      if (error) throw error;
      if (!employees || employees.length === 0) {
        userListContainer.innerHTML = '<div class="text-center py-4 text-slate-500">Kh\xF4ng c\xF3 nh\xE2n vi\xEAn n\xE0o ho\u1EA1t \u0111\u1ED9ng.</div>';
        return;
      }
      userListContainer.innerHTML = "";
      employees.forEach((emp) => {
        const btn = document.createElement("button");
        btn.className = "flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800/60 hover:border-blue-500/50 hover:bg-blue-50/10 dark:hover:bg-blue-950/20 text-left transition-all group";
        btn.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 dark:text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-500 transition-colors">
                        ${emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="text-sm font-bold text-slate-700 dark:text-slate-200">${emp.name}</p>
                        <p class="text-[10px] text-slate-400 font-medium">${emp.role === "admin" ? "Qu\u1EA3n tr\u1ECB vi\xEAn" : emp.role === "manager" ? "Qu\u1EA3n l\xFD" : "Nh\xE2n vi\xEAn"}</p>
                    </div>
                </div>
                <i class="fa-solid fa-chevron-right text-xs text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-500 transition-all"></i>
            `;
        btn.onclick = () => {
          selectedEmp = emp;
          Array.from(userListContainer.children).forEach((child) => child.classList.remove("border-blue-500", "bg-blue-50/10", "dark:bg-blue-950/20"));
          btn.classList.add("border-blue-500", "bg-blue-50/10", "dark:bg-blue-950/20");
          targetNameSpan.textContent = emp.name;
          passwordInput.value = "";
          errorDiv.classList.add("hidden");
          passwordArea.classList.remove("hidden");
          passwordInput.focus();
        };
        userListContainer.appendChild(btn);
      });
    } catch (e) {
      userListContainer.innerHTML = `<div class="text-center py-4 text-red-500 text-xs font-bold">L\u1ED7i t\u1EA3i nh\xE2n vi\xEAn: ${e.message}</div>`;
    }
    btnCancel.onclick = () => {
      passwordArea.classList.add("hidden");
      selectedEmp = null;
      Array.from(userListContainer.children).forEach((child) => child.classList.remove("border-blue-500", "bg-blue-50/10", "dark:bg-blue-950/20"));
    };
    const performSwitch = async () => {
      if (!selectedEmp) return;
      const password = passwordInput.value;
      if (!password) {
        errorDiv.textContent = "Vui l\xF2ng nh\u1EADp m\u1EADt kh\u1EA9u!";
        errorDiv.classList.remove("hidden");
        return;
      }
      btnConfirm.disabled = true;
      btnConfirm.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> \u0110ang x\xE1c th\u1EF1c...';
      errorDiv.classList.add("hidden");
      try {
        const hashed = await hashPassword(password);
        let result = await supabaseClient.from("employees").select("id, name, username, role, status, permissions").eq("id", selectedEmp.id).eq("password_hash", hashed).single();
        let data = result.data;
        let error = result.error;
        if (error && (error.message?.includes("permissions") || error.code === "PGRST100" || String(error.status) === "400")) {
          const retry = await supabaseClient.from("employees").select("id, name, username, role, status").eq("id", selectedEmp.id).eq("password_hash", hashed).single();
          data = retry.data;
          error = retry.error;
          if (data) data.permissions = [];
        }
        if (error || !data) {
          throw new Error("M\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c!");
        }
        localStorage.setItem("pos_user", JSON.stringify(data));
        window.location.reload();
      } catch (err) {
        errorDiv.textContent = err.message || "L\u1ED7i k\u1EBFt n\u1ED1i.";
        errorDiv.classList.remove("hidden");
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = "X\xE1c nh\u1EADn";
      }
    };
    btnConfirm.onclick = performSwitch;
    passwordInput.onkeydown = (e) => {
      if (e.key === "Enter") performSwitch();
    };
  };

  // js/features/reports/overviewShiftService.js
  function getLocalTimeSeconds(dateStr) {
    const d = new Date(dateStr);
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  }
  function normalizeTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = String(timeStr).split(":").map(Number);
    const hrs = parts[0] || 0;
    const mins = parts[1] || 0;
    const secs = parts[2] || 0;
    return hrs * 3600 + mins * 60 + secs;
  }
  function isTimeInInterval(timeSec, startSec, endSec) {
    if (endSec >= startSec) {
      return timeSec >= startSec && timeSec < endSec;
    }
    return timeSec >= startSec || timeSec < endSec;
  }
  function toNumber(value) {
    const number2 = Number(value || 0);
    return Number.isFinite(number2) ? number2 : 0;
  }
  function dateKey(value) {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  function localSecondsFromDate(value) {
    const d = new Date(value);
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  }
  function buildShiftSegment(shift) {
    const startSec = normalizeTimeToSeconds(shift.start_time);
    const endSec = shift.is_closed && shift.closed_at ? localSecondsFromDate(shift.closed_at) : normalizeTimeToSeconds(shift.end_time);
    return {
      name: shift.shift_name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      startSec,
      endSec,
      revenue: 0
    };
  }
  function buildOverviewShiftsByDay({ keys = [], shiftData = [], orders = [] } = {}) {
    const shiftsByDay = /* @__PURE__ */ new Map();
    keys.forEach((key) => {
      const dayShifts = shiftData.filter((shift) => shift.shift_date === key && shift.status === "worked").map(buildShiftSegment).sort((a, b) => (a.start_time || "00:00:00").localeCompare(b.start_time || "00:00:00"));
      const dayOrders = orders.filter((order) => dateKey(order.created_at) === key);
      dayOrders.forEach((order) => {
        const orderTimeSec = getLocalTimeSeconds(order.created_at);
        const matchingShift = dayShifts.find((shift) => isTimeInInterval(orderTimeSec, shift.startSec, shift.endSec));
        if (matchingShift) {
          matchingShift.revenue += toNumber(order.total);
        }
      });
      shiftsByDay.set(key, dayShifts);
    });
    return shiftsByDay;
  }

  // js/features/products/comboRules.js
  function parseComboDescription(description) {
    if (!description) return null;
    try {
      const parsed = typeof description === "string" ? JSON.parse(description) : description;
      if (!parsed || parsed.isCombo !== true || !Array.isArray(parsed.items)) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }
  function expandComboItems(comboDefinition, parentQuantity = 1) {
    if (!comboDefinition?.items?.length) return [];
    const multiplier = Math.max(1, Number(parentQuantity || 1));
    return comboDefinition.items.map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      quantity: Math.max(0, Number(item.quantity || 0)) * multiplier
    }));
  }

  // js/features/reports/comboReportRules.js
  function safeNumber(value) {
    const number2 = Number(value || 0);
    return Number.isFinite(number2) ? number2 : 0;
  }
  function collectComboComponentIds(products = []) {
    const ids = /* @__PURE__ */ new Set();
    (products || []).forEach((product) => {
      const definition = parseComboDescription(product?.description);
      definition?.items?.forEach((item) => {
        if (item?.id) ids.add(item.id);
      });
    });
    return [...ids];
  }
  function buildComboDefinitionMap(products = []) {
    const comboDefinitionMap = /* @__PURE__ */ new Map();
    (products || []).forEach((product) => {
      const definition = parseComboDescription(product?.description);
      if (definition && product?.id) {
        comboDefinitionMap.set(product.id, definition);
      }
    });
    return comboDefinitionMap;
  }
  function estimateComboCost({ item, comboDefinitionMap, unitCosts, sign = 1, visited = /* @__PURE__ */ new Set() }) {
    const productId = item?.product_id;
    if (!productId) return null;
    if (visited.has(productId)) {
      return { cost: 0, source: "missing" };
    }
    const comboDefinition = comboDefinitionMap.get(productId);
    if (!comboDefinition) return null;
    const nextVisited = new Set(visited);
    nextVisited.add(productId);
    let totalCost = 0;
    let hasMissingCost = false;
    const quantity = Math.abs(safeNumber(item?.quantity || 0));
    const expandedItems = expandComboItems(comboDefinition, quantity);
    expandedItems.forEach((component) => {
      const nestedCost = estimateComboCost({
        item: { product_id: component.id, quantity: component.quantity },
        comboDefinitionMap,
        unitCosts,
        sign: 1,
        visited: nextVisited
      });
      if (nestedCost) {
        totalCost += nestedCost.cost;
        hasMissingCost = hasMissingCost || nestedCost.source === "missing";
        return;
      }
      const unitKey = `${component.id}::${component.unit || ""}`;
      const unit = unitCosts.get(unitKey) || unitCosts.get(`${component.id}::__base__`);
      const unitCost = safeNumber(unit?.cost_price);
      if (unitCost > 0) {
        totalCost += unitCost * safeNumber(component.quantity);
      } else {
        hasMissingCost = true;
      }
    });
    return {
      cost: sign * totalCost,
      source: hasMissingCost ? "missing" : "combo"
    };
  }

  // js/features/reports/doseReportRules.js
  function isDoseReportLine(item = {}, lookups = {}) {
    const productId = item.product_id;
    const productCode = String(item.product_code || item.code || "");
    return lookups.isDoseProductMap?.get(productId) === true || lookups.isDoseRetailMap?.get(productId) === true || productCode.startsWith("DOSE-");
  }
  function isDosePackageSaleLine(item = {}, lookups = {}, isDoseOrderItem = false, revenue = 0) {
    const productId = item.product_id;
    const productCode = String(item.product_code || item.code || "");
    const isDoseRetailPackage = lookups.isDoseRetailMap?.get(productId) === true || productCode.startsWith("DOSE-");
    return isDoseRetailPackage;
  }
  function getDoseProductPerformanceValues({ revenue = 0, cost = 0, profit = 0, isDosePackageSale = false } = {}) {
    if (isDosePackageSale) {
      return {
        cost: 0,
        profit: Number(revenue || 0)
      };
    }
    return {
      cost: Number(cost || 0),
      profit: Number(profit || 0)
    };
  }
  function shouldCountMissingCostForReportLine({ costSource = "", isDosePackageSale = false } = {}) {
    return costSource === "missing" && isDosePackageSale !== true;
  }

  // js/features/inventory/internalIssueMetadata.js
  var INTERNAL_ISSUE_TARGET_TYPES = [
    { value: "staff", label: "Nh\xE2n vi\xEAn" },
    { value: "doctor", label: "B\xE1c s\u0129 / KTV" },
    { value: "department", label: "Ph\xF2ng / B\u1ED9 ph\u1EADn" },
    { value: "shared", label: "D\xF9ng chung" },
    { value: "other", label: "Kh\xE1c" }
  ];
  var TARGET_TYPE_MAP = new Map(INTERNAL_ISSUE_TARGET_TYPES.map((item) => [item.value, item.label]));
  var TARGET_TYPE_TAG = "ISSUE_TARGET_TYPE";
  var TARGET_NAME_TAG = "ISSUE_TARGET_NAME";
  function sanitizeTagValue(value) {
    return String(value || "").replace(/[\]\[]/g, " ").replace(/\s+/g, " ").trim();
  }
  function readTag(note, tagName) {
    const pattern = new RegExp(`\\[${tagName}:([^\\]]*)\\]`, "i");
    const match = String(note || "").match(pattern);
    return sanitizeTagValue(match?.[1] || "");
  }
  function stripTag(note, tagName) {
    const pattern = new RegExp(`\\s*\\[${tagName}:[^\\]]*\\]\\s*`, "gi");
    return String(note || "").replace(pattern, " ").replace(/\s+/g, " ").trim();
  }
  function getInternalIssueTargetLabel(targetType) {
    return TARGET_TYPE_MAP.get(targetType) || "Kh\xE1c";
  }
  function parseInternalIssueNote(note = "") {
    const targetType = readTag(note, TARGET_TYPE_TAG);
    const targetName = readTag(note, TARGET_NAME_TAG);
    const userNote = stripTag(stripTag(note, TARGET_TYPE_TAG), TARGET_NAME_TAG);
    return {
      rawNote: String(note || ""),
      userNote,
      targetType,
      targetName,
      targetLabel: getInternalIssueTargetLabel(targetType)
    };
  }

  // js/features/reports/reportAnalyticsRules.js
  var LOW_STOCK_THRESHOLD = 10;
  var POS_INVENTORY_REF_PREFIX = "[POS_ORDER:";
  function isRetailPOSMovement(m, orderById) {
    const note = String(m.note || "");
    if (!note.includes(POS_INVENTORY_REF_PREFIX)) return false;
    const match = note.match(/\[POS_ORDER:([^\]]+)\]/);
    if (!match) return true;
    const orderId = match[1];
    const order = orderById.get(orderId);
    if (order && order.order_type === "internal") {
      return false;
    }
    return true;
  }
  function toNumber2(value) {
    const number2 = Number(value || 0);
    return Number.isFinite(number2) ? number2 : 0;
  }
  function dateKey2(value) {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  function estimateItemCost(item, lookups) {
    const sign = toNumber2(item.total_price) < 0 ? -1 : 1;
    const comboCost = estimateComboCost({
      item,
      comboDefinitionMap: lookups.comboDefinitionMap,
      unitCosts: lookups.unitCosts,
      sign
    });
    if (comboCost) return comboCost;
    const quantity = Math.abs(toNumber2(item.quantity));
    const unit = lookups.unitCosts.get(`${item.product_id}::${item.unit_name || ""}`) || lookups.unitCosts.get(`${item.product_id}::__base__`);
    const conversionRate = toNumber2(unit?.conversion_rate) || 1;
    const batchCost = item.batch_id ? lookups.batchCosts.get(item.batch_id) : null;
    if (batchCost !== null && batchCost !== void 0 && batchCost > 0) {
      return { cost: sign * batchCost * conversionRate * quantity, source: "batch" };
    }
    const unitCost = toNumber2(unit?.cost_price);
    if (unitCost > 0) return { cost: sign * unitCost * quantity, source: "unit" };
    return { cost: 0, source: "missing" };
  }
  function emptySummary() {
    return {
      retailRevenue: 0,
      retailProfit: 0,
      retailInvoices: 0,
      retailItemsSold: 0,
      ecommerceRevenue: 0,
      ecommerceProfit: 0,
      ecommerceCost: 0,
      ecommerceInvoices: 0,
      ecommerceItemsSold: 0,
      internalExpense: 0,
      revenue: 0,
      grossProfit: 0,
      cost: 0,
      retailCost: 0,
      discounts: 0,
      invoices: 0,
      cancelledOrders: 0,
      returnOrders: 0,
      averageOrder: 0,
      itemsSold: 0,
      missingCostItems: 0,
      uniqueCustomers: 0,
      customers: /* @__PURE__ */ new Set(),
      unscheduledRetailRevenue: 0,
      dosePackageRevenue: 0,
      doseIngredientCost: 0,
      doseIngredientPOSCost: 0,
      doseIngredientInternalCost: 0,
      doseProfit: 0,
      doseItemsSold: 0
    };
  }
  function productKey(item) {
    return item.product_id || item.product_code || item.product_name;
  }
  function ensureProduct(map, item) {
    const key = productKey(item);
    if (!map.has(key)) {
      map.set(key, {
        key,
        productId: item.product_id,
        code: item.product_code || "",
        name: item.product_name || "Khong ro ten",
        unit: item.unit_name || "",
        quantity: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        invoices: /* @__PURE__ */ new Set(),
        missingCost: 0,
        stock: null,
        isLowStock: false
      });
    }
    return map.get(key);
  }
  function finalizeSummary(summary = emptySummary()) {
    const safeSummary = summary || emptySummary();
    const uniqueCustomers = safeSummary.customers instanceof Set ? safeSummary.customers.size : toNumber2(safeSummary.uniqueCustomers);
    return {
      ...safeSummary,
      averageOrder: safeSummary.invoices ? safeSummary.revenue / safeSummary.invoices : 0,
      uniqueCustomers,
      doseProfit: (safeSummary.dosePackageRevenue || 0) - (safeSummary.doseIngredientCost || 0),
      customers: void 0
    };
  }
  function finalizeProducts(productMap, stockByProduct) {
    return [...productMap.values()].map((product) => {
      const stock = product.productId ? stockByProduct.get(product.productId) : null;
      return {
        ...product,
        stock,
        isLowStock: stock !== null && stock !== void 0 && stock <= LOW_STOCK_THRESHOLD,
        invoiceCount: product.invoices.size,
        marginRate: product.revenue ? product.profit / product.revenue : 0,
        invoices: void 0
      };
    });
  }
  function buildAnalytics(orders, items, lookups, stockByProduct, range, orderTypeFilter = "all", shiftData = [], internalMovements = []) {
    const shiftsByDay = /* @__PURE__ */ new Map();
    const completedOrders = orders.filter((order) => order.status === "completed");
    const completedIds = new Set(completedOrders.map((order) => order.id));
    let completedItems = items.filter((item) => completedIds.has(item.order_id));
    const allDoseOrderIds = new Set(
      items.filter((item) => isDoseReportLine(item, lookups)).map((item) => item.order_id)
    );
    if (orderTypeFilter === "dose_cut") {
      completedItems = completedItems.filter((item) => allDoseOrderIds.has(item.order_id));
      const doseOrderIds = new Set(completedItems.map((item) => item.order_id));
      const filteredCompletedOrders = completedOrders.filter((order) => doseOrderIds.has(order.id));
      const filteredCompletedIds = new Set(filteredCompletedOrders.map((order) => order.id));
      completedIds.clear();
      filteredCompletedIds.forEach((id) => completedIds.add(id));
    }
    const useAllTab = orderTypeFilter === "all";
    if (useAllTab) {
      const retailAndDoseIds = new Set(
        completedOrders.filter((order) => order.order_type === "retail" || allDoseOrderIds.has(order.id)).map((order) => order.id)
      );
      completedItems = completedItems.filter((item) => retailAndDoseIds.has(item.order_id));
      completedIds.clear();
      retailAndDoseIds.forEach((id) => completedIds.add(id));
    }
    const orderById = new Map(completedOrders.filter((order) => completedIds.has(order.id)).map((order) => [order.id, order]));
    const allOrdersById = new Map(orders.map((o) => [o.id, o]));
    const daySummaries = new Map(range.keys.map((key) => [key, emptySummary()]));
    const dayProducts = new Map(range.keys.map((key) => [key, /* @__PURE__ */ new Map()]));
    const dayDoseIngredients = new Map(range.keys.map((key) => [key, /* @__PURE__ */ new Map()]));
    const platformsSummary = /* @__PURE__ */ new Map();
    const internalIssuesList = [];
    const internalIssuesSummary = {
      totalCost: 0,
      totalItems: 0,
      byReason: /* @__PURE__ */ new Map(),
      byTarget: /* @__PURE__ */ new Map()
    };
    const relevantCompletedOrders = completedOrders.filter((order) => completedIds.has(order.id));
    buildOverviewShiftsByDay({
      keys: range.keys,
      shiftData,
      orders: relevantCompletedOrders
    }).forEach((dayShifts, key) => shiftsByDay.set(key, dayShifts));
    let activeOrders = orders;
    if (orderTypeFilter === "dose_cut") {
      activeOrders = orders.filter((order) => allDoseOrderIds.has(order.id));
    }
    activeOrders.forEach((order) => {
      const key = dateKey2(order.created_at);
      const day = daySummaries.get(key);
      if (!day) return;
      if (order.status === "cancelled") day.cancelledOrders += 1;
      if (order.status !== "completed") return;
      const total = toNumber2(order.total);
      if (order.order_type === "internal") {
        if (orderTypeFilter === "internal") {
          day.revenue += total;
          day.invoices += 1;
          if (total < 0) day.returnOrders += 1;
        }
      } else if (order.order_type === "ecommerce") {
        day.ecommerceRevenue += total;
        day.ecommerceInvoices += 1;
        if (total < 0) day.returnOrders += 1;
      } else {
        const discount = toNumber2(order.discount);
        day.discounts += discount;
        day.invoices += 1;
        if (total < 0) day.returnOrders += 1;
        if (allDoseOrderIds.has(order.id)) {
          day.revenue -= discount;
          day.dosePackageRevenue -= discount;
          day.grossProfit -= discount;
        } else {
          day.retailInvoices += 1;
          day.revenue -= discount;
          day.retailRevenue -= discount;
          day.grossProfit -= discount;
          day.retailProfit -= discount;
        }
      }
      if (order.customer_phone) day.customers.add(order.customer_phone);
      if (order.order_type === "ecommerce" && order.ecommerce_platform) {
        const platform = order.ecommerce_platform;
        if (!platformsSummary.has(platform)) {
          platformsSummary.set(platform, { name: platform, revenue: 0, orders: 0 });
        }
        const pStat = platformsSummary.get(platform);
        pStat.revenue += total;
        pStat.orders += 1;
      }
    });
    completedItems.forEach((item) => {
      if (item.line_type === "combo_component") return;
      const order = orderById.get(item.order_id);
      const key = order ? dateKey2(order.created_at) : dateKey2(item.created_at);
      const day = daySummaries.get(key);
      const productMapForDay = dayProducts.get(key);
      const doseIngredientMapForDay = dayDoseIngredients.get(key);
      if (!day || !productMapForDay || !doseIngredientMapForDay) return;
      const revenue = toNumber2(item.total_price);
      const quantity = toNumber2(item.quantity);
      const costMeta = estimateItemCost(item, lookups);
      const profit = revenue - costMeta.cost;
      const isDosePackage = lookups.isDoseProductMap?.get(item.product_id) === true;
      const isDoseRetailPackage = lookups.isDoseRetailMap?.get(item.product_id) === true || item.product_code && item.product_code.startsWith("DOSE-");
      const isDoseOrderItem = allDoseOrderIds.has(item.order_id);
      const isDosePackageSale = isDosePackageSaleLine(item, lookups, isDoseOrderItem, revenue);
      const isEcommerceOrder = order && order.order_type === "ecommerce";
      const isInternalOrder = order && order.order_type === "internal";
      const isDoseIngredient = (isDosePackage === true || isDoseOrderItem === true && toNumber2(item.total_price) === 0) && !isDoseRetailPackage;
      if (orderTypeFilter === "dose_cut" && !isDosePackageSale && !isDoseIngredient) return;
      if (isInternalOrder) {
      } else if (isEcommerceOrder) {
        day.ecommerceProfit += profit;
        day.ecommerceItemsSold += quantity;
        day.ecommerceCost += costMeta.cost;
      } else {
        if (isDosePackageSale) {
          day.dosePackageRevenue += revenue;
          day.revenue += revenue;
          day.grossProfit += revenue;
          day.itemsSold += quantity;
          day.doseItemsSold = (day.doseItemsSold || 0) + quantity;
        } else if (isDoseIngredient) {
          day.doseIngredientCost += costMeta.cost;
          day.doseIngredientPOSCost = (day.doseIngredientPOSCost || 0) + costMeta.cost;
          day.cost += costMeta.cost;
          day.grossProfit -= costMeta.cost;
        } else if (isDosePackage) {
          day.revenue += revenue;
          day.retailRevenue += revenue;
          if (orderTypeFilter !== "all") day.retailProfit += revenue;
          day.grossProfit += revenue;
          day.itemsSold += quantity;
        } else {
          day.retailRevenue += revenue;
          day.retailCost += costMeta.cost;
          day.retailProfit += profit;
          day.revenue += revenue;
          day.cost += costMeta.cost;
          day.itemsSold += quantity;
          day.retailItemsSold = (day.retailItemsSold || 0) + quantity;
          day.grossProfit += profit;
        }
      }
      if (shouldCountMissingCostForReportLine({ costSource: costMeta.source, isDosePackageSale })) {
        day.missingCostItems += 1;
      }
      if (isDoseIngredient) {
        const ingredientProduct = ensureProduct(doseIngredientMapForDay, item);
        ingredientProduct.quantity += quantity;
        ingredientProduct.cost += costMeta.cost;
        ingredientProduct.profit -= costMeta.cost;
        ingredientProduct.invoices.add(item.order_id);
        if (costMeta.source === "missing") ingredientProduct.missingCost += 1;
      }
      let includeInProductTable = true;
      if (orderTypeFilter === "retail") {
        if (isDosePackage || isDoseRetailPackage || isEcommerceOrder || isInternalOrder) includeInProductTable = false;
      } else if (orderTypeFilter === "dose_cut") {
        if (!isDosePackageSale) includeInProductTable = false;
      } else if (orderTypeFilter === "ecommerce") {
        if (!isEcommerceOrder) includeInProductTable = false;
      }
      if (includeInProductTable) {
        const performanceValues = getDoseProductPerformanceValues({
          revenue,
          cost: costMeta.cost,
          profit,
          isDosePackageSale
        });
        const product = ensureProduct(productMapForDay, item);
        product.quantity += quantity;
        product.revenue += revenue;
        product.cost += performanceValues.cost;
        product.profit += performanceValues.profit;
        product.invoices.add(item.order_id);
        if (shouldCountMissingCostForReportLine({ costSource: costMeta.source, isDosePackageSale })) {
          product.missingCost += 1;
        }
      }
    });
    internalMovements.forEach((movement) => {
      const key = dateKey2(movement.created_at);
      const day = daySummaries.get(key);
      if (!day) return;
      const isPOSLinkedMovement = isRetailPOSMovement(movement, allOrdersById);
      const issuedQty = -toNumber2(movement.quantity_base);
      const cost = issuedQty * toNumber2(movement.cost_price);
      if (!isPOSLinkedMovement) day.internalExpense += cost;
      if (movement.reason === "dose_cutting" || movement.reason === "c\xE1\xBA\xAFt li\xE1\xBB\x81u thu\xE1\xBB\u2018c") {
        if (isPOSLinkedMovement) return;
        day.doseIngredientCost += cost;
        day.doseIngredientInternalCost = (day.doseIngredientInternalCost || 0) + cost;
        day.grossProfit -= cost;
        const ingredientMap = dayDoseIngredients.get(key);
        if (ingredientMap) {
          const movementItem = {
            product_id: movement.product_id,
            product_name: movement.products?.name || "Nguyen lieu thuoc lieu",
            product_code: movement.products?.product_code || "",
            unit_name: "",
            quantity: issuedQty,
            total_price: 0
          };
          const ingredientProduct = ensureProduct(ingredientMap, movementItem);
          ingredientProduct.quantity += issuedQty;
          ingredientProduct.cost += cost;
          ingredientProduct.profit -= cost;
          if (issuedQty > 0) ingredientProduct.invoices.add(`movement-${movement.created_at}-${movement.product_id || ""}`);
          if (toNumber2(movement.cost_price) <= 0 && issuedQty > 0) {
            ingredientProduct.missingCost += 1;
            day.missingCostItems += 1;
          }
        }
        day.retailProfit -= cost;
        day.grossProfit -= cost;
      }
      if (range.currentKeys.includes(key) && !isPOSLinkedMovement) {
        const parsedNote = parseInternalIssueNote(movement.note);
        const reason = movement.reason || "other";
        const targetName = parsedNote.targetName || parsedNote.targetLabel || "Kh\xF4ng x\xE1c \u0111\u1ECBnh";
        internalIssuesList.push({
          date: key,
          productName: movement.products?.name || "S\u1EA3n ph\u1EA9m kh\xF4ng r\xF5",
          productCode: movement.products?.product_code || "",
          quantity: issuedQty,
          costPrice: toNumber2(movement.cost_price),
          totalCost: cost,
          reason,
          targetName,
          rawNote: parsedNote.rawNote
        });
        internalIssuesSummary.totalCost += cost;
        internalIssuesSummary.totalItems += issuedQty;
        internalIssuesSummary.byReason.set(reason, (internalIssuesSummary.byReason.get(reason) || 0) + cost);
        internalIssuesSummary.byTarget.set(targetName, (internalIssuesSummary.byTarget.get(targetName) || 0) + cost);
      }
    });
    daySummaries.forEach((day, key) => {
      const dayShifts = shiftsByDay.get(key) || [];
      const shiftsTotal = dayShifts.reduce((sum, shift) => sum + toNumber2(shift.revenue), 0);
      const totalRevenueForTab = orderTypeFilter === "dose_cut" ? toNumber2(day.dosePackageRevenue || 0) : orderTypeFilter === "ecommerce" ? toNumber2(day.ecommerceRevenue || 0) : orderTypeFilter === "all" ? toNumber2(day.revenue || 0) : toNumber2(day.retailRevenue || 0);
      day.unscheduledRetailRevenue = Math.max(0, totalRevenueForTab - shiftsTotal);
    });
    function aggregateSummaries(summariesByDay, keys) {
      const agg = emptySummary();
      keys.forEach((key) => {
        const day = summariesByDay.get(key);
        if (!day) return;
        agg.retailRevenue += toNumber2(day.retailRevenue);
        agg.retailProfit += toNumber2(day.retailProfit);
        agg.retailCost += toNumber2(day.retailCost);
        agg.retailInvoices += toNumber2(day.retailInvoices);
        agg.ecommerceRevenue += toNumber2(day.ecommerceRevenue);
        agg.ecommerceProfit += toNumber2(day.ecommerceProfit);
        agg.ecommerceCost += toNumber2(day.ecommerceCost);
        agg.ecommerceItemsSold += toNumber2(day.ecommerceItemsSold);
        agg.internalExpense += toNumber2(day.internalExpense);
        agg.revenue += toNumber2(day.revenue);
        agg.grossProfit += toNumber2(day.grossProfit);
        agg.cost += toNumber2(day.cost);
        agg.discounts += toNumber2(day.discounts);
        agg.invoices += toNumber2(day.invoices);
        agg.cancelledOrders += toNumber2(day.cancelledOrders);
        agg.returnOrders += toNumber2(day.returnOrders);
        agg.itemsSold += toNumber2(day.itemsSold);
        agg.missingCostItems += toNumber2(day.missingCostItems);
        agg.unscheduledRetailRevenue += toNumber2(day.unscheduledRetailRevenue);
        agg.dosePackageRevenue += toNumber2(day.dosePackageRevenue);
        agg.doseIngredientCost += toNumber2(day.doseIngredientCost);
        agg.doseIngredientPOSCost += toNumber2(day.doseIngredientPOSCost);
        agg.doseIngredientInternalCost += toNumber2(day.doseIngredientInternalCost);
        agg.doseItemsSold += toNumber2(day.doseItemsSold);
        if (day.customers instanceof Set) {
          day.customers.forEach((customer) => agg.customers.add(customer));
        }
        agg.retailItemsSold += toNumber2(day.retailItemsSold);
        agg.ecommerceInvoices += toNumber2(day.ecommerceInvoices);
      });
      return finalizeSummary(agg);
    }
    const currentSummary = aggregateSummaries(daySummaries, range.currentKeys);
    const previousSummary = aggregateSummaries(daySummaries, range.previousKeys);
    const daily = range.currentKeys.map((key) => {
      const day = finalizeSummary(daySummaries.get(key));
      const dayShifts = shiftsByDay.get(key) || [];
      return {
        key,
        date: key,
        revenue: orderTypeFilter === "dose_cut" ? day.dosePackageRevenue || 0 : orderTypeFilter === "all" ? day.revenue || 0 : day.retailRevenue || 0,
        retailRevenue: day.retailRevenue,
        ecommerceRevenue: day.ecommerceRevenue,
        retailCost: day.retailCost,
        profit: day.grossProfit,
        invoices: day.invoices,
        itemsSold: day.itemsSold,
        cancelledOrders: day.cancelledOrders,
        returnOrders: day.returnOrders,
        shifts: dayShifts.map((shift) => ({
          name: shift.name,
          start_time: shift.start_time,
          end_time: shift.end_time,
          revenue: shift.revenue
        })),
        unscheduledRetailRevenue: day.unscheduledRetailRevenue || 0,
        dosePackageRevenue: day.dosePackageRevenue,
        doseIngredientCost: day.doseIngredientCost,
        doseIngredientPOSCost: day.doseIngredientPOSCost || 0,
        doseIngredientInternalCost: day.doseIngredientInternalCost || 0,
        doseProfit: day.doseProfit,
        retailItemsSold: day.retailItemsSold
      };
    });
    const rangeProductMap = /* @__PURE__ */ new Map();
    const rangeDoseIngredientMap = /* @__PURE__ */ new Map();
    range.currentKeys.forEach((key) => {
      const productMap = dayProducts.get(key) || /* @__PURE__ */ new Map();
      productMap.forEach((product) => {
        const existing = rangeProductMap.get(product.key) || {
          ...product,
          invoices: /* @__PURE__ */ new Set()
        };
        existing.quantity += product.quantity;
        existing.revenue += product.revenue;
        existing.cost += product.cost;
        existing.profit += product.profit;
        existing.missingCost += product.missingCost;
        product.invoices.forEach((invoiceId) => existing.invoices.add(invoiceId));
        rangeProductMap.set(product.key, existing);
      });
      const ingredientMap = dayDoseIngredients.get(key) || /* @__PURE__ */ new Map();
      ingredientMap.forEach((product) => {
        const existing = rangeDoseIngredientMap.get(product.key) || {
          ...product,
          invoices: /* @__PURE__ */ new Set()
        };
        existing.quantity += product.quantity;
        existing.revenue += product.revenue;
        existing.cost += product.cost;
        existing.profit += product.profit;
        existing.missingCost += product.missingCost;
        product.invoices.forEach((invoiceId) => existing.invoices.add(invoiceId));
        rangeDoseIngredientMap.set(product.key, existing);
      });
    });
    const rangeProducts = finalizeProducts(rangeProductMap, stockByProduct).sort((a, b) => b.quantity - a.quantity);
    const rangeDoseIngredients = finalizeProducts(rangeDoseIngredientMap, stockByProduct).filter((product) => Math.abs(toNumber2(product.quantity)) > 0 || Math.abs(toNumber2(product.cost)) > 0 || product.missingCost > 0).sort((a, b) => b.cost - a.cost || b.quantity - a.quantity);
    let currentDoseItemsSold = 0;
    let previousDoseItemsSold = 0;
    completedItems.forEach((item) => {
      if (item.line_type === "combo_component") return;
      const order = orderById.get(item.order_id);
      const key = order ? dateKey2(order.created_at) : dateKey2(item.created_at);
      const isDosePackage = lookups.isDoseProductMap?.get(item.product_id) === true || lookups.isDoseRetailMap?.get(item.product_id) === true;
      if (isDosePackage) {
        if (range.currentKeys.includes(key)) currentDoseItemsSold += Math.abs(toNumber2(item.quantity));
        else if (range.previousKeys.includes(key)) previousDoseItemsSold += Math.abs(toNumber2(item.quantity));
      }
    });
    currentSummary.doseItemsSold = currentDoseItemsSold;
    currentSummary.yesterdayDoseItemsSold = previousDoseItemsSold;
    if (orderTypeFilter === "all") {
      currentSummary.yesterdayRetailRevenue = previousSummary.retailRevenue || 0;
      currentSummary.yesterdayRetailCost = previousSummary.retailCost || 0;
      currentSummary.yesterdayRetailProfit = previousSummary.retailProfit || 0;
      currentSummary.yesterdayRetailInvoices = previousSummary.retailInvoices || 0;
      currentSummary.yesterdayItemsSold = previousSummary.itemsSold || 0;
      currentSummary.yesterdayRetailItemsSold = previousSummary.retailItemsSold || 0;
      currentSummary.yesterdayDosePackageRevenue = previousSummary.dosePackageRevenue || 0;
      currentSummary.yesterdayDoseIngredientCost = previousSummary.doseIngredientCost || 0;
    } else {
      currentSummary.yesterdayRetailRevenue = previousSummary.retailRevenue || 0;
      currentSummary.yesterdayRetailCost = previousSummary.retailCost || 0;
      currentSummary.yesterdayEcommerceRevenue = previousSummary.ecommerceRevenue || 0;
      currentSummary.yesterdayEcommerceCost = previousSummary.ecommerceCost || 0;
      currentSummary.yesterdayEcommerceProfit = previousSummary.ecommerceProfit || 0;
      currentSummary.yesterdayInternalExpense = previousSummary.internalExpense || 0;
      currentSummary.yesterdayRetailProfit = previousSummary.retailProfit || 0;
      currentSummary.yesterdayEcommerceItemsSold = previousSummary.ecommerceItemsSold || 0;
      currentSummary.yesterdayEcommerceInvoices = previousSummary.ecommerceInvoices || 0;
      currentSummary.yesterdayRetailInvoices = previousSummary.retailInvoices || 0;
      currentSummary.yesterdayInvoices = previousSummary.invoices || 0;
      currentSummary.yesterdayItemsSold = previousSummary.itemsSold || 0;
      currentSummary.yesterdayRetailItemsSold = previousSummary.retailItemsSold || 0;
    }
    return {
      summary: currentSummary,
      comparison: {
        revenueDelta: orderTypeFilter === "dose_cut" ? (currentSummary.dosePackageRevenue || 0) - (previousSummary.dosePackageRevenue || 0) : currentSummary.revenue - previousSummary.revenue,
        profitDelta: orderTypeFilter === "dose_cut" ? (currentSummary.doseProfit || 0) - (previousSummary.doseProfit || 0) : currentSummary.grossProfit - previousSummary.grossProfit,
        invoiceDelta: currentSummary.invoices - previousSummary.invoices,
        averageOrderDelta: currentSummary.averageOrder - previousSummary.averageOrder
      },
      alerts: {
        missingCostItems: currentSummary.missingCostItems,
        cancelledOrders: currentSummary.cancelledOrders,
        returnOrders: currentSummary.returnOrders,
        lowStockHotProducts: rangeProducts.filter((product) => product.isLowStock && product.quantity > 0).length
      },
      daily,
      productPerformance: rangeProducts,
      doseIngredientPerformance: rangeDoseIngredients,
      platformsPerformance: [...platformsSummary.values()].sort((a, b) => b.revenue - a.revenue),
      internalIssuesList: internalIssuesList.sort((a, b) => b.date.localeCompare(a.date) || b.totalCost - a.totalCost),
      internalIssuesSummary: {
        totalCost: internalIssuesSummary.totalCost,
        totalItems: internalIssuesSummary.totalItems,
        byReason: [...internalIssuesSummary.byReason.entries()].map(([k, v]) => ({ label: k, value: v })).sort((a, b) => b.value - a.value),
        byTarget: [...internalIssuesSummary.byTarget.entries()].map(([k, v]) => ({ label: k, value: v })).sort((a, b) => b.value - a.value)
      }
    };
  }

  // js/features/reports/reportService.js
  var DAY_MS = 24 * 60 * 60 * 1e3;
  var LOW_STOCK_THRESHOLD2 = 10;
  var POS_INVENTORY_REF_PREFIX2 = "[POS_ORDER:";
  function isRetailPOSMovement2(m, orderById) {
    const note = String(m.note || "");
    if (!note.includes(POS_INVENTORY_REF_PREFIX2)) return false;
    const match = note.match(/\[POS_ORDER:([^\]]+)\]/);
    if (!match) return true;
    const orderId = match[1];
    const order = orderById.get(orderId);
    if (order && order.order_type === "internal") {
      return false;
    }
    return true;
  }
  async function fetchShifts(range) {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from("employee_shifts").select("*").gte("shift_date", range.dateFrom).lte("shift_date", range.dateTo);
    if (error) {
      console.warn("Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c l\u1ECBch ca t\u1EEB Supabase, th\u1EED local storage:", error);
      try {
        if (typeof localStorage !== "undefined") {
          return JSON.parse(localStorage.getItem("khp_employee_shifts") || "[]").filter((item) => item.shift_date >= range.dateFrom && item.shift_date <= range.dateTo);
        }
      } catch {
        return [];
      }
    }
    return data || [];
  }
  function toNumber3(value) {
    const number2 = Number(value || 0);
    return Number.isFinite(number2) ? number2 : 0;
  }
  function startOfDay(date) {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
  }
  function endOfDay(date) {
    const next = new Date(date);
    next.setHours(23, 59, 59, 999);
    return next;
  }
  function dateKey3(value) {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  function chunk(array, size = 100) {
    const chunks = [];
    for (let index = 0; index < array.length; index += size) {
      chunks.push(array.slice(index, index + size));
    }
    return chunks;
  }
  function buildDateRange(customFrom = null, customTo = null) {
    const today = startOfDay(/* @__PURE__ */ new Date());
    const yesterday = startOfDay(new Date(today.getTime() - DAY_MS));
    let from, to;
    if (customFrom) {
      from = startOfDay(new Date(customFrom));
    } else {
      from = startOfDay(new Date(today.getTime() - 6 * DAY_MS));
    }
    if (customTo) {
      to = endOfDay(new Date(customTo));
    } else {
      to = endOfDay(today);
    }
    const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) || 1;
    const prevFrom = new Date(from.getTime() - days * DAY_MS);
    const prevTo = new Date(to.getTime() - days * DAY_MS);
    const keys = [];
    const currentKeys = [];
    const previousKeys = [];
    let current = new Date(prevFrom);
    let limit = 0;
    while (current <= prevTo && limit < 366) {
      previousKeys.push(dateKey3(current));
      keys.push(dateKey3(current));
      current.setTime(current.getTime() + DAY_MS);
      limit++;
    }
    current = new Date(from);
    limit = 0;
    while (current <= to && limit < 366) {
      currentKeys.push(dateKey3(current));
      keys.push(dateKey3(current));
      current.setTime(current.getTime() + DAY_MS);
      limit++;
    }
    return {
      todayKey: dateKey3(today),
      yesterdayKey: dateKey3(yesterday),
      dateFrom: dateKey3(from),
      dateTo: dateKey3(to),
      fromIso: prevFrom.toISOString(),
      toIso: to.toISOString(),
      keys,
      currentKeys,
      previousKeys
    };
  }
  async function fetchOrders(range, orderTypeFilter = "all") {
    let query = supabaseClient.from("orders").select("id, order_code, customer_name, customer_phone, subtotal, discount, total, status, created_at, order_type, ecommerce_platform").gte("created_at", range.fromIso).lte("created_at", range.toIso);
    if (orderTypeFilter === "ecommerce") {
      query = query.eq("order_type", "ecommerce");
    } else if (orderTypeFilter === "retail") {
      query = query.eq("order_type", "retail");
    } else if (orderTypeFilter === "internal") {
      query = query.eq("order_type", "internal");
    }
    const { data, error } = await query.order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  }
  async function fetchOrderItems(orderIds) {
    if (!orderIds.length) return [];
    const chunks = chunk(orderIds, 500);
    const promises = chunks.map(async (ids) => {
      const { data, error } = await supabaseClient.from("order_items").select("id, order_id, product_id, batch_id, product_name, product_code, unit_name, unit_price, quantity, total_price, created_at, line_type, parent_order_item_id, sort_index").in("order_id", ids);
      if (error) throw error;
      return data || [];
    });
    const results = await Promise.all(promises);
    return results.flat();
  }
  async function fetchCostLookups(items) {
    const productIds = [...new Set(items.map((item) => item.product_id).filter(Boolean))];
    const batchIds = [...new Set(items.map((item) => item.batch_id).filter(Boolean))];
    const unitCosts = /* @__PURE__ */ new Map();
    const batchCosts = /* @__PURE__ */ new Map();
    const isDoseProductMap = /* @__PURE__ */ new Map();
    const isDoseRetailMap = /* @__PURE__ */ new Map();
    const comboDefinitionMap = /* @__PURE__ */ new Map();
    if (productIds.length === 0 && batchIds.length === 0) {
      return { unitCosts, batchCosts, isDoseProductMap, isDoseRetailMap, comboDefinitionMap };
    }
    const productChunks = chunk(productIds, 500);
    const batchChunks = chunk(batchIds, 500);
    const productPromises = productChunks.map(
      (ids) => supabaseClient.from("products").select("id, description, category_id, categories(name)").in("id", ids)
    );
    const unitPromises = productChunks.map(
      (ids) => supabaseClient.from("product_units").select("product_id, unit_name, cost_price, conversion_rate, is_base_unit").in("product_id", ids)
    );
    const batchPromises = batchChunks.map(
      (ids) => supabaseClient.from("product_batches").select("id, cost_price").in("id", ids)
    );
    const [productRes, unitRes, batchRes] = await Promise.all([
      Promise.all(productPromises),
      Promise.all(unitPromises),
      Promise.all(batchPromises)
    ]);
    const productMetadata = [];
    productRes.forEach(({ data, error }) => {
      if (error) {
        console.warn("L\u1ED7i t\u1EA3i metadata s\u1EA3n ph\u1EA9m:", error);
        return;
      }
      productMetadata.push(...data || []);
      (data || []).forEach((p) => {
        let isDose = false;
        let isDoseRetail = false;
        if (p.description) {
          try {
            const descObj = JSON.parse(p.description);
            isDose = descObj && descObj.is_dose_cut === true;
            isDoseRetail = descObj && descObj.is_dose_retail === true;
          } catch (e) {
          }
        }
        isDoseProductMap.set(p.id, isDose);
        isDoseRetailMap.set(p.id, isDoseRetail);
      });
    });
    buildComboDefinitionMap(productMetadata).forEach((definition, productId) => {
      comboDefinitionMap.set(productId, definition);
    });
    unitRes.forEach(({ data, error }) => {
      if (error) throw error;
      (data || []).forEach((unit) => {
        unitCosts.set(`${unit.product_id}::${unit.unit_name || ""}`, unit);
        if (unit.is_base_unit && !unitCosts.has(`${unit.product_id}::__base__`)) {
          unitCosts.set(`${unit.product_id}::__base__`, unit);
        }
      });
    });
    const comboComponentIds = collectComboComponentIds(productMetadata).filter((productId) => !unitCosts.has(`${productId}::__base__`));
    if (comboComponentIds.length > 0) {
      const comboUnitChunks = chunk(comboComponentIds, 500);
      const extraUnitRes = await Promise.all(comboUnitChunks.map(
        (ids) => supabaseClient.from("product_units").select("product_id, unit_name, cost_price, conversion_rate, is_base_unit").in("product_id", ids)
      ));
      extraUnitRes.forEach(({ data, error }) => {
        if (error) throw error;
        (data || []).forEach((unit) => {
          unitCosts.set(`${unit.product_id}::${unit.unit_name || ""}`, unit);
          if (unit.is_base_unit && !unitCosts.has(`${unit.product_id}::__base__`)) {
            unitCosts.set(`${unit.product_id}::__base__`, unit);
          }
        });
      });
    }
    batchRes.forEach(({ data, error }) => {
      if (error) throw error;
      (data || []).forEach((batch) => batchCosts.set(batch.id, toNumber3(batch.cost_price)));
    });
    return { unitCosts, batchCosts, isDoseProductMap, isDoseRetailMap, comboDefinitionMap };
  }
  async function fetchStockByProduct(productIds) {
    const stockByProduct = /* @__PURE__ */ new Map();
    const ids = [...new Set(productIds.filter(Boolean))];
    if (!ids.length) return stockByProduct;
    const chunks = chunk(ids, 500);
    const promises = chunks.map(async (group) => {
      const { data, error } = await supabaseClient.from("product_batches").select("product_id, stock_quantity").in("product_id", group);
      if (error) throw error;
      return data || [];
    });
    const results = await Promise.all(promises);
    results.flat().forEach((batch) => {
      const productId = batch.product_id;
      stockByProduct.set(productId, toNumber3(stockByProduct.get(productId)) + toNumber3(batch.stock_quantity));
    });
    return stockByProduct;
  }
  async function fetchCatalogProductsWithStock() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from("products").select(`
            id,
            name,
            product_code,
            description,
            categories(name),
            product_units(unit_name, retail_price, cost_price, is_base_unit),
            product_batches(stock_quantity)
        `);
    if (error) throw error;
    return data || [];
  }
  async function fetchRecentCompletedSalesLookback(days = 120) {
    if (!supabaseClient) return { orders: [], items: [] };
    const from = new Date(Date.now() - days * DAY_MS).toISOString();
    const { data: orders, error: orderError } = await supabaseClient.from("orders").select("id, created_at, status, order_type").gte("created_at", from).eq("status", "completed").or("order_type.eq.retail,order_type.is.null").order("created_at", { ascending: false });
    if (orderError) throw orderError;
    const orderIds = (orders || []).map((order) => order.id);
    const items = await fetchOrderItems(orderIds);
    return { orders: orders || [], items };
  }
  function isDoseCatalogProduct(product) {
    if (product?.description) {
      try {
        const descObj = JSON.parse(product.description);
        return descObj && descObj.is_dose_cut === true;
      } catch (error) {
      }
    }
    return false;
  }
  function buildBusinessInsights(rangeProducts, catalogProducts, lookbackOrders, lookbackItems, isDoseProductMap = /* @__PURE__ */ new Map(), orderTypeFilter = "all") {
    const performanceById = new Map(rangeProducts.filter((product) => product.productId).map((product) => [product.productId, product]));
    const lastSoldByProduct = /* @__PURE__ */ new Map();
    const orderDateById = new Map((lookbackOrders || []).map((order) => [order.id, order.created_at]));
    (lookbackItems || []).forEach((item) => {
      if (item.line_type === "combo_component") return;
      if (!item.product_id) return;
      if (isDoseProductMap.get(item.product_id) === true) return;
      const soldAt = orderDateById.get(item.order_id) || item.created_at;
      if (!soldAt) return;
      const current = lastSoldByProduct.get(item.product_id);
      if (!current || new Date(soldAt) > new Date(current)) {
        lastSoldByProduct.set(item.product_id, soldAt);
      }
    });
    let catalogFilter;
    if (orderTypeFilter === "dose_cut") {
      catalogFilter = (product) => isDoseCatalogProduct(product);
    } else if (orderTypeFilter === "retail") {
      catalogFilter = (product) => !isDoseCatalogProduct(product);
    } else {
      catalogFilter = (product) => !isDoseCatalogProduct(product);
    }
    const catalog = (catalogProducts || []).filter(catalogFilter).map((product) => {
      const baseUnit = (product.product_units || []).find((unit) => unit.is_base_unit) || product.product_units?.[0] || {};
      const stock = (product.product_batches || []).reduce((sum, batch) => sum + toNumber3(batch.stock_quantity), 0);
      const perf = performanceById.get(product.id);
      const lastSoldAt = lastSoldByProduct.get(product.id) || null;
      const daysSinceLastSold = lastSoldAt ? Math.floor((Date.now() - new Date(lastSoldAt).getTime()) / DAY_MS) : null;
      return {
        productId: product.id,
        code: product.product_code || "",
        name: product.name || "Kh\xF4ng r\xF5 t\xEAn",
        unit: baseUnit.unit_name || "",
        stock,
        quantity: toNumber3(perf?.quantity),
        revenue: toNumber3(perf?.revenue),
        profit: toNumber3(perf?.profit),
        marginRate: toNumber3(perf?.marginRate),
        lastSoldAt,
        daysSinceLastSold
      };
    });
    return {
      lowStockHotProducts: catalog.filter((product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD2 && product.quantity > 0).sort((a, b) => b.quantity - a.quantity || a.stock - b.stock).slice(0, 12),
      slowMovingProducts: catalog.filter((product) => product.stock > LOW_STOCK_THRESHOLD2 && product.quantity <= 2).sort((a, b) => a.quantity - b.quantity || b.stock - a.stock).slice(0, 12),
      staleProducts: catalog.filter((product) => product.stock > 0 && (product.daysSinceLastSold === null || product.daysSinceLastSold >= 30)).sort((a, b) => (b.daysSinceLastSold || 9999) - (a.daysSinceLastSold || 9999)).slice(0, 12),
      highProfitProducts: [...rangeProducts].filter((product) => product.profit > 0).sort((a, b) => b.profit - a.profit || b.revenue - a.revenue).slice(0, 12)
    };
  }
  function buildDoseInsights(summary, internalMovements, catalogProducts, orderById = /* @__PURE__ */ new Map()) {
    const catalogById = new Map((catalogProducts || []).map((product) => [product.id, product]));
    const materialMap = /* @__PURE__ */ new Map();
    (internalMovements || []).forEach((movement) => {
      if (movement.reason !== "dose_cutting" && movement.reason !== "c\u1EAFt li\u1EC1u thu\u1ED1c") return;
      if (isRetailPOSMovement2(movement, orderById)) return;
      const productId = movement.product_id || `unknown-${movement.created_at}`;
      const catalog = catalogById.get(movement.product_id) || {};
      const key = productId;
      if (!materialMap.has(key)) {
        materialMap.set(key, {
          productId: movement.product_id,
          name: catalog.name || "Nguy\xEAn li\u1EC7u kh\xF4ng r\xF5 t\xEAn",
          code: catalog.product_code || "",
          quantityBase: 0,
          cost: 0,
          cutCount: 0
        });
      }
      const entry = materialMap.get(key);
      const issuedQty = -toNumber3(movement.quantity_base);
      entry.quantityBase += issuedQty;
      entry.cost += issuedQty * toNumber3(movement.cost_price);
      if (issuedQty > 0) entry.cutCount += 1;
    });
    const materials = [...materialMap.values()].filter((item) => item.quantityBase > 0 || item.cost > 0).sort((a, b) => b.quantityBase - a.quantityBase || b.cost - a.cost);
    return {
      revenue: toNumber3(summary?.dosePackageRevenue),
      ingredientCost: toNumber3(summary?.doseIngredientCost),
      profit: toNumber3(summary?.doseProfit),
      heavyCutMaterials: materials.slice(0, 8),
      lightCutMaterials: [...materials].filter((item) => item.quantityBase > 0).sort((a, b) => a.quantityBase - b.quantityBase || a.cost - b.cost).slice(0, 8)
    };
  }
  async function fetchInternalMovements(range) {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from("inventory_movements").select("product_id, quantity_base, cost_price, created_at, reason, note, products(name, product_code)").eq("movement_type", "internal_use").gte("created_at", range.fromIso).lte("created_at", range.toIso);
    if (error) {
      console.warn("L\u1ED7i fetch internal movements:", error.message);
      return [];
    }
    return data || [];
  }
  async function fetchDashboardAnalytics(orderTypeFilter = "all", dateFrom = null, dateTo = null) {
    if (!supabaseClient) throw new Error("Supabase ch\u01B0a \u0111\u01B0\u1EE3c k\u1EBFt n\u1ED1i.");
    const range = buildDateRange(dateFrom, dateTo);
    const [orders, shiftData, internalMovements, catalogProducts, lookbackSales] = await Promise.all([
      fetchOrders(range, orderTypeFilter),
      fetchShifts(range),
      fetchInternalMovements(range),
      fetchCatalogProductsWithStock(),
      fetchRecentCompletedSalesLookback()
    ]);
    const items = await fetchOrderItems(orders.map((order) => order.id));
    const soldProductIds = [
      ...items.map((item) => item.product_id).filter(Boolean),
      ...internalMovements.map((movement) => movement.product_id).filter(Boolean)
    ];
    const [lookups, stockByProduct] = await Promise.all([
      fetchCostLookups(items),
      fetchStockByProduct(soldProductIds)
    ]);
    const analytics = buildAnalytics(orders, items, lookups, stockByProduct, range, orderTypeFilter, shiftData, internalMovements);
    analytics.businessInsights = buildBusinessInsights(
      analytics.productPerformance,
      catalogProducts,
      lookbackSales.orders,
      lookbackSales.items,
      lookups.isDoseProductMap,
      orderTypeFilter
    );
    const orderById = new Map((orders || []).map((o) => [o.id, o]));
    analytics.doseInsights = buildDoseInsights(analytics.summary, internalMovements, catalogProducts, orderById);
    return { range, ...analytics };
  }

  // js/features/reports/reportController.js
  var currentAnalytics = null;
  var productSearch = "";
  var reportMode = "quantity";
  var currentOrderType = "all";
  var activeInsight = "low-stock-hot";
  var userStr = localStorage.getItem("pos_user");
  var user = userStr ? JSON.parse(userStr) : null;
  var isAdmin = user && user.role === "admin";
  var employeeMode = !isAdmin;
  var currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
  var number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
  var REPORT_MODES = {
    quantity: { title: "H\xE0ng b\xE1n m\u1EA1nh h\xF4m nay", hint: "X\u1EBFp theo s\u1ED1 l\u01B0\u1EE3ng b\xE1n ra", sort: (a, b) => b.quantity - a.quantity },
    revenue: { title: "Doanh thu theo m\u1EB7t h\xE0ng h\xF4m nay", hint: "X\u1EBFp theo doanh thu cao nh\u1EA5t", sort: (a, b) => b.revenue - a.revenue },
    profit: { title: "L\u1EE3i nhu\u1EADn theo m\u1EB7t h\xE0ng h\xF4m nay", hint: "X\u1EBFp theo l\u1EE3i nhu\u1EADn g\u1ED9p cao nh\u1EA5t", sort: (a, b) => b.profit - a.profit },
    "missing-cost": { title: "M\u1EB7t h\xE0ng thi\u1EBFu gi\xE1 v\u1ED1n h\xF4m nay", hint: "C\u1EA7n b\u1ED5 sung gi\xE1 v\u1ED1n \u0111\u1EC3 b\xE1o c\xE1o l\u1EE3i nhu\u1EADn \u0111\xFAng", sort: (a, b) => b.missingCost - a.missingCost || b.revenue - a.revenue }
  };
  function formatCurrency(value) {
    return currency.format(Number(value || 0));
  }
  function formatNumber(value) {
    return number.format(Number(value || 0));
  }
  function formatDate(value) {
    if (!value) return "--";
    if (typeof value === "string") {
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        return `${match[3]}/${match[2]}`;
      }
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    })[char]);
  }
  function setState(state, message = "") {
    document.getElementById("loadingState")?.classList.toggle("hidden", state !== "loading");
    document.getElementById("errorState")?.classList.toggle("hidden", state !== "error");
    document.getElementById("dashboardContent")?.classList.toggle("hidden", state !== "ready");
    if (message) {
      const errorText = document.getElementById("errorText");
      if (errorText) errorText.innerHTML = message;
    }
  }
  function updateTabStyles() {
    const btn = document.querySelector('[data-report-mode="missing-cost"]');
    const missingCount = Number(btn?.dataset.missingCount || 0);
    document.querySelectorAll("[data-report-mode]").forEach((button) => {
      const isMissingCostTab = button.dataset.reportMode === "missing-cost";
      const isProfitTab = button.dataset.reportMode === "profit";
      const isRevenueTab = button.dataset.reportMode === "revenue";
      const isQuantityTab = button.dataset.reportMode === "quantity";
      const active = button.dataset.reportMode === reportMode;
      if (currentOrderType === "ecommerce") {
        if (isProfitTab) {
          button.classList.add("hidden");
        } else {
          button.classList.remove("hidden");
        }
        if (isRevenueTab) button.innerHTML = "Gi\xE1 v\u1ED1n";
        if (isQuantityTab) button.innerHTML = "SL xu\u1EA5t";
      } else if (currentOrderType === "dose_cut") {
        if (isProfitTab) {
          button.classList.add("hidden");
        } else {
          button.classList.remove("hidden");
        }
        if (isRevenueTab) button.innerHTML = "Nguy\xEAn li\u1EC7u thu\u1ED1c li\u1EC1u";
        if (isQuantityTab) button.innerHTML = "Doanh thu thu\u1ED1c li\u1EC1u";
      } else if (currentOrderType === "retail") {
        if (isRevenueTab || isProfitTab) {
          button.classList.add("hidden");
        } else {
          button.classList.remove("hidden");
        }
        if (isQuantityTab) button.innerHTML = "T\u1EA5t c\u1EA3";
      } else {
        if (employeeMode && currentOrderType !== "retail" && (isProfitTab || isMissingCostTab)) {
          button.classList.add("hidden");
        } else {
          button.classList.remove("hidden");
        }
        if (isRevenueTab) button.innerHTML = "Doanh thu";
        if (isQuantityTab) button.innerHTML = "B\xE1n m\u1EA1nh";
      }
      button.classList.toggle("is-active", active);
      button.classList.toggle("bg-blue-600", active);
      button.classList.toggle("text-white", active);
      button.classList.toggle("shadow-sm", active);
      button.classList.toggle("bg-slate-100", !active && (!isMissingCostTab || missingCount === 0));
      button.classList.toggle("dark:bg-slate-800", !active && (!isMissingCostTab || missingCount === 0));
      button.classList.toggle("text-slate-700", !active && (!isMissingCostTab || missingCount === 0));
      button.classList.toggle("dark:text-slate-200", !active && (!isMissingCostTab || missingCount === 0));
      if (isMissingCostTab) {
        const hasAlert = missingCount > 0 && !active;
        button.classList.toggle("bg-red-50", hasAlert);
        button.classList.toggle("border-red-200", hasAlert);
        button.classList.toggle("text-red-600", hasAlert);
        button.classList.toggle("dark:bg-red-950/20", hasAlert);
        button.classList.toggle("dark:border-red-900/50", hasAlert);
        button.classList.toggle("dark:text-red-400", hasAlert);
        button.classList.toggle("animate-pulse", hasAlert);
        if (!hasAlert) {
          button.classList.remove("bg-red-50", "border-red-200", "text-red-600", "dark:bg-red-950/20", "dark:border-red-900/50", "dark:text-red-400", "animate-pulse");
        }
      }
    });
  }
  function updateMissingCostTab(analytics) {
    const btn = document.querySelector('[data-report-mode="missing-cost"]');
    if (!btn) return;
    const missingCount = currentOrderType === "dose_cut" ? (analytics.doseIngredientPerformance || []).reduce((sum, product) => sum + Number(product.missingCost || 0), 0) : currentOrderType === "retail" ? (analytics.productPerformance || []).reduce((sum, product) => sum + Number(product.missingCost || 0), 0) : Number(analytics.summary.missingCostItems || 0);
    if (missingCount > 0) {
      btn.innerHTML = `Thi\u1EBFu gi\xE1 v\u1ED1n <span class="ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-md bg-red-600 text-white animate-bounce inline-block">${missingCount}</span>`;
    } else {
      btn.innerHTML = "Thi\u1EBFu gi\xE1 v\u1ED1n";
    }
    btn.dataset.missingCount = missingCount;
    updateTabStyles();
  }
  function setActiveReportMode(mode) {
    if (currentOrderType === "dose_cut" && mode === "profit") mode = "quantity";
    if (currentOrderType === "retail" && (mode === "revenue" || mode === "profit")) mode = "quantity";
    reportMode = mode;
    updateTabStyles();
    renderProductTable();
  }
  function compareText(delta, type = "money", suffix = "h\xF4m qua") {
    const value = Number(delta || 0);
    const icon = value > 0 ? "fa-arrow-trend-up" : value < 0 ? "fa-arrow-trend-down" : "fa-minus";
    const color = value > 0 ? "text-emerald-600 dark:text-emerald-400" : value < 0 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400";
    const text = type === "money" ? formatCurrency(Math.abs(value)) : formatNumber(Math.abs(value));
    const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
    return `<span class="inline-flex items-center gap-1 ${color}"><i class="fa-solid ${icon}"></i>${prefix}${text} so v\u1EDBi ${suffix}</span>`;
  }
  function renderSummary(summary, comparison) {
    const isSingleDay = currentAnalytics?.range?.currentKeys?.length === 1;
    const suffix = isSingleDay ? "h\xF4m qua" : "chu k\u1EF3 tr\u01B0\u1EDBc";
    let cards = [];
    if (employeeMode) {
      if (currentOrderType === "all") {
        const retailDelta = summary.retailRevenue - (summary.yesterdayRetailRevenue || 0);
        const retailInvoiceDelta = summary.retailInvoices - (summary.yesterdayRetailInvoices || 0);
        const doseRevenueDelta = (summary.dosePackageRevenue || 0) - (summary.yesterdayDosePackageRevenue || 0);
        const doseItemsSoldDelta = (summary.doseItemsSold || 0) - (summary.yesterdayDoseItemsSold || 0);
        cards = [
          ["Doanh thu B\xE1n l\u1EBB", formatCurrency(summary.retailRevenue), compareText(retailDelta, "money", suffix), "fa-shop", "text-blue-600", "bg-blue-50 border-blue-200"],
          ["S\u1ED1 h\xF3a \u0111\u01A1n B\xE1n l\u1EBB", formatNumber(summary.retailInvoices), compareText(retailInvoiceDelta, "number", suffix), "fa-receipt", "text-emerald-600", "bg-emerald-50 border-emerald-200"],
          ["Doanh thu Thu\u1ED1c li\u1EC1u", formatCurrency(summary.dosePackageRevenue || 0), compareText(doseRevenueDelta, "money", suffix), "fa-capsules", "text-indigo-600", "bg-indigo-50 border-indigo-200"],
          ["S\u1ED1 li\u1EC1u b\xE1n ra", `${formatNumber(summary.doseItemsSold || 0)} g\xF3i`, compareText(doseItemsSoldDelta, "number", suffix), "fa-boxes-stacked", "text-violet-600", "bg-violet-50 border-violet-200"]
        ];
      } else if (currentOrderType === "dose_cut") {
        const deltaItemsSold = summary.itemsSold - (summary.yesterdayItemsSold || 0);
        cards = [
          ["Doanh thu \u0110\u1ECBnh l\u01B0\u1EE3ng", formatCurrency(summary.revenue), compareText(comparison.revenueDelta, "money", suffix), "fa-chart-line", "text-indigo-600", "bg-indigo-50 border-indigo-200"],
          ["H\xF3a \u0111\u01A1n thu\u1ED1c li\u1EC1u", formatNumber(summary.invoices), compareText(comparison.invoiceDelta, "number", suffix), "fa-receipt", "text-violet-600", "bg-violet-50 border-violet-200"],
          ["L\u01B0\u1EE3ng b\xE1n thu\u1ED1c li\u1EC1u", `${formatNumber(summary.itemsSold)} s\u1EA3n ph\u1EA9m`, compareText(deltaItemsSold, "number", suffix), "fa-boxes-stacked", "text-amber-600", "bg-amber-50 border-amber-200"],
          ["Gi\xE1 tr\u1ECB \u0111\u01A1n TB", formatCurrency(summary.averageOrder), compareText(comparison.averageOrderDelta, "money", suffix), "fa-calculator", "text-orange-600", "bg-orange-50 border-orange-200"]
        ];
      } else if (currentOrderType === "ecommerce") {
        const ecommerceCostDelta = summary.ecommerceCost - (summary.yesterdayEcommerceCost || 0);
        const ecommerceItemsSoldDelta = summary.ecommerceItemsSold - (summary.yesterdayEcommerceItemsSold || 0);
        const ecommerceInvoicesDelta = summary.ecommerceInvoices - (summary.yesterdayEcommerceInvoices || 0);
        cards = [
          ["Gi\xE1 v\u1ED1n TM\u0110T", formatCurrency(summary.ecommerceCost), compareText(ecommerceCostDelta, "money", suffix), "fa-box-open", "text-pink-600", "bg-pink-50 border-pink-200"],
          ["S\u1ED1 \u0111\u01A1n h\xE0ng TM\u0110T", `${formatNumber(summary.ecommerceInvoices)} \u0111\u01A1n`, compareText(ecommerceInvoicesDelta, "number", suffix), "fa-receipt", "text-emerald-600", "bg-emerald-50 border-emerald-200"],
          ["L\u01B0\u1EE3ng b\xE1n TM\u0110T", `${formatNumber(summary.ecommerceItemsSold)} s\u1EA3n ph\u1EA9m`, compareText(ecommerceItemsSoldDelta, "number", suffix), "fa-boxes-stacked", "text-violet-600", "bg-violet-50 border-violet-200"],
          ["Gi\xE1 v\u1ED1n TB/\u0111\u01A1n", formatCurrency(summary.ecommerceInvoices ? summary.ecommerceCost / summary.ecommerceInvoices : 0), "", "fa-calculator", "text-orange-600", "bg-orange-50 border-orange-200"]
        ];
      } else {
        const retailRevenueDelta = summary.retailRevenue - (summary.yesterdayRetailRevenue || 0);
        const retailInvoiceDelta = summary.retailInvoices - (summary.yesterdayRetailInvoices || 0);
        const retailItemsSoldDelta = summary.retailItemsSold - (summary.yesterdayRetailItemsSold || 0);
        const averageOrderVal = summary.retailInvoices ? summary.retailRevenue / summary.retailInvoices : 0;
        const yesterdayAverageOrderVal = summary.yesterdayRetailInvoices ? summary.yesterdayRetailRevenue / summary.yesterdayRetailInvoices : 0;
        const retailAverageOrderDelta = averageOrderVal - yesterdayAverageOrderVal;
        cards = [
          ["Doanh thu B\xE1n l\u1EBB", formatCurrency(summary.retailRevenue), compareText(retailRevenueDelta, "money", suffix), "fa-chart-line", "text-blue-600", "bg-blue-50 border-blue-200"],
          ["S\u1ED1 h\xF3a \u0111\u01A1n", formatNumber(summary.retailInvoices), compareText(retailInvoiceDelta, "number", suffix), "fa-receipt", "text-emerald-600", "bg-emerald-50 border-emerald-200"],
          ["L\u01B0\u1EE3ng b\xE1n", `${formatNumber(summary.retailItemsSold)} s\u1EA3n ph\u1EA9m`, compareText(retailItemsSoldDelta, "number", suffix), "fa-boxes-stacked", "text-violet-600", "bg-violet-50 border-violet-200"],
          ["Gi\xE1 tr\u1ECB \u0111\u01A1n TB", formatCurrency(averageOrderVal), compareText(retailAverageOrderDelta, "money", suffix), "fa-calculator", "text-orange-600", "bg-orange-50 border-orange-200"]
        ];
      }
    } else {
      if (currentOrderType === "all") {
        const retailDelta = summary.retailRevenue - (summary.yesterdayRetailRevenue || 0);
        const retailProfitDelta = summary.retailProfit - (summary.yesterdayRetailProfit || 0);
        const doseRevenueDelta = (summary.dosePackageRevenue || 0) - (summary.yesterdayDosePackageRevenue || 0);
        const yesterdayDoseProfit = (summary.yesterdayDosePackageRevenue || 0) - (summary.yesterdayDoseIngredientCost || 0);
        const doseProfitDelta = (summary.doseProfit || 0) - yesterdayDoseProfit;
        cards = [
          ["Doanh thu B\xE1n l\u1EBB", formatCurrency(summary.retailRevenue), compareText(retailDelta, "money", suffix), "fa-shop", "text-blue-600", "bg-blue-50 border-blue-200"],
          ["L\u1EE3i nhu\u1EADn B\xE1n l\u1EBB", formatCurrency(summary.retailProfit), compareText(retailProfitDelta, "money", suffix), "fa-sack-dollar", "text-emerald-600", "bg-emerald-50 border-emerald-200"],
          ["Doanh thu Thu\u1ED1c li\u1EC1u", formatCurrency(summary.dosePackageRevenue || 0), compareText(doseRevenueDelta, "money", suffix), "fa-capsules", "text-indigo-600", "bg-indigo-50 border-indigo-200"],
          ["L\u1EE3i nhu\u1EADn Thu\u1ED1c li\u1EC1u", formatCurrency(summary.doseProfit || 0), compareText(doseProfitDelta, "money", suffix), "fa-sack-dollar", "text-violet-600", "bg-violet-50 border-violet-200"]
        ];
      } else if (currentOrderType === "dose_cut") {
        const costDelta = comparison.revenueDelta - comparison.profitDelta;
        let costValText = formatCurrency(summary.doseIngredientCost || 0);
        if (summary.doseIngredientPOSCost > 0 || summary.doseIngredientInternalCost > 0) {
          const posStr = formatCurrency(summary.doseIngredientPOSCost || 0);
          const intStr = formatCurrency(summary.doseIngredientInternalCost || 0);
          costValText += `<span class="text-[11px] text-slate-500 font-bold block mt-1">(POS: ${posStr} | Xu\u1EA5t kho: ${intStr})</span>`;
        }
        cards = [
          ["Doanh thu \u0110\u1ECBnh l\u01B0\u1EE3ng", formatCurrency(summary.dosePackageRevenue || 0), compareText(comparison.revenueDelta, "money", suffix), "fa-chart-line", "text-indigo-600", "bg-indigo-50 border-indigo-200"],
          ["V\u1ED1n \u0111\u1ECBnh l\u01B0\u1EE3ng", costValText, compareText(costDelta, "money", suffix), "fa-box-open", "text-amber-600", "bg-amber-50 border-amber-200"],
          ["L\u1EE3i nhu\u1EADn thu\u1ED1c li\u1EC1u", formatCurrency(summary.doseProfit || 0), compareText(comparison.profitDelta, "money", suffix), "fa-sack-dollar", "text-emerald-600", "bg-emerald-50 border-emerald-200"],
          ["H\xF3a \u0111\u01A1n thu\u1ED1c li\u1EC1u", formatNumber(summary.invoices), compareText(comparison.invoiceDelta, "number", suffix), "fa-receipt", "text-violet-600", "bg-violet-50 border-violet-200"]
        ];
      } else if (currentOrderType === "ecommerce") {
        const ecommerceCostDelta = summary.ecommerceCost - (summary.yesterdayEcommerceCost || 0);
        const ecommerceItemsSoldDelta = summary.ecommerceItemsSold - (summary.yesterdayEcommerceItemsSold || 0);
        const ecommerceInvoicesDelta = summary.ecommerceInvoices - (summary.yesterdayEcommerceInvoices || 0);
        cards = [
          ["Gi\xE1 v\u1ED1n TM\u0110T", formatCurrency(summary.ecommerceCost), compareText(ecommerceCostDelta, "money", suffix), "fa-box-open", "text-pink-600", "bg-pink-50 border-pink-200"],
          ["S\u1ED1 \u0111\u01A1n h\xE0ng TM\u0110T", `${formatNumber(summary.ecommerceInvoices)} \u0111\u01A1n`, compareText(ecommerceInvoicesDelta, "number", suffix), "fa-receipt", "text-emerald-600", "bg-emerald-50 border-emerald-200"],
          ["L\u01B0\u1EE3ng b\xE1n TM\u0110T", `${formatNumber(summary.ecommerceItemsSold)} s\u1EA3n ph\u1EA9m`, compareText(ecommerceItemsSoldDelta, "number", suffix), "fa-boxes-stacked", "text-violet-600", "bg-violet-50 border-violet-200"],
          ["Gi\xE1 v\u1ED1n TB/\u0111\u01A1n", formatCurrency(summary.ecommerceInvoices ? summary.ecommerceCost / summary.ecommerceInvoices : 0), "", "fa-calculator", "text-orange-600", "bg-orange-50 border-orange-200"]
        ];
      } else {
        const retailRevenueDelta = summary.retailRevenue - (summary.yesterdayRetailRevenue || 0);
        const retailCostDelta = summary.retailCost - (summary.yesterdayRetailCost || 0);
        const retailProfitDelta = summary.retailProfit - (summary.yesterdayRetailProfit || 0);
        const retailInvoiceDelta = summary.retailInvoices - (summary.yesterdayRetailInvoices || 0);
        cards = [
          ["Doanh thu B\xE1n l\u1EBB", formatCurrency(summary.retailRevenue), compareText(retailRevenueDelta, "money", suffix), "fa-chart-line", "text-blue-600", "bg-blue-50 border-blue-200"],
          ["Gi\xE1 v\u1ED1n B\xE1n l\u1EBB", formatCurrency(summary.retailCost), compareText(retailCostDelta, "money", suffix), "fa-box-open", "text-amber-600", "bg-amber-50 border-amber-200"],
          ["L\u1EE3i nhu\u1EADn g\u1ED9p", formatCurrency(summary.retailProfit), compareText(retailProfitDelta, "money", suffix), "fa-sack-dollar", "text-emerald-600", "bg-emerald-50 border-emerald-200"],
          ["S\u1ED1 h\xF3a \u0111\u01A1n", formatNumber(summary.retailInvoices), compareText(retailInvoiceDelta, "number", suffix), "fa-receipt", "text-violet-600", "bg-violet-50 border-violet-200"]
        ];
      }
    }
    document.getElementById("summaryCards").innerHTML = cards.map((card) => `
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
    `).join("");
  }
  function alertCard(icon, label, value, tone) {
    const tones = {
      amber: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200",
      red: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200",
      emerald: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200",
      slate: "bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
    };
    return `
        <button type="button" data-insight-key="${label === "B\xE1n m\u1EA1nh t\u1ED3n th\u1EA5p" ? "low-stock-hot" : label === "Thi\u1EBFu gi\xE1 v\u1ED1n" ? "missing-cost" : label === "H\xF3a \u0111\u01A1n h\u1EE7y" ? "cancelled" : "returns"}" class="rounded-2xl border px-4 py-3 ${tones[tone] || tones.slate} flex items-center gap-3 text-left w-full hover:shadow-sm transition-all">
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
        alertCard("fa-receipt", "T\u1ED5ng h\xF3a \u0111\u01A1n", `${formatNumber(totalInvoices)} h\xF3a \u0111\u01A1n`, "slate"),
        alertCard("fa-boxes-stacked", "B\xE1n m\u1EA1nh t\u1ED3n th\u1EA5p", `${formatNumber(alerts.lowStockHotProducts)} m\u1EB7t h\xE0ng`, alerts.lowStockHotProducts ? "red" : "emerald"),
        alertCard("fa-ban", "H\xF3a \u0111\u01A1n h\u1EE7y", `${formatNumber(alerts.cancelledOrders)} h\xF3a \u0111\u01A1n`, alerts.cancelledOrders ? "red" : "slate"),
        alertCard("fa-rotate-left", "Tr\u1EA3 h\xE0ng", `${formatNumber(alerts.returnOrders)} h\xF3a \u0111\u01A1n`, alerts.returnOrders ? "amber" : "slate")
      ];
    } else {
      cards = [
        alertCard("fa-triangle-exclamation", "Thi\u1EBFu gi\xE1 v\u1ED1n", `${formatNumber(alerts.missingCostItems)} d\xF2ng b\xE1n`, alerts.missingCostItems ? "amber" : "emerald"),
        alertCard("fa-boxes-stacked", "B\xE1n m\u1EA1nh t\u1ED3n th\u1EA5p", `${formatNumber(alerts.lowStockHotProducts)} m\u1EB7t h\xE0ng`, alerts.lowStockHotProducts ? "red" : "emerald"),
        alertCard("fa-ban", "H\xF3a \u0111\u01A1n h\u1EE7y", `${formatNumber(alerts.cancelledOrders)} h\xF3a \u0111\u01A1n`, alerts.cancelledOrders ? "red" : "slate"),
        alertCard("fa-rotate-left", "Tr\u1EA3 h\xE0ng", `${formatNumber(alerts.returnOrders)} h\xF3a \u0111\u01A1n`, alerts.returnOrders ? "amber" : "slate")
      ];
    }
    document.getElementById("alertStrip").innerHTML = cards.join("");
  }
  function formatDateTimeShort(value) {
    if (!value) return "Ch\u01B0a c\xF3";
    return new Date(value).toLocaleDateString("vi-VN");
  }
  function insightSummaryCards(current) {
    const rows = current.rows || [];
    if (!rows.length) return "";
    if (current.type === "stale") {
      const totalStock2 = rows.reduce((sum, item) => sum + Number(item.stock || 0), 0);
      const neverSold = rows.filter((item) => item.daysSinceLastSold === null).length;
      const oldestDays = rows.reduce((max, item) => Math.max(max, Number(item.daysSinceLastSold || 0)), 0);
      return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div class="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
                    <div class="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">M\u1EB7t h\xE0ng c\u1EA7n x\u1EED l\xFD</div>
                    <div class="mt-1 text-xl font-black text-amber-900 dark:text-amber-100">${formatNumber(rows.length)}</div>
                </div>
                <div class="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3">
                    <div class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">T\u1ED5ng t\u1ED3n treo</div>
                    <div class="mt-1 text-xl font-black text-slate-900 dark:text-white">${formatNumber(totalStock2)}</div>
                </div>
                <div class="rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3">
                    <div class="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-300">L\xE2u nh\u1EA5t ch\u01B0a b\xE1n</div>
                    <div class="mt-1 text-xl font-black text-rose-900 dark:text-rose-100">${neverSold ? `${formatNumber(neverSold)} ch\u01B0a b\xE1n` : `${formatNumber(oldestDays)} ng\xE0y`}</div>
                </div>
            </div>
        `;
    }
    const totalQuantity = rows.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const totalStock = rows.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const totalValue = rows.reduce((sum, item) => sum + Number(current.type === "high-profit" ? item.profit : item.revenue || 0), 0);
    const valueLabel = current.type === "high-profit" ? "T\u1ED5ng l\u1EE3i nhu\u1EADn" : "T\u1ED5ng doanh thu";
    const quantityLabel = current.type === "slow-moving" ? "SL b\xE1n ch\u1EADm" : "SL b\xE1n";
    const stockLabel = current.type === "low-stock-hot" ? "T\u1ED3n c\xF2n l\u1EA1i" : "T\u1ED3n c\u1EA7n theo d\xF5i";
    return `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div class="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3">
                <div class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">${quantityLabel}</div>
                <div class="mt-1 text-xl font-black text-slate-900 dark:text-white">${formatNumber(totalQuantity)}</div>
            </div>
            <div class="rounded-2xl ${current.type === "low-stock-hot" ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"} border px-4 py-3">
                <div class="text-[10px] font-black uppercase tracking-widest ${current.type === "low-stock-hot" ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}">${stockLabel}</div>
                <div class="mt-1 text-xl font-black ${current.type === "low-stock-hot" ? "text-red-900 dark:text-red-100" : "text-amber-900 dark:text-amber-100"}">${formatNumber(totalStock)}</div>
            </div>
            <div class="rounded-2xl ${current.type === "high-profit" ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"} border px-4 py-3">
                <div class="text-[10px] font-black uppercase tracking-widest ${current.type === "high-profit" ? "text-emerald-700 dark:text-emerald-300" : "text-blue-700 dark:text-blue-300"}">${valueLabel}</div>
                <div class="mt-1 text-xl font-black ${current.type === "high-profit" ? "text-emerald-900 dark:text-emerald-100" : "text-blue-900 dark:text-blue-100"}">${formatCurrency(totalValue)}</div>
            </div>
        </div>
    `;
  }
  function insightRow(item, type, index) {
    if (type === "stale") {
      return `
            <tr class="border-b border-slate-100 dark:border-slate-800">
                <td class="py-3 px-4 text-xs font-black text-slate-400">${index + 1}</td>
                <td class="py-3 px-4">
                    <div class="font-black text-slate-900 dark:text-white">${escapeHTML(item.name)}</div>
                    <div class="text-[11px] font-bold text-slate-500">${escapeHTML(item.code || "Ch\u01B0a c\xF3 m\xE3")}</div>
                </td>
                <td class="py-3 px-4 text-right font-black text-slate-700 dark:text-slate-200">${formatNumber(item.stock)}</td>
                <td class="py-3 px-4 text-right font-black text-amber-600 dark:text-amber-400">${item.daysSinceLastSold === null ? "Ch\u01B0a b\xE1n" : `${formatNumber(item.daysSinceLastSold)} ng\xE0y`}</td>
                <td class="py-3 px-4 text-right font-bold text-slate-500">${formatDateTimeShort(item.lastSoldAt)}</td>
            </tr>
        `;
    }
    return `
        <tr class="border-b border-slate-100 dark:border-slate-800">
            <td class="py-3 px-4 text-xs font-black text-slate-400">${index + 1}</td>
            <td class="py-3 px-4">
                <div class="font-black text-slate-900 dark:text-white">${escapeHTML(item.name)}</div>
                <div class="text-[11px] font-bold text-slate-500">${escapeHTML(item.code || "Ch\u01B0a c\xF3 m\xE3")}</div>
            </td>
            <td class="py-3 px-4 text-right font-black text-slate-700 dark:text-slate-200">${formatNumber(item.quantity || 0)}</td>
            <td class="py-3 px-4 text-right font-black ${type === "low-stock-hot" ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-200"}">${formatNumber(item.stock || 0)}</td>
            <td class="py-3 px-4 text-right font-black ${type === "high-profit" ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}">${formatCurrency(type === "high-profit" ? item.profit : item.revenue || 0)}</td>
        </tr>
    `;
  }
  function renderBusinessInsights() {
    if (!currentAnalytics?.businessInsights) return;
    const insightMap = {
      "low-stock-hot": {
        title: "B\xE1n m\u1EA1nh t\u1ED3n th\u1EA5p",
        hint: "\u01AFu ti\xEAn nh\u1EADp th\xEAm ngay \u0111\u1EC3 tr\xE1nh m\u1EA5t doanh thu",
        rows: currentAnalytics.businessInsights.lowStockHotProducts || [],
        type: "low-stock-hot",
        empty: "Kh\xF4ng c\xF3 m\u1EB7t h\xE0ng b\xE1n m\u1EA1nh n\xE0o \u0111ang \u1EDF m\u1EE9c t\u1ED3n th\u1EA5p."
      },
      "slow-moving": {
        title: "B\xE1n ch\u1EADm",
        hint: "H\xE0ng c\xF2n t\u1ED3n nh\u01B0ng t\u1ED1c \u0111\u1ED9 b\xE1n th\u1EA5p trong k\u1EF3 \u0111ang xem",
        rows: currentAnalytics.businessInsights.slowMovingProducts || [],
        type: "slow-moving",
        empty: "Kh\xF4ng c\xF3 m\u1EB7t h\xE0ng b\xE1n ch\u1EADm n\u1ED5i b\u1EADt trong k\u1EF3."
      },
      "stale": {
        title: "L\xE2u ch\u01B0a b\xE1n",
        hint: "Theo d\xF5i h\xE0ng t\u1ED3n l\xE2u \u0111\u1EC3 \u0111\u1EA9y b\xE1n ho\u1EB7c x\u1EED l\xFD t\u1ED3n",
        rows: currentAnalytics.businessInsights.staleProducts || [],
        type: "stale",
        empty: "Kh\xF4ng c\xF3 m\u1EB7t h\xE0ng t\u1ED3n l\xE2u ch\u01B0a b\xE1n \u0111\xE1ng ch\xFA \xFD."
      },
      "high-profit": {
        title: "L\xE3i cao",
        hint: "C\xE1c m\u1EB7t h\xE0ng \u0111\xF3ng g\xF3p l\u1EE3i nhu\u1EADn g\u1ED9p t\u1ED1t nh\u1EA5t",
        rows: currentAnalytics.businessInsights.highProfitProducts || [],
        type: "high-profit",
        empty: "Ch\u01B0a c\xF3 d\u1EEF li\u1EC7u l\u1EE3i nhu\u1EADn n\u1ED5i b\u1EADt trong k\u1EF3."
      }
    };
    const highProfitBtn = document.querySelector('[data-business-insight="high-profit"]');
    if (highProfitBtn) {
      highProfitBtn.classList.toggle("hidden", employeeMode);
    }
    if (employeeMode && activeInsight === "high-profit") {
      activeInsight = "low-stock-hot";
    }
    const current = insightMap[activeInsight] || insightMap["low-stock-hot"];
    const titleEl = document.getElementById("businessInsightTitle");
    const hintEl = document.getElementById("businessInsightHint");
    const bodyEl = document.getElementById("businessInsightBody");
    if (titleEl) titleEl.textContent = current.title;
    if (hintEl) hintEl.textContent = current.hint;
    document.querySelectorAll("[data-business-insight]").forEach((button) => {
      const active = button.dataset.businessInsight === activeInsight;
      button.classList.toggle("bg-slate-900", active);
      button.classList.toggle("text-white", active);
      button.classList.toggle("dark:bg-white", active);
      button.classList.toggle("dark:text-slate-900", active);
      button.classList.toggle("bg-slate-100", !active);
      button.classList.toggle("dark:bg-slate-800", !active);
    });
    if (!bodyEl) return;
    if (!current.rows.length) {
      bodyEl.innerHTML = `<div class="py-10 text-center text-sm font-bold text-slate-400">${current.empty}</div>`;
      return;
    }
    const summary = insightSummaryCards(current);
    const header = current.type === "stale" ? `
            <tr class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <th class="px-4 py-2 w-12">#</th>
                <th class="px-4 py-2">M\u1EB7t h\xE0ng</th>
                <th class="px-4 py-2 text-right">T\u1ED3n</th>
                <th class="px-4 py-2 text-right">L\xE2u ch\u01B0a b\xE1n</th>
                <th class="px-4 py-2 text-right">B\xE1n g\u1EA7n nh\u1EA5t</th>
            </tr>
        ` : `
            <tr class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <th class="px-4 py-2 w-12">#</th>
                <th class="px-4 py-2">M\u1EB7t h\xE0ng</th>
                <th class="px-4 py-2 text-right">SL b\xE1n</th>
                <th class="px-4 py-2 text-right">T\u1ED3n</th>
                <th class="px-4 py-2 text-right">${current.type === "high-profit" ? "L\u1EE3i nhu\u1EADn" : "Doanh thu"}</th>
            </tr>
        `;
    bodyEl.innerHTML = `
        ${summary}
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-slate-50 dark:bg-slate-900/60">${header}</thead>
                <tbody>${current.rows.map((item, index) => insightRow(item, current.type, index)).join("")}</tbody>
            </table>
        </div>
    `;
  }
  function renderTrend(daily) {
    const getTrendValue = (day) => {
      if (currentOrderType === "ecommerce") return Number(day.ecommerceCost || day.ecommerceRevenue || 0);
      if (currentOrderType === "dose_cut") return Number(day.dosePackageRevenue || day.revenue || 0);
      if (currentOrderType === "all") return Number(day.revenue || 0);
      return Number(day.retailRevenue || 0);
    };
    const maxRevenue = Math.max(1, ...daily.map((day) => Math.abs(getTrendValue(day))));
    const trendTitle = document.querySelector("#dailyTrend")?.closest("section")?.querySelector("h2");
    if (trendTitle) {
      if (currentOrderType === "ecommerce") {
        trendTitle.textContent = `Gi\xE1 v\u1ED1n ${daily.length} ng\xE0y g\u1EA7n nh\u1EA5t`;
      } else {
        trendTitle.textContent = `Doanh thu ${daily.length} ng\xE0y g\u1EA7n nh\u1EA5t`;
      }
    }
    document.getElementById("dailyTrend").innerHTML = daily.map((day) => {
      const dayKey = day.key || day.date || day.day || "";
      const isToday = dayKey === currentAnalytics?.range?.todayKey;
      const segments = [];
      const targetTotal = Math.max(0, getTrendValue(day));
      if (currentOrderType === "all") {
        if (day.shifts && day.shifts.length > 0) {
          const shiftColors = [
            "bg-blue-600 dark:bg-blue-700",
            // Ca 1 (Blue)
            "bg-amber-500 dark:bg-amber-600",
            // Ca 2 (Amber)
            "bg-violet-500 dark:bg-violet-600",
            // Ca 3 (Violet)
            "bg-emerald-500 dark:bg-emerald-600",
            // Ca 4 (Emerald)
            "bg-cyan-500 dark:bg-cyan-600"
            // Ca 5 (Cyan)
          ];
          const sortedShifts = [...day.shifts].sort((a, b) => {
            const timeA = a.start_time || "00:00:00";
            const timeB = b.start_time || "00:00:00";
            return timeA.localeCompare(timeB);
          });
          day.shifts.forEach((s) => {
            if (s.revenue > 0) {
              const idx = sortedShifts.findIndex(
                (ss) => ss.name === s.name && ss.start_time === s.start_time && ss.end_time === s.end_time
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
            label: day.shifts && day.shifts.length > 0 ? "Ngo\xE0i ca" : "B\xE1n l\u1EBB",
            value: unscheduledVal,
            colorClass: "bg-sky-500 dark:bg-sky-600"
          });
        }
      } else if (currentOrderType === "ecommerce") {
        const ecommerceVal = Number(day.revenue || 0);
        if (ecommerceVal > 0) {
          segments.push({
            label: "TM\u0110T",
            value: ecommerceVal,
            colorClass: "bg-pink-500 dark:bg-pink-600"
          });
        }
      } else if (currentOrderType === "dose_cut") {
        if (day.shifts && day.shifts.length > 0) {
          const shiftColors = [
            "bg-indigo-600 dark:bg-indigo-700",
            // Ca 1 (Indigo)
            "bg-violet-500 dark:bg-violet-600",
            // Ca 2 (Violet)
            "bg-fuchsia-500 dark:bg-fuchsia-600",
            // Ca 3 (Fuchsia)
            "bg-pink-500 dark:bg-pink-600",
            // Ca 4 (Pink)
            "bg-purple-500 dark:bg-purple-600"
            // Ca 5 (Purple)
          ];
          const sortedShifts = [...day.shifts].sort((a, b) => {
            const timeA = a.start_time || "00:00:00";
            const timeB = b.start_time || "00:00:00";
            return timeA.localeCompare(timeB);
          });
          day.shifts.forEach((s) => {
            if (s.revenue > 0) {
              const idx = sortedShifts.findIndex(
                (ss) => ss.name === s.name && ss.start_time === s.start_time && ss.end_time === s.end_time
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
            label: day.shifts && day.shifts.length > 0 ? "Ngo\xE0i ca" : "Thu\u1ED1c li\u1EC1u",
            value: unscheduledVal,
            colorClass: "bg-purple-400 dark:bg-purple-500"
          });
        }
      } else {
        if (day.shifts && day.shifts.length > 0) {
          const shiftColors = [
            "bg-blue-600 dark:bg-blue-700",
            // Ca 1 (Blue)
            "bg-amber-500 dark:bg-amber-600",
            // Ca 2 (Amber)
            "bg-violet-500 dark:bg-violet-600",
            // Ca 3 (Violet)
            "bg-emerald-500 dark:bg-emerald-600",
            // Ca 4 (Emerald)
            "bg-cyan-500 dark:bg-cyan-600"
            // Ca 5 (Cyan)
          ];
          const sortedShifts = [...day.shifts].sort((a, b) => {
            const timeA = a.start_time || "00:00:00";
            const timeB = b.start_time || "00:00:00";
            return timeA.localeCompare(timeB);
          });
          day.shifts.forEach((s) => {
            if (s.revenue > 0) {
              const idx = sortedShifts.findIndex(
                (ss) => ss.name === s.name && ss.start_time === s.start_time && ss.end_time === s.end_time
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
            label: day.shifts && day.shifts.length > 0 ? "Ngo\xE0i ca" : "B\xE1n l\u1EBB",
            value: unscheduledVal,
            colorClass: "bg-blue-600 dark:bg-blue-700"
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
        totalHeight = 8;
      }
      if (isToday && segments.length === 1) {
        segments[0].colorClass = "bg-emerald-600";
      }
      const scaledSegments = sourceTotal > 0 && targetTotal > 0 ? segments.map((seg) => ({
        ...seg,
        value: targetTotal * (seg.value / sourceTotal)
      })) : segments;
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
      const tooltip = isZeroDay ? "Kh\xF4ng c\xF3 doanh thu" : renderedSegments.map((seg) => `${seg.label}: ${formatCurrency(seg.value)}`).join(" | ");
      const segmentsHtml = isZeroDay ? "" : renderedSegments.map((seg) => `
            <div class="w-full ${seg.colorClass}" style="height:${seg.height}px" title="${seg.label}: ${formatCurrency(seg.value)}"></div>
        `).join("");
      return `
            <div class="flex-1 min-w-14 flex flex-col items-center justify-end gap-3 group relative">
                <!-- Tooltip hi\u1EC7n khi di chu\u1ED9t -->
                <div class="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold rounded px-2 py-1 shadow-md z-30 whitespace-nowrap pointer-events-none">
                    ${tooltip}
                </div>
                
                <!-- C\u1ED9t ch\u1ED3ng ho\u1EB7c c\u1ED9t x\xE1m nh\u1EA1t n\u1EBFu 0\u0111 -->
                <div class="w-full max-w-10 flex flex-col justify-end rounded-t-xl overflow-hidden shadow-sm transition-all duration-300 ${isZeroDay ? "bg-slate-200 dark:bg-slate-800" : ""}" style="height:${totalHeight}px">
                    ${segmentsHtml}
                </div>
                
                <div class="text-[10px] font-black ${isToday ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}">${formatDate(dayKey)}</div>
            </div>
        `;
    }).join("");
  }
  function productRow(product, index) {
    const profitClass = product.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
    const stockText = product.stock === null || product.stock === void 0 ? "-" : formatNumber(product.stock);
    const stockClass = product.isLowStock ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300";
    const highlightClass = reportMode === "missing-cost" && product.missingCost ? "bg-amber-50 dark:bg-amber-900/10" : product.isLowStock ? "bg-red-50/60 dark:bg-red-900/10" : "bg-white dark:bg-slate-900";
    if (currentOrderType === "dose_cut") {
      const isIngredientMode = reportMode === "revenue" || reportMode === "missing-cost";
      const valueClass = isIngredientMode ? product.cost > 0 ? "text-amber-600 dark:text-amber-500" : "text-slate-400" : "text-blue-600 dark:text-blue-400";
      const value = isIngredientMode ? product.cost : product.revenue;
      return `
        <tr class="group ${highlightClass} transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="py-4 px-4 border-y border-l border-slate-200 dark:border-slate-800 rounded-l-2xl font-black text-slate-400 text-xs">${index + 1}</td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800">
                <div class="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">${escapeHTML(product.name)}</div>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>${escapeHTML(product.code || "Ch\u01B0a c\xF3 m\xE3")}</span>
                    <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>${escapeHTML(product.unit || "\u0110\u01A1n v\u1ECB")}</span>
                    ${isIngredientMode && product.missingCost ? '<span class="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Thi\u1EBFu gi\xE1 v\u1ED1n</span>' : ""}
                    ${product.isLowStock ? '<span class="px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">T\u1ED3n th\u1EA5p</span>' : ""}
                </div>
            </td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right font-black text-slate-900 dark:text-white">${formatNumber(product.quantity)}</td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right font-black ${stockClass}">${stockText}</td>
            <td class="py-4 px-4 border-y border-r border-slate-200 dark:border-slate-800 rounded-r-2xl text-right font-black ${valueClass}">${formatCurrency(value)}</td>
        </tr>
    `;
    }
    if (currentOrderType === "ecommerce") {
      const costClass = product.cost > 0 ? "text-pink-600 dark:text-pink-400" : "text-slate-400";
      return `
        <tr class="group ${highlightClass} transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="py-4 px-4 border-y border-l border-slate-200 dark:border-slate-800 rounded-l-2xl font-black text-slate-400 text-xs">${index + 1}</td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800">
                <div class="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">${escapeHTML(product.name)}</div>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>${escapeHTML(product.code || "Ch\u01B0a c\xF3 m\xE3")}</span>
                    <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>${escapeHTML(product.unit || "\u0110\u01A1n v\u1ECB")}</span>
                    ${product.isLowStock ? '<span class="px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">T\u1ED3n th\u1EA5p</span>' : ""}
                </div>
            </td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right font-black text-slate-900 dark:text-white">${formatNumber(product.quantity)}</td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800 text-right font-black ${stockClass}">${stockText}</td>
            <td class="py-4 px-4 border-y border-r border-slate-200 dark:border-slate-800 rounded-r-2xl text-right font-black ${costClass}">${formatCurrency(product.cost)}</td>
        </tr>
    `;
    }
    if (employeeMode && currentOrderType !== "retail") {
      return `
        <tr class="group ${highlightClass} transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="py-4 px-4 border-y border-l border-slate-200 dark:border-slate-800 rounded-l-2xl font-black text-slate-400 text-xs">${index + 1}</td>
            <td class="py-4 px-4 border-y border-slate-200 dark:border-slate-800">
                <div class="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">${escapeHTML(product.name)}</div>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>${escapeHTML(product.code || "Ch\u01B0a c\xF3 m\xE3")}</span>
                    <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>${escapeHTML(product.unit || "\u0110\u01A1n v\u1ECB")}</span>
                    ${product.isLowStock ? '<span class="px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">T\u1ED3n th\u1EA5p</span>' : ""}
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
                    <span>${escapeHTML(product.code || "Ch\u01B0a c\xF3 m\xE3")}</span>
                    <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>${escapeHTML(product.unit || "\u0110\u01A1n v\u1ECB")}</span>
                    ${product.missingCost ? '<span class="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Thi\u1EBFu gi\xE1 v\u1ED1n</span>' : ""}
                    ${product.isLowStock ? '<span class="px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">T\u1ED3n th\u1EA5p</span>' : ""}
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
    if (currentOrderType === "dose_cut") {
      const isIngredientMode = reportMode === "revenue" || reportMode === "missing-cost";
      const source = isIngredientMode ? currentAnalytics.doseIngredientPerformance || [] : currentAnalytics.productPerformance || [];
      return [...source].filter((product) => reportMode !== "missing-cost" || product.missingCost > 0).filter((product) => `${product.name} ${product.code}`.toLowerCase().includes(keyword)).sort((a, b) => {
        if (reportMode === "missing-cost") return b.missingCost - a.missingCost || b.cost - a.cost;
        if (isIngredientMode) return b.cost - a.cost || b.quantity - a.quantity;
        return b.revenue - a.revenue || b.quantity - a.quantity;
      }).slice(0, 80);
    }
    if (currentOrderType === "retail") {
      return [...currentAnalytics.productPerformance].filter((product) => reportMode !== "missing-cost" || product.missingCost > 0).filter((product) => `${product.name} ${product.code}`.toLowerCase().includes(keyword)).sort((a, b) => {
        if (reportMode === "missing-cost") return b.missingCost - a.missingCost || b.revenue - a.revenue;
        return b.quantity - a.quantity || b.revenue - a.revenue;
      }).slice(0, 80);
    }
    return [...currentAnalytics.productPerformance].filter((product) => reportMode !== "missing-cost" || product.missingCost > 0).filter((product) => `${product.name} ${product.code}`.toLowerCase().includes(keyword)).sort(mode.sort).slice(0, 80);
  }
  function renderProductTable() {
    if (!currentAnalytics) return;
    const mode = REPORT_MODES[reportMode] || REPORT_MODES.quantity;
    const rows = getFilteredProducts();
    let title = mode.title;
    let hint = mode.hint;
    if (currentOrderType === "dose_cut") {
      if (reportMode === "revenue") {
        title = "Nguy\xEAn li\u1EC7u thu\u1ED1c li\u1EC1u h\xF4m nay";
        hint = "Ch\u1EC9 t\xEDnh gi\xE1 v\u1ED1n h\xE0ng \u0111\xE3 toggle nguy\xEAn li\u1EC7u thu\u1ED1c li\u1EC1u";
      } else if (reportMode === "missing-cost") {
        title = "Nguy\xEAn li\u1EC7u thu\u1ED1c li\u1EC1u thi\u1EBFu gi\xE1 v\u1ED1n";
        hint = "C\u1EA7n b\u1ED5 sung gi\xE1 v\u1ED1n cho nguy\xEAn li\u1EC7u thu\u1ED1c li\u1EC1u";
      } else {
        title = "Doanh thu thu\u1ED1c li\u1EC1u h\xF4m nay";
        hint = "Ch\u1EC9 t\xEDnh h\xE0ng \u0111\xE3 toggle b\xE1n l\u1EBB thu\u1ED1c li\u1EC1u";
      }
    } else if (currentOrderType === "retail") {
      if (reportMode === "missing-cost") {
        title = "M\u1EB7t h\xE0ng b\xE1n l\u1EBB thi\u1EBFu gi\xE1 v\u1ED1n";
        hint = "C\u1EA7n b\u1ED5 sung gi\xE1 v\u1ED1n \u0111\u1EC3 b\xE1o c\xE1o l\u1EE3i nhu\u1EADn b\xE1n l\u1EBB \u0111\xFAng";
      } else {
        title = "H\xE0ng h\xF3a b\xE1n l\u1EBB h\xF4m nay";
        hint = "G\u1ED3m s\u1ED1 l\u01B0\u1EE3ng b\xE1n, t\u1ED3n kho, doanh thu, gi\xE1 v\u1ED1n v\xE0 l\u1EE3i nhu\u1EADn theo m\u1EB7t h\xE0ng";
      }
    }
    document.getElementById("analysisTitle").textContent = title;
    const thead = document.querySelector("#productTableDetails table thead");
    if (thead) {
      if (currentOrderType === "dose_cut") {
        const isIngredientMode = reportMode === "revenue" || reportMode === "missing-cost";
        thead.innerHTML = `
                <tr class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    <th class="px-4 py-2 w-14">#</th>
                    <th class="px-4 py-2 min-w-72">${isIngredientMode ? "Nguy\xEAn li\u1EC7u" : "Thu\u1ED1c li\u1EC1u b\xE1n l\u1EBB"}</th>
                    <th class="px-4 py-2 text-right">${isIngredientMode ? "SL xu\u1EA5t" : "SL b\xE1n"}</th>
                    <th class="px-4 py-2 text-right">T\u1ED3n</th>
                    <th class="px-4 py-2 text-right border-r border-slate-200 dark:border-slate-800 rounded-r-2xl">${isIngredientMode ? "Gi\xE1 v\u1ED1n nguy\xEAn li\u1EC7u" : "Doanh thu thu\u1ED1c li\u1EC1u"}</th>
                </tr>
            `;
      } else if (currentOrderType === "ecommerce") {
        thead.innerHTML = `
                <tr class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    <th class="px-4 py-2 w-14">#</th>
                    <th class="px-4 py-2 min-w-72">M\u1EB7t h\xE0ng</th>
                    <th class="px-4 py-2 text-right">SL xu\u1EA5t</th>
                    <th class="px-4 py-2 text-right">T\u1ED3n</th>
                    <th class="px-4 py-2 text-right border-r border-slate-200 dark:border-slate-800 rounded-r-2xl">Gi\xE1 v\u1ED1n</th>
                </tr>
            `;
      } else if (employeeMode && currentOrderType !== "retail") {
        thead.innerHTML = `
                <tr class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    <th class="px-4 py-2 w-14">#</th>
                    <th class="px-4 py-2 min-w-72">M\u1EB7t h\xE0ng</th>
                    <th class="px-4 py-2 text-right">SL b\xE1n</th>
                    <th class="px-4 py-2 text-right">T\u1ED3n</th>
                    <th class="px-4 py-2 text-right border-r border-slate-200 dark:border-slate-800 rounded-r-2xl">Doanh thu</th>
                </tr>
            `;
      } else {
        thead.innerHTML = `
                <tr class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    <th class="px-4 py-2 w-14">#</th>
                    <th class="px-4 py-2 min-w-72">M\u1EB7t h\xE0ng</th>
                    <th class="px-4 py-2 text-right">SL b\xE1n</th>
                    <th class="px-4 py-2 text-right">T\u1ED3n</th>
                    <th class="px-4 py-2 text-right">Doanh thu</th>
                    <th class="px-4 py-2 text-right">Gi\xE1 v\u1ED1n</th>
                    <th class="px-4 py-2 text-right border-r border-slate-200 dark:border-slate-800 rounded-r-2xl">L\u1EE3i nhu\u1EADn</th>
                </tr>
            `;
      }
    }
    const colSpanVal = employeeMode && currentOrderType !== "retail" || currentOrderType === "ecommerce" || currentOrderType === "dose_cut" ? 5 : 7;
    document.getElementById("productTableBody").innerHTML = rows.length ? rows.map(productRow).join("") : `<tr><td colspan="${colSpanVal}" class="py-12 text-center text-sm font-bold text-slate-400">H\xF4m nay ch\u01B0a c\xF3 d\u1EEF li\u1EC7u ph\xF9 h\u1EE3p</td></tr>`;
    document.getElementById("productCountText").textContent = `${formatNumber(rows.length)} m\u1EB7t h\xE0ng - ${hint}`;
  }
  function renderEcommercePlatforms(platforms) {
    const section = document.getElementById("ecommercePlatformsSection");
    const container = document.getElementById("platformsContainer");
    if (!section || !container) return;
    if (currentOrderType !== "ecommerce" || !platforms || platforms.length === 0) {
      section.classList.add("hidden");
      return;
    }
    section.classList.remove("hidden");
    container.innerHTML = platforms.map((p) => `
        <div class="bg-pink-50/50 dark:bg-pink-900/20 p-4 rounded-xl border border-pink-100 dark:border-pink-800/50 flex flex-col gap-1">
            <span class="text-xs font-black text-pink-500 uppercase tracking-widest">${p.name}</span>
            <span class="text-xl font-black text-slate-800 dark:text-white">${formatCurrency(p.revenue)}</span>
            <span class="text-xs font-bold text-slate-500">${formatNumber(p.orders)} \u0111\u01A1n h\xE0ng</span>
        </div>
    `).join("");
  }
  function renderDoseStats(summary) {
    const section = document.getElementById("doseStatsSection");
    if (!section) return;
    if (currentOrderType !== "all") {
      section.classList.add("hidden");
      return;
    }
    section.classList.remove("hidden");
    const revenueVal = document.getElementById("doseRevenueVal");
    const costVal = document.getElementById("doseCostVal");
    const profitVal = document.getElementById("doseProfitVal");
    if (revenueVal) revenueVal.textContent = formatCurrency(summary.dosePackageRevenue || 0);
    const costCardLabel = costVal?.previousElementSibling;
    const profitCardLabel = profitVal?.previousElementSibling;
    if (employeeMode) {
      if (costCardLabel) costCardLabel.textContent = "S\u1ED1 l\u01B0\u1EE3ng g\xF3i li\u1EC1u b\xE1n ra";
      if (costVal) costVal.textContent = `${formatNumber(summary.doseItemsSold || 0)} g\xF3i`;
      if (profitCardLabel) {
        profitCardLabel.textContent = "T\u1EF7 tr\u1ECDng doanh thu li\u1EC1u";
        profitCardLabel.className = "text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest";
      }
      if (profitVal) {
        const pct = summary.retailRevenue ? (summary.dosePackageRevenue || 0) / summary.retailRevenue * 100 : 0;
        profitVal.textContent = `${formatNumber(pct)}% doanh thu b\xE1n l\u1EBB`;
        profitVal.className = "text-xl font-black text-emerald-600 dark:text-emerald-400";
      }
    } else {
      if (costCardLabel) costCardLabel.textContent = "V\u1ED1n \u0111\u1ECBnh l\u01B0\u1EE3ng";
      if (costVal) {
        let valText = formatCurrency(summary.doseIngredientCost || 0);
        if (summary.doseIngredientPOSCost > 0 || summary.doseIngredientInternalCost > 0) {
          const posStr = formatCurrency(summary.doseIngredientPOSCost || 0);
          const intStr = formatCurrency(summary.doseIngredientInternalCost || 0);
          valText += `<span class="text-[11px] text-slate-500 font-bold block mt-1">(POS: ${posStr} | Xu\u1EA5t kho: ${intStr})</span>`;
        }
        costVal.innerHTML = valText;
      }
      if (profitCardLabel) {
        profitCardLabel.textContent = "L\u1EE3i nhu\u1EADn c\u1EAFt li\u1EC1u";
        profitCardLabel.className = "text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest";
      }
      if (profitVal) {
        const profit = summary.doseProfit || 0;
        profitVal.textContent = formatCurrency(profit);
        profitVal.className = "text-xl font-black " + (profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400");
      }
    }
  }
  function renderInternalIssues(issuesList, issuesSummary) {
    const section = document.getElementById("internalIssuesSection");
    if (!section) return;
    if (!issuesList || issuesList.length === 0) {
      section.classList.add("hidden");
      return;
    }
    section.classList.remove("hidden");
    const totalCostEl = document.getElementById("internalTotalCost");
    const totalItemsEl = document.getElementById("internalTotalItems");
    const byReasonEl = document.getElementById("internalByReason");
    const byTargetEl = document.getElementById("internalByTarget");
    const tbody = document.getElementById("internalIssuesTableBody");
    if (totalCostEl) totalCostEl.textContent = formatCurrency(issuesSummary.totalCost || 0);
    if (totalItemsEl) totalItemsEl.textContent = formatNumber(issuesSummary.totalItems || 0);
    const getReasonLabel = (r) => {
      const labels = {
        "dose_cutting": "C\u1EAFt li\u1EC1u",
        "c\u1EAFt li\u1EC1u thu\u1ED1c": "C\u1EAFt li\u1EC1u",
        "usage": "Ti\xEAu hao n\u1ED9i b\u1ED9",
        "ti\xEAu hao n\u1ED9i b\u1ED9": "Ti\xEAu hao n\u1ED9i b\u1ED9",
        "damage": "H\u01B0 h\u1ECFng/V\u1EE1",
        "h\u01B0 h\u1ECFng": "H\u01B0 h\u1ECFng/V\u1EE1",
        "other": "Kh\xE1c"
      };
      return labels[r] || labels[r?.toLowerCase()] || r || "Kh\xE1c";
    };
    const getReasonColor = (r) => {
      const norm = String(r).toLowerCase();
      if (norm.includes("c\u1EAFt li\u1EC1u") || norm === "dose_cutting") return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
      if (norm.includes("ti\xEAu hao") || norm === "usage") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      if (norm.includes("h\u1ECFng") || norm === "damage") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    };
    if (byReasonEl) {
      byReasonEl.innerHTML = (issuesSummary.byReason || []).map((r) => `
            <div class="flex justify-between items-center bg-white dark:bg-slate-900 px-3 py-1.5 rounded border border-slate-100 dark:border-slate-800">
                <span class="text-xs font-bold text-slate-600 dark:text-slate-400">${getReasonLabel(r.label)}</span>
                <span class="text-xs font-black text-slate-800 dark:text-slate-200">${formatCurrency(r.value)}</span>
            </div>
        `).join("");
    }
    if (byTargetEl) {
      byTargetEl.innerHTML = (issuesSummary.byTarget || []).map((t) => `
            <div class="flex justify-between items-center bg-white dark:bg-slate-900 px-3 py-1.5 rounded border border-slate-100 dark:border-slate-800">
                <span class="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[150px]" title="${escapeHTML(t.label)}">${escapeHTML(t.label)}</span>
                <span class="text-xs font-black text-slate-800 dark:text-slate-200">${formatCurrency(t.value)}</span>
            </div>
        `).join("");
    }
    if (tbody) {
      tbody.innerHTML = issuesList.map((issue) => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="py-3 px-4">
                    <div class="text-[11px] font-black text-slate-900 dark:text-white">${formatDate(issue.date)}</div>
                    <div class="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">${escapeHTML(issue.targetName)}</div>
                </td>
                <td class="py-3 px-4">
                    <div class="text-xs font-bold text-slate-900 dark:text-white">${escapeHTML(issue.productName)}</div>
                    <div class="text-[10px] text-slate-500">${escapeHTML(issue.productCode)}</div>
                    ${issue.rawNote ? `<div class="text-[10px] text-slate-400 mt-0.5 italic">${escapeHTML(issue.rawNote)}</div>` : ""}
                </td>
                <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${getReasonColor(issue.reason)}">${getReasonLabel(issue.reason)}</span>
                </td>
                <td class="py-3 px-4 text-right">
                    <div class="text-xs font-black text-slate-900 dark:text-white">${formatNumber(issue.quantity)}</div>
                </td>
                <td class="py-3 px-4 text-right">
                    <div class="text-xs font-black text-rose-600 dark:text-rose-400">${formatCurrency(issue.totalCost)}</div>
                    <div class="text-[10px] text-slate-400">@${formatCurrency(issue.costPrice)}</div>
                </td>
            </tr>
        `).join("");
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
    renderInternalIssues(analytics.internalIssuesList, analytics.internalIssuesSummary);
    document.getElementById("rangeLabel").textContent = `${new Date(analytics.range.dateFrom).toLocaleDateString("vi-VN")} - ${new Date(analytics.range.dateTo).toLocaleDateString("vi-VN")}`;
  }
  async function loadDashboard() {
    setState("loading");
    try {
      const dateFrom = document.getElementById("dateFromInput")?.value || null;
      const dateTo = document.getElementById("dateToInput")?.value || null;
      const analytics = await fetchDashboardAnalytics(currentOrderType, dateFrom, dateTo);
      renderAnalytics(analytics);
      setState("ready");
    } catch (error) {
      console.error("[reports] L\u1ED7i t\u1EA3i b\xE1o c\xE1o:", error);
      const stackHTML = error.stack ? `<pre class="text-left bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-auto mt-2 text-xs font-mono text-red-600 max-w-full">${error.stack}</pre>` : "";
      setState("error", (error.message || "Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u b\xE1o c\xE1o.") + stackHTML);
    }
  }
  function updateEmployeeToggleUI() {
    const toggleContainer = document.getElementById("employeeModeToggleContainer");
    if (toggleContainer) {
      toggleContainer.classList.add("hidden");
    }
    const profitModeBtn = document.querySelector('[data-report-mode="profit"]');
    const missingCostModeBtn = document.querySelector('[data-report-mode="missing-cost"]');
    const highProfitBtn = document.querySelector('[data-business-insight="high-profit"]');
    const forceRetailFinancialTabs = currentOrderType === "retail";
    if (profitModeBtn) profitModeBtn.classList.toggle("hidden", currentOrderType === "retail" || employeeMode && !forceRetailFinancialTabs);
    if (missingCostModeBtn) missingCostModeBtn.classList.toggle("hidden", employeeMode && !forceRetailFinancialTabs);
    if (highProfitBtn) highProfitBtn.classList.toggle("hidden", employeeMode);
    if (currentOrderType === "retail" && (reportMode === "revenue" || reportMode === "profit")) {
      reportMode = "quantity";
      updateTabStyles();
    }
    if (employeeMode && !forceRetailFinancialTabs) {
      if (reportMode === "profit" || reportMode === "missing-cost") {
        reportMode = "quantity";
        updateTabStyles();
      }
      if (activeInsight === "high-profit") {
        activeInsight = "low-stock-hot";
      }
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    initLayout("admin", "overview");
    updateEmployeeToggleUI();
    const today = /* @__PURE__ */ new Date();
    const dateToVal = today.toISOString().split("T")[0];
    const dateFromVal = dateToVal;
    const dateFromInput = document.getElementById("dateFromInput");
    const dateToInput = document.getElementById("dateToInput");
    if (dateFromInput) dateFromInput.value = dateFromVal;
    if (dateToInput) dateToInput.value = dateToVal;
    dateFromInput?.addEventListener("change", () => loadDashboard());
    dateToInput?.addEventListener("change", () => loadDashboard());
    setActiveReportMode("quantity");
    loadDashboard();
    document.addEventListener("click", (event) => {
      const reportModeButton = event.target.closest("[data-report-mode]");
      if (reportModeButton) {
        setActiveReportMode(reportModeButton.dataset.reportMode);
        document.getElementById("productTableDetails")?.setAttribute("open", "");
      }
      const orderTypeBtn = event.target.closest("[data-order-type]");
      if (orderTypeBtn) {
        currentOrderType = orderTypeBtn.dataset.orderType;
        if (currentOrderType === "dose_cut" && reportMode === "profit") {
          reportMode = "quantity";
        }
        if (currentOrderType === "retail" && (reportMode === "revenue" || reportMode === "profit")) {
          reportMode = "quantity";
        }
        document.querySelectorAll("[data-order-type]").forEach((btn) => {
          const active = btn.dataset.orderType === currentOrderType;
          btn.classList.toggle("active", active);
          btn.classList.toggle("bg-white", active);
          btn.classList.toggle("dark:bg-slate-700", active);
          btn.classList.toggle("text-blue-600", active);
          btn.classList.toggle("dark:text-blue-400", active);
          btn.classList.toggle("shadow-sm", active);
          btn.classList.toggle("text-slate-600", !active);
          btn.classList.toggle("dark:text-slate-400", !active);
          btn.classList.toggle("hover:text-slate-900", !active);
          btn.classList.toggle("dark:hover:text-white", !active);
        });
        loadDashboard();
      }
      const actionButton = event.target.closest("[data-action]");
      if (actionButton?.dataset.action === "reload-dashboard") loadDashboard();
      const insightButton = event.target.closest("[data-business-insight]");
      if (insightButton) {
        activeInsight = insightButton.dataset.businessInsight;
        renderBusinessInsights();
        document.getElementById("businessInsightDetails")?.setAttribute("open", "");
      }
      const alertButton = event.target.closest("[data-insight-key]");
      if (alertButton) {
        const key = alertButton.dataset.insightKey;
        if (key === "low-stock-hot") {
          activeInsight = "low-stock-hot";
          renderBusinessInsights();
          document.getElementById("businessInsightDetails")?.setAttribute("open", "");
          document.getElementById("businessInsightSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (key === "missing-cost") {
          setActiveReportMode("missing-cost");
          document.getElementById("productTableDetails")?.setAttribute("open", "");
          document.getElementById("productSearch")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
    document.getElementById("productSearch")?.addEventListener("input", (event) => {
      productSearch = event.target.value.trim();
      if (productSearch) {
        document.getElementById("productTableDetails")?.setAttribute("open", "");
      }
      renderProductTable();
    });
  });
})();
