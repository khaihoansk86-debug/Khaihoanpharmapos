const xlsx = require('xlsx');
const crypto = require('crypto');
const fs = require('fs');

const EXCEL_FILE = 'DanhSachSanPham_KV19052026-112609-939.xlsx';
const OUTPUT_SQL = 'combined_import.sql';

console.log('Đọc file Excel mới...');
const wb = xlsx.readFile(EXCEL_FILE);
const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

const GROUP_PREFIXES = ['Strepsils', 'Panadol', 'Decolgen', 'Salonpas', 'Bảo Thanh', 'Hapacol'];

let sql = `-- Script import tự động có xử lý Biến thể và Tồn kho Lô\n`;
sql += `BEGIN;\n\n`;

// Xóa dữ liệu cũ để tránh lỗi trùng lặp (Code) và lỗi Khóa ngoại (Foreign Key)
sql += `-- Xóa toàn bộ dữ liệu giao dịch cũ để tránh lỗi khóa ngoại\n`;
sql += `TRUNCATE TABLE public.inventory_movements CASCADE;\n`;
sql += `TRUNCATE TABLE public.inventory_document_items CASCADE;\n`;
sql += `TRUNCATE TABLE public.inventory_documents CASCADE;\n`;
sql += `TRUNCATE TABLE public.order_items CASCADE;\n`;
sql += `TRUNCATE TABLE public.orders CASCADE;\n`;
sql += `TRUNCATE TABLE public.purchase_order_items CASCADE;\n`;
sql += `TRUNCATE TABLE public.purchase_orders CASCADE;\n\n`;

sql += `-- Xóa danh mục hàng hóa cũ\n`;
sql += `TRUNCATE TABLE public.product_batches CASCADE;\n`;
sql += `TRUNCATE TABLE public.product_units CASCADE;\n`;
sql += `TRUNCATE TABLE public.related_products CASCADE;\n`;
sql += `TRUNCATE TABLE public.products CASCADE;\n`;
sql += `TRUNCATE TABLE public.categories CASCADE;\n\n`;

// 1. Lấy danh sách Categories
const categories = {};
data.forEach(row => {
    const catName = row['Nhóm hàng(3 Cấp)'] || 'Chưa phân loại';
    if (!categories[catName]) {
        categories[catName] = crypto.randomUUID();
        sql += `INSERT INTO public.categories (id, name) VALUES ('${categories[catName]}', '${catName.replace(/'/g, "''")}');\n`;
    }
});
sql += '\n';

// 2. Xử lý Sản phẩm cha
const parentProducts = {};
const productMap = {}; 

const baseItems = data.filter(r => !r['Mã ĐVT Cơ bản']);
const unitItems = data.filter(r => r['Mã ĐVT Cơ bản']);

function formatExpiryDate(dateStr) {
    if (!dateStr || String(dateStr).trim() === '') return null;
    // Tùy định dạng Excel, nếu là chuỗi DD/MM/YYYY
    let d = String(dateStr).trim();
    if (d.includes('/')) {
        let parts = d.split('/');
        if (parts.length === 3) return `'${parts[2]}-${parts[1]}-${parts[0]}'`;
        if (parts.length === 2) return `'${parts[1]}-${parts[0]}-01'`;
    }
    // Nếu Excel lưu dạng số seri ngày (rất hiếm trong xuất CSV text)
    if (!isNaN(d) && Number(d) > 10000) {
        let date = new Date((d - 25569) * 86400 * 1000);
        return `'${date.toISOString().split('T')[0]}'`;
    }
    return null;
}

