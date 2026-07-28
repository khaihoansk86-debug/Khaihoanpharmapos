// api/report.js
// -----------------------------------------------------------------------------
// API Báo cáo Tổng hợp POS Khải Hoàn (Dành cho Bot Telegram/Zalo)
// Bảo mật: Truyền token qua Authorization Header (Bearer) hoặc URL param (?token=)
// -----------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iejgtdcdzababydaqjef.supabase.co';
// Ưu tiên sử dụng service_role key nếu có để bỏ qua RLS, ngược lại dùng anon key
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';

// Helper lấy khoảng thời gian ngày hôm nay (00:00:00 - 23:59:59) theo múi giờ Việt Nam (UTC+7)
function getTodayRangeInVN() {
    const now = new Date();
    // Chuyển dịch giờ server sang múi giờ VN (UTC+7)
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    
    const year = vnTime.getUTCFullYear();
    const month = vnTime.getUTCMonth();
    const date = vnTime.getUTCDate();
    
    // Tạo mốc thời gian bắt đầu và kết thúc ngày ở UTC tương ứng với UTC+7
    const start = new Date(Date.UTC(year, month, date, 0 - 7, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, date, 23 - 7, 59, 59, 999));
    
    return {
        start: start.toISOString(),
        end: end.toISOString(),
        dateStr: `${String(date).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`
    };
}

export default async function handler(req, res) {
    // 1. Kiểm tra CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        return res.end();
    }

    // 2. Xác thực Token bảo mật
    const apiSecretToken = String(process.env.API_SECRET_TOKEN || '').trim();
    if (!apiSecretToken) {
        res.writeHead(503, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        return res.end(JSON.stringify({ error: 'Server configuration error.' }));
    }

    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else {
        // Hỗ trợ truyền qua URL query
        const urlParams = new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams;
        token = urlParams.get('token') || '';
    }

    if (token !== apiSecretToken) {
        res.writeHead(401, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        return res.end(JSON.stringify({ error: 'Unauthorized. Invalid or missing secret token.' }));
    }

    try {
        const { start, end, dateStr } = getTodayRangeInVN();

        // Headers gọi Supabase REST API
        const supabaseHeaders = {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        };

        // 3. Truy vấn danh sách Hóa đơn trong ngày hôm nay
        // Lấy thông tin doanh thu, trạng thái và chi tiết mặt hàng đã bán
        const ordersUrl = `${SUPABASE_URL}/rest/v1/orders?created_at=gte.${start}&created_at=lte.${end}&select=id,total,discount,status,order_type,order_items(quantity,unit_price,total_price,products(name))`;
        
        const ordersResponse = await fetch(ordersUrl, { headers: supabaseHeaders });
        if (!ordersResponse.ok) {
            const errorText = await ordersResponse.text();
            throw new Error(`Supabase orders query failed: ${errorText}`);
        }
        const orders = await ordersResponse.json();

        // Tính toán các chỉ số bán hàng
        let totalRevenue = 0;
        let totalOrders = 0;
        const productSales = {};

        if (Array.isArray(orders)) {
            orders.forEach(order => {
                // Chỉ thống kê các hóa đơn hoàn thành hoặc không bị hủy/thất bại
                if (order.status !== 'cancelled' && order.status !== 'failed') {
                    totalRevenue += Number(order.total || 0);
                    totalOrders++;

                    if (Array.isArray(order.order_items)) {
                        order.order_items.forEach(item => {
                            const name = item.products?.name || 'Sản phẩm ẩn';
                            productSales[name] = (productSales[name] || 0) + Number(item.quantity || 0);
                        });
                    }
                }
            });
        }

        // Tạo danh sách top 5 sản phẩm bán chạy nhất trong ngày
        const topProducts = Object.entries(productSales)
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        // 4. Truy vấn Danh sách hàng hóa & lô hàng hoạt động để cảnh báo tồn kho
        const productsUrl = `${SUPABASE_URL}/rest/v1/products?select=id,name,product_code,is_active,product_batches(batch_number,stock_quantity,expiry_date)&is_active=eq.true`;
        
        const productsResponse = await fetch(productsUrl, { headers: supabaseHeaders });
        if (!productsResponse.ok) {
            const errorText = await productsResponse.text();
            throw new Error(`Supabase products query failed: ${errorText}`);
        }
        const products = await productsResponse.json();

        let lowStockCount = 0;
        let expiredOrExpiringCount = 0;
        const lowStockItems = [];
        const expiringItems = [];

        // Mốc thời gian hết hạn (lô hàng hết hạn hoặc sẽ hết hạn trong 30 ngày tới)
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        if (Array.isArray(products)) {
            products.forEach(p => {
                let totalStock = 0;
                if (Array.isArray(p.product_batches)) {
                    p.product_batches.forEach(b => {
                        const qty = Number(b.stock_quantity || 0);
                        totalStock += qty;

                        if (b.expiry_date) {
                            const expDate = new Date(b.expiry_date);
                            if (expDate <= thirtyDaysFromNow) {
                                expiredOrExpiringCount++;
                                expiringItems.push({
                                    product_name: p.name,
                                    product_code: p.product_code,
                                    batch_number: b.batch_number,
                                    expiry_date: b.expiry_date,
                                    stock_quantity: qty
                                });
                            }
                        }
                    });
                }

                // Cảnh báo hết hàng nếu tổng tồn kho của sản phẩm dưới hoặc bằng 10
                if (totalStock <= 10) {
                    lowStockCount++;
                    lowStockItems.push({
                        product_name: p.name,
                        product_code: p.product_code,
                        stock: totalStock
                    });
                }
            });
        }

        // 5. Trả về kết quả tổng hợp báo cáo POS
        const report = {
            timestamp: new Date().toISOString(),
            date: dateStr,
            summary: {
                total_revenue: totalRevenue,
                total_orders: totalOrders,
                average_order_value: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
            },
            top_products: topProducts,
            inventory_alerts: {
                low_stock_count: lowStockCount,
                low_stock_items: lowStockItems.sort((a, b) => a.stock - b.stock).slice(0, 10), // Gợi ý 10 sản phẩm ít nhất
                expired_or_expiring_count: expiredOrExpiringCount,
                expired_or_expiring_items: expiringItems.slice(0, 10) // Gợi ý 10 lô sắp hết hạn nhất
            }
        };

        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(report, null, 2));

    } catch (err) {
        console.error('Lỗi API Báo cáo:', err);
        res.writeHead(500, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'Internal Server Error', details: err.message }));
    }
}
