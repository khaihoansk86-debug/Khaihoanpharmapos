export async function runOfflineSyncTests() {
    console.log("=== BẮT ĐẦU CHẠY BỘ TEST ĐỒNG BỘ OFFLINE ===");
    
    let testModal = document.createElement('div');
    testModal.id = 'testOfflineModal';
    testModal.className = 'fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4';
    testModal.innerHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 class="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <i class="fa-solid fa-flask text-indigo-500"></i> Báo Cáo Test Đồng Bộ Offline
                </h3>
                <button onclick="document.getElementById('testOfflineModal').remove()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-5 overflow-y-auto flex-1 font-mono text-sm bg-slate-900 text-slate-300" id="testLogContainer">
                <div class="text-indigo-400 mb-4">Khởi động bộ test kiểm tra trừ tồn kho và cộng tiền ca...</div>
            </div>
        </div>
    `;
    document.body.appendChild(testModal);
    
    const log = (msg, status = 'info') => {
        const container = document.getElementById('testLogContainer');
        const color = status === 'pass' ? 'text-green-400' : (status === 'fail' ? 'text-red-400' : 'text-slate-300');
        const icon = status === 'pass' ? '✓' : (status === 'fail' ? '✗' : 'ℹ');
        container.innerHTML += `<div class="${color} mb-2 flex gap-2"><span>[${icon}]</span><span style="word-break: break-all">${msg}</span></div>`;
        container.scrollTop = container.scrollHeight;
    };
    
    // Catch internal console.error
    const originalConsoleError = console.error;
    console.error = (...args) => {
        const msg = args.map(a => typeof a === 'object' ? (a.message || JSON.stringify(a)) : a).join(' ');
        log(`INTERNAL ERROR: ${msg}`, 'fail');
        originalConsoleError.apply(console, args);
    };

    try {
        const m = await import('../../core/supabase.js');
        const client = m.supabaseClient;

        log('1. Đang tìm một sản phẩm bất kỳ trong kho để test...');
        const { data: batches, error: bErr } = await client
            .from('product_batches')
            .select('id, stock_quantity, product_id, batch_number, products(name, product_units(unit_name, retail_price, conversion_rate))')
            .gt('stock_quantity', 1)
            .limit(1);
            
        if (bErr || !batches || batches.length === 0) {
            log('Không tìm thấy sản phẩm nào có tồn kho > 1 để test.', 'fail');
            return;
        }
        const testBatch = batches[0];
        const initialStock = testBatch.stock_quantity;
        const testUnit = testBatch.products.product_units[0];
        const testPrice = testUnit.retail_price;
        const testQty = 1;
        const testTotal = testPrice * testQty;
        
        log(`Tìm thấy: ${testBatch.products.name} (Lô: ${testBatch.batch_number}). Tồn kho: ${initialStock}. Giá: ${testPrice.toLocaleString()}đ`, 'pass');

        log('2. Kiểm tra ca làm việc hiện tại...');
        // Tìm ca làm việc đang mở (is_closed = false)
        const { data: activeShifts, error: sErr } = await client
            .from('employee_shifts')
            .select('id, cash_amount, employee_id')
            .eq('status', 'worked')
            .eq('is_closed', false)
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (sErr || !activeShifts || activeShifts.length === 0) {
            log('Chưa có ca làm việc nào đang mở. Bộ test cần 1 ca đang hoạt động!', 'fail');
            return;
        }
        const currentShift = activeShifts[0];
        const initialRevenue = currentShift.cash_amount || 0;
        log(`Ca làm việc ID: ${currentShift.id}. Tiền mặt hiện tại: ${initialRevenue.toLocaleString()}đ`, 'pass');

        log('3. Đang tạo một đơn hàng Offline giả lập (1 mặt hàng)...');
        const fakeOrderCode = 'TEST-' + Date.now();
        const fakeCart = [{
            id: testBatch.product_id,
            name: testBatch.products.name,
            quantity: testQty,
            price: testPrice,
            unit: testUnit.unit_name,
            batchId: testBatch.id,
            batchNo: testBatch.batch_number,
            conversion_rate: testUnit.conversion_rate
        }];
        const fakeOrderData = {
            orderCode: fakeOrderCode,
            total: testTotal,
            subtotal: testTotal,
            discount: 0,
            amountReceived: testTotal,
            paymentMethod: 'cash',
            customer_name: 'Khách lẻ TEST'
        };
        
        const offlineOrder = {
            id: 'offline_' + Date.now(),
            type: 'sale',
            timestamp: Date.now(),
            orderData: fakeOrderData,
            cartItems: fakeCart,
            employeeId: currentShift.employee_id
        };
        
        localStorage.setItem('pos_offline_orders', JSON.stringify([offlineOrder]));
        log(`Đã lưu cache đơn Offline mã: ${fakeOrderCode}. Tổng tiền: ${testTotal.toLocaleString()}đ`, 'pass');

        log('4. Đang kích hoạt tiến trình đồng bộ Offline Sync (Chờ đến khi hoàn tất)...');
        
        // Gọi thẳng hàm syncOfflineOrders và await nó thay vì dùng event
        if (typeof window.syncOfflineOrders === 'function') {
            await window.syncOfflineOrders();
            log('Đồng bộ thành công, đã xử lý xong hàng đợi.', 'info');
        } else {
            window.dispatchEvent(new Event('online'));
            log('Đợi 6 giây cho tiến trình xử lý mạng chậm...', 'info');
            await new Promise(r => setTimeout(r, 6000)); 
        }

        const remainingOffline = JSON.parse(localStorage.getItem('pos_offline_orders') || '[]');
        if (remainingOffline.length > 0) {
            log('Cảnh báo: Đơn hàng vẫn còn kẹt trong cache LocalStorage.', 'fail');
        } else {
            log('Kiểm tra bộ nhớ Cache: Sạch sẽ! Đơn hàng đã được xóa khỏi hàng đợi.', 'pass');
        }

        log('5. Đang xác minh tính đúng đắn trên CSDL (Database)...');
        
        const { data: newBatch } = await client.from('product_batches').select('stock_quantity').eq('id', testBatch.id).single();
        if (newBatch.stock_quantity === initialStock - testQty) {
            log(`[Kho hàng] Tồn kho trừ ĐÚNG: ${initialStock} -> ${newBatch.stock_quantity}`, 'pass');
        } else {
            log(`[Kho hàng] Tồn kho SAI: Cũ = ${initialStock}, Mới = ${newBatch.stock_quantity}`, 'fail');
        }
        
        const { data: newShift } = await client.from('employee_shifts').select('cash_amount').eq('id', currentShift.id).single();
        if (newShift.cash_amount === initialRevenue + testTotal) {
            log(`[Sổ quỹ ca] Tiền ca cộng ĐÚNG: ${initialRevenue.toLocaleString()} -> ${newShift.cash_amount.toLocaleString()}`, 'pass');
        } else {
            log(`[Sổ quỹ ca] Tiền ca SAI: Cũ = ${initialRevenue}, Mới = ${newShift.cash_amount}`, 'fail');
        }
        
        const { data: orderCheck } = await client.from('orders').select('id, total').eq('order_code', fakeOrderCode).single();
        if (orderCheck) {
            log(`[Lịch sử đơn] Đơn hàng đã được tạo thành công trên DB (ID: ${orderCheck.id})`, 'pass');
        } else {
            log(`[Lịch sử đơn] KHÔNG TÌM THẤY đơn hàng trên Server.`, 'fail');
        }

        log('=== HOÀN TẤT KIỂM THỬ MỌI TRƯỜNG HỢP (KHO, TIỀN, CA) ===', 'info');

    } catch (err) {
        log(`Lỗi hệ thống trong lúc test: ${err.message}`, 'fail');
        console.error(err);
    } finally {
        console.error = originalConsoleError;
    }
}
window.runOfflineSyncTests = runOfflineSyncTests;
