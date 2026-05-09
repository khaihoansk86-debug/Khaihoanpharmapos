# Khải Hoàn PharmaPos

Hệ thống POS & Quản lý Hàng hóa cho Nhà thuốc Khải Hoàn.

## 🚀 Tech Stack

- **Frontend:** Vanilla HTML + JavaScript (ES Modules)
- **Styling:** Tailwind CSS (CDN)
- **Database:** Supabase (PostgreSQL + Realtime)
- **Deploy:** Vercel

## 📁 Cấu trúc dự án

```
├── pages/                   # HTML pages
│   ├── products.html        # Quản lý Hàng hóa
│   ├── pos.html             # Bán hàng (POS)
│   └── invoices.html        # Tra soát Hóa đơn
│
├── js/
│   ├── core/
│   │   └── supabase.js      # Kết nối Supabase (dùng chung)
│   ├── components/
│   │   └── layout.js        # Header + Navigation + Dark Mode
│   └── features/
│       ├── products/        # Module Hàng hóa
│       ├── pos/             # Module POS / Hóa đơn
│       └── customers/       # Module Khách hàng (sắp ra mắt)
│
└── vercel.json              # Cấu hình routing deploy
```

## 🌿 Git Workflow

- **`main`** — Production (deploy Vercel tự động)
- **`develop`** — Staging / Tích hợp
- **`feature/[tên-module]`** — Phát triển tính năng mới

### Quy trình:
```
feature/xxx → develop → main
```

## 🛠️ Chạy local

Dự án là static HTML, mở trực tiếp bằng Live Server extension (VSCode) hoặc:

```bash
npx serve .
```

Truy cập: `http://localhost:3000`

## ⚙️ Cấu hình môi trường

Credential Supabase được hardcode trong `js/core/supabase.js`.  
Với Supabase **anon key** là thiết kế để public — bảo mật nằm ở **Row Level Security (RLS)** trên Supabase.

## 📋 Modules

| Module | Trạng thái | Branch |
|---|---|---|
| Hàng hóa (Products) | ✅ Hoạt động | `feature/product-management` |
| Bán hàng (POS) | ✅ Hoạt động | `feature/pos-cashier` |
| Hóa đơn (Invoices) | ✅ Hoạt động | `feature/invoices-controller` |
| Khách hàng | 🚧 Đang xây dựng | `feature/customer-management` |
| Tổng quan | 🚧 Đang xây dựng | `feature/dashboard-overview` |
| Mua hàng | 📋 Planned | — |
| Báo cáo | 📋 Planned | — |
