export async function runOfflineSyncTests() {
    console.log("=== BẮT ĐẦU CHẠY BỘ TEST ĐỒNG BỘ OFFLINE TOÀN DIỆN ===");

    let testModal = document.getElementById('testOfflineModal');
    if (testModal) testModal.remove();

    testModal = document.createElement('div');
    testModal.id = 'testOfflineModal';
    testModal.className = 'fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4';
    testModal.innerHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 class="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <i class="fa-solid fa-flask text-indigo-500"></i> Báo Cáo Test Toàn Diện (4 Luồng Nghiệp Vụ)
                </h3>
                <button onclick="document.getElementById('testOfflineModal').remove()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-5 overflow-y-auto flex-1 font-mono text-sm bg-slate-900 text-slate-300" id="testLogContainer">
            </div>
        </div>
    `;
    document.body.appendChild(testModal);

    const log = (msg, status = 'info') => {
        const container = document.getElementById('testLogContainer');
        const color = status === 'pass' ? 'text-green-400' : (status === 'fail' ? 'text-red-400' : (status === 'header' ? 'text-yellow-400 font-bold mt-4 mb-2 text-base' : 'text-slate-300'));
        const icon = status === 'pass' ? '✓' : (status === 'fail' ? '✗' : (status === 'header' ? '➤' : 'ℹ'));
        container.innerHTML += `<div class="${color} mb-1 flex gap-2"><span>[${icon}]</span><span style="word-break: break-all">${msg}</span></div>`;
        container.scrollTop = container.scrollHeight;
    };

    const originalConsoleError = console.error;
    console.error = (...args) => {
        const msg = args.map(a => typeof a === 'object' ? (a.message || JSON.stringify(a)) : a).join(' ');
        log(`INTERNAL ERROR: ${msg}`, 'fail');
        originalConsoleError.apply(console, args);
    };

    try {
        const m = await import('../../core/supabase.js');
        const client = m.supabaseClient;

        const { data: batches, error: bErr } = await client
            .from('product_batches')
            .select('id, stock_quantity, product_id, batch_number, products(name, product_units(unit_name, retail_price, conversion_rate))')
            .gt('stock_quantity', 10)
            .limit(1);

        if (bErr || !batches || batches.length === 0) {
            log('Không tìm thấy sản phẩm nào có tồn kho > 10 để test.', 'fail');
            return;
        }
        const testBatch = batches[0];
        const testUnit = testBatch.products.product_units[0];
        const testPrice = testUnit.retail_price;

        const { data: activeShifts, error: sErr } = await client
            .from('employee_shifts')
            .select('id, cash_amount, sales_amount, employee_id')
            .eq('status', 'worked')
            .eq('is_closed', false)
            .order('created_at', { ascending: false })
            .limit(1);

        if (sErr || !activeShifts || activeShifts.length === 0) {
            log('Chưa có ca làm việc nào đang mở!', 'fail');
            return;
        }
        const currentShift = activeShifts[0];

        const testCases = [
            { id: 'sale', name: '1. Bán lẻ thông thường (Sale)', type: 'sale', qty: 1, expectCashInc: true, expectSalesInc: true, expectStockDec: true },
            { id: 'internal', name: '2. Xuất nội bộ (Internal)', type: 'internal', qty: 1, expectCashInc: false, expectSalesInc: false, expectStockDec: true },
            { id: 'dose_cut', name: '3. Cắt liều (Dose Cut)', type: 'dose_cut', qty: 1, expectCashInc: true, expectSalesInc: true, expectStockDec: true }
        ];

        let totalSuccess = 0;

        for (const tc of testCases) {
            log(`=== KIỂM THỬ LUỒNG: ${tc.name} ===`, 'header');
            
            // Lấy state hiện tại trước khi test
            const { data: currentB } = await client.from('product_batches').select('stock_quantity').eq('id', testBatch.id).single();
            const { data: currentS } = await client.from('employee_shifts').select('cash_amount, sales_amount').eq('id', currentShift.id).single();
            
            const initialStock = currentB.stock_quantity;
            const initialCash = currentS.cash_amount || 0;
            const initialSales = currentS.sales_amount || 0;
            const testTotal = testPrice * tc.qty;

            const fakeOrderCode = 'TEST-' + tc.type.toUpperCase() + '-' + Date.now();
            const fakeCart = [{
                id: testBatch.product_id,
                name: testBatch.products.name,
                quantity: tc.qty,
                price: testPrice,
                unit: testUnit.unit_name,
                batchId: testBatch.id,
                batchNo: testBatch.batch_number,
                conversion_rate: testUnit.conversion_rate
            }];
            const fakeOrderData = {
                orderCode: fakeOrderCode,
                orderType: tc.type === 'sale' ? 'retail' : tc.type,
                total: testTotal,
                subtotal: testTotal,
                discount: 0,
                amountReceived: tc.expectCashInc ? testTotal : 0,
                paymentMethod: 'cash',
                customer_name: 'Khách Test Auto'
            };

            const offlineOrder = {
                id: 'offline_' + Date.now(),
                type: tc.type,
                timestamp: Date.now(),
                orderData: fakeOrderData,
                cartItems: fakeCart,
                employeeId: currentShift.employee_id
            };

            localStorage.setItem('pos_offline_orders', JSON.stringify([offlineOrder]));
            log(`Đã đẩy Đơn [${tc.type}] vào hàng đợi Offline.`);

            if (typeof window.syncOfflineOrders === 'function') {
                await window.syncOfflineOrders();
            } else {
                window.dispatchEvent(new Event('online'));
                await new Promise(r => setTimeout(r, 5000));
            }

            const remainingOffline = JSON.parse(localStorage.getItem('pos_offline_orders') || '[]');
            if (remainingOffline.length > 0) {
                log('Thất bại: Đơn hàng vẫn kẹt trong LocalStorage!', 'fail');
                continue;
            }

            let passed = true;

            // Kiểm tra Database
            const { data: newB } = await client.from('product_batches').select('stock_quantity').eq('id', testBatch.id).single();
            const expectedStock = tc.expectStockDec ? initialStock - tc.qty : initialStock;
            if (newB.stock_quantity === expectedStock) {
                log(`[Kho] Tồn kho nhảy ĐÚNG: ${initialStock} -> ${newB.stock_quantity}`, 'pass');
            } else {
                log(`[Kho] Tồn kho SAI: Cũ = ${initialStock}, Mới = ${newB.stock_quantity}, Mong đợi = ${expectedStock}`, 'fail');
                passed = false;
            }

            const { data: newS } = await client.from('employee_shifts').select('cash_amount, sales_amount').eq('id', currentShift.id).single();
            const expectedCash = tc.expectCashInc ? initialCash + testTotal : initialCash;
            if (newS.cash_amount === expectedCash) {
                log(`[Tiền Ca] Tiền mặt ĐÚNG: ${initialCash} -> ${newS.cash_amount}`, 'pass');
            } else {
                log(`[Tiền Ca] Tiền mặt SAI: Cũ = ${initialCash}, Mới = ${newS.cash_amount}, Mong đợi = ${expectedCash}`, 'fail');
                passed = false;
            }

            const expectedSales = tc.expectSalesInc ? initialSales + testTotal : initialSales;
            if (newS.sales_amount === expectedSales) {
                log(`[Doanh Số NV] Doanh số ĐÚNG: ${initialSales} -> ${newS.sales_amount}`, 'pass');
            } else {
                log(`[Doanh Số NV] Doanh số SAI: Cũ = ${initialSales}, Mới = ${newS.sales_amount}, Mong đợi = ${expectedSales}`, 'fail');
                passed = false;
            }

            if (passed) totalSuccess++;
        }

        log('==================================================', 'info');
        if (totalSuccess === testCases.length) {
            log(`🎉 HOÀN HẢO! Đã pass ${totalSuccess}/${testCases.length} luồng nghiệp vụ.`, 'pass');
        } else {
            log(`⚠️ HOÀN TẤT VỚI LỖI: Chỉ pass ${totalSuccess}/${testCases.length} luồng.`, 'fail');
        }

    } catch (err) {
        log(`Lỗi hệ thống: ${err.message}`, 'fail');
    } finally {
        console.error = originalConsoleError;
    }
}
window.runOfflineSyncTests = runOfflineSyncTests;