baseItems.forEach(row => {
    let name = row['Tên hàng'].trim();
    let code = row['Mã hàng'].trim();
    let catId = categories[row['Nhóm hàng(3 Cấp)'] || 'Chưa phân loại'];
    
    let parentId = null;
    let variantLabel = null;

    for (const prefix of GROUP_PREFIXES) {
        if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
            if (!parentProducts[prefix]) {
                parentProducts[prefix] = crypto.randomUUID();
                sql += `INSERT INTO public.products (id, category_id, product_code, name, is_active, is_direct_sale) 
                        VALUES ('${parentProducts[prefix]}', '${catId}', 'PARENT_${prefix.toUpperCase()}', '${prefix}', true, false);\n`;
            }
            parentId = parentProducts[prefix];
            variantLabel = name.substring(prefix.length).trim().replace(/^\-/, '').trim();
            if (!variantLabel) variantLabel = 'Mặc định';
            break;
        }
    }

    let productId = crypto.randomUUID();
    productMap[code] = { id: productId, name: name };

    let price = Number(row['Giá bán']) || 0;
    let cost = Number(row['Giá vốn']) || 0;
    let barcode = row['Mã vạch'] ? `'${row['Mã vạch']}'` : 'NULL';
    let pIdStr = parentId ? `'${parentId}'` : 'NULL';
    let vLabelStr = variantLabel ? `'${variantLabel.replace(/'/g, "''")}'` : 'NULL';

    // Insert Product
    sql += `INSERT INTO public.products (id, category_id, product_code, barcode, name, is_active, parent_id, variant_label) 
            VALUES ('${productId}', '${catId}', '${code}', ${barcode}, '${name.replace(/'/g, "''")}', true, ${pIdStr}, ${vLabelStr});\n`;
    
    // Đơn vị tính cơ bản
    let unitName = row['ĐVT'] || 'Viên';
    sql += `INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price)
            VALUES ('${crypto.randomUUID()}', '${productId}', '${unitName.replace(/'/g, "''")}', 1, true, ${cost}, ${price});\n`;

    // TỒN KHO VÀ LÔ
    let totalStock = Number(row['Tồn kho']) || 0;
    let hasBatch = false;
    
    for (let i = 1; i <= 6; i++) {
        let batchNo = row[`Lô ${i}`];
        let expDate = row[`Hạn sử dụng ${i}`];
        let stock = Number(row[`Tồn ${i}`]);

        if (batchNo || expDate || stock > 0) {
            hasBatch = true;
            let formattedExp = formatExpiryDate(expDate) || "'2099-12-31'";
            let bNo = batchNo ? `'${String(batchNo).replace(/'/g, "''")}'` : "'LO-MACDINH'";
            let stk = isNaN(stock) ? 0 : stock;
            
            sql += `INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                    VALUES ('${crypto.randomUUID()}', '${productId}', ${bNo}, ${formattedExp}, ${stk}, ${cost});\n`;
        }
    }

    // Nếu không có lô nào chia nhỏ, nhưng có tổng tồn kho > 0
    if (!hasBatch && totalStock > 0) {
        sql += `INSERT INTO public.product_batches (id, product_id, batch_number, expiry_date, stock_quantity, cost_price)
                VALUES ('${crypto.randomUUID()}', '${productId}', 'LO-MACDINH', '2099-12-31', ${totalStock}, ${cost});\n`;
    }
});

sql += '\n';

// 3. Xử lý các Đơn vị quy đổi
unitItems.forEach(row => {
    let baseCode = row['Mã ĐVT Cơ bản'].trim();
    let baseProduct = productMap[baseCode];
    
    if (baseProduct) {
        let unitName = row['ĐVT'] || 'Hộp';
        let rate = Number(row['Quy đổi']) || 1;
        let price = Number(row['Giá bán']) || 0;
        let cost = Number(row['Giá vốn']) || 0;
        let barcode = row['Mã vạch'] ? `'${row['Mã vạch']}'` : 'NULL';

        sql += `INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, is_base_unit, cost_price, retail_price, barcode)
                VALUES ('${crypto.randomUUID()}', '${baseProduct.id}', '${unitName.replace(/'/g, "''")}', ${rate}, false, ${cost}, ${price}, ${barcode});\n`;
    }
});

sql += `\nCOMMIT;\n`;

fs.writeFileSync(OUTPUT_SQL, sql, 'utf8');
console.log(`Đã tạo thành công file ${OUTPUT_SQL} với dung lượng ${(fs.statSync(OUTPUT_SQL).size / 1024).toFixed(2)} KB.`);
