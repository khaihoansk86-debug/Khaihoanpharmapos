import { fetchProducts, createCategory, fetchCategories, createProduct } from './productService.js';

let quickRowsCount = 0;

window.loadOneTimeProductsData = async () => {
    try {
        const products = await fetchProducts();
        const oneTimeProducts = products.filter(p => {
            if (p.description) {
                try {
                    const descObj = JSON.parse(p.description);
                    return descObj && descObj.is_one_time === true;
                } catch (e) {}
            }
            return false;
        });

        renderOneTimeProductsList(oneTimeProducts);

        const rowsContainer = document.getElementById('quick-add-rows');
        if (rowsContainer && rowsContainer.children.length === 0) {
            quickRowsCount = 0;
            rowsContainer.innerHTML = '';
            // Khởi tạo sẵn 3 dòng trống cho người dùng nhập nhanh
            window.addQuickRow();
            window.addQuickRow();
            window.addQuickRow();
        }
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu hàng bán 1 lần:", error);
        window.showToast?.("Lỗi khi tải danh sách: " + error.message, "error");
    }
};

function renderOneTimeProductsList(products) {
    const container = document.getElementById('one-time-products-list-container');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="py-8 text-center text-slate-500 font-medium bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    Chưa có mặt hàng bán một lần nào trong kho.
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = products.map(p => {
        const baseUnit = p.product_units?.find(u => u.is_base_unit) || {};
        const batches = p.product_batches || [];
        const totalStock = batches.reduce((sum, b) => sum + Number(b.stock_quantity || 0), 0);
        
        let expiryText = 'Không quản lý lô';
        const expiringBatch = batches.find(b => b.is_tracked);
        if (expiringBatch && expiringBatch.expiry_date !== '2099-12-31') {
            expiryText = new Date(expiringBatch.expiry_date).toLocaleDateString('vi-VN');
        }

        const moneyFmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-4 font-mono font-bold text-slate-500 text-xs">${p.product_code}</td>
                <td class="py-3 px-4 font-bold text-slate-800 dark:text-white">${p.name}</td>
                <td class="py-3 px-4 text-right font-bold text-slate-600 dark:text-slate-400">${moneyFmt.format(baseUnit.cost_price || 0)}</td>
                <td class="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400">${moneyFmt.format(baseUnit.retail_price || 0)}</td>
                <td class="py-3 px-4 text-black ${totalStock > 0 ? 'text-slate-800 dark:text-white' : 'text-red-500'}">${totalStock} ${baseUnit.unit_name || 'ĐVT'}</td>
                <td class="py-3 px-4 text-xs font-bold text-slate-500">${expiryText}</td>
                <td class="py-3 px-4 text-center">
                    <button onclick="window.deleteProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center transition-colors mx-auto" title="Xóa mặt hàng">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.addQuickRow = () => {
    const container = document.getElementById('quick-add-rows');
    if (!container) return;

    quickRowsCount++;
    const rowId = `quick-row-${quickRowsCount}`;
    const tr = document.createElement('tr');
    tr.id = rowId;
    tr.className = 'quick-row-item hover:bg-slate-50/70 dark:hover:bg-slate-950/40 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2';
    
    tr.innerHTML = `
        <td class="py-3 px-4 text-center font-bold text-slate-400 text-xs">${container.children.length + 1}</td>
        <td class="py-2 px-2">
            <input type="text" class="quick-name w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" required placeholder="Tên hàng khuyến mãi, quà tặng...">
        </td>
        <td class="py-2 px-1">
            <input type="text" class="quick-unit w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" required value="Viên" placeholder="Viên...">
        </td>
        <td class="py-2 px-1">
            <input type="number" class="quick-cost w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-right text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" min="0" placeholder="0">
        </td>
        <td class="py-2 px-1">
            <input type="number" class="quick-retail w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-right text-blue-600 dark:text-blue-400 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" required min="0" placeholder="0">
        </td>
        <td class="py-2 px-1">
            <div class="quick-conversions-list space-y-1.5 flex flex-col justify-center">
                <!-- Danh sách ĐVT quy đổi con sẽ render ở đây -->
            </div>
            <button type="button" class="add-conversion-unit-btn mt-1 text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 dark:text-emerald-450 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors">
                <i class="fa-solid fa-plus-circle"></i> Thêm ĐVT
            </button>
        </td>
        <td class="py-2 px-1">
            <input type="number" class="quick-stock w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-black text-right text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" required min="1" value="10">
        </td>
        <td class="py-2 px-2">
            <input type="date" class="quick-expiry w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-650 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
        </td>
        <td class="py-3 px-4 text-center">
            <button type="button" onclick="window.removeQuickRow('${rowId}')" class="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center transition-colors mx-auto" title="Xóa dòng này">
                <i class="fa-solid fa-xmark text-sm"></i>
            </button>
        </td>
    `;

    container.appendChild(tr);

    const conversionsList = tr.querySelector('.quick-conversions-list');
    const addConvBtn = tr.querySelector('.add-conversion-unit-btn');
    const unitInput = tr.querySelector('.quick-unit');

    // Hàm phụ thêm dòng quy đổi nhỏ
    const appendConversionItem = () => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'conversion-item flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150';
        const baseUnitText = unitInput.value.trim() || 'Viên';
        
        itemDiv.innerHTML = `
            <span class="text-slate-400 text-[10px]">1</span>
            <input type="text" class="quick-large-unit w-16 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-2 py-1 text-[10px] font-bold text-center text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" placeholder="Hộp/Vỉ...">
            <span class="text-slate-400 text-[10px]">=</span>
            <input type="number" class="quick-conversion w-12 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-1.5 py-1 text-[10px] font-mono font-bold text-center text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" min="2" placeholder="Tỷ lệ">
            <span class="quick-unit-label text-slate-400 text-[10px] font-black truncate max-w-[32px]">${baseUnitText}</span>
            <button type="button" class="remove-conversion-item text-slate-400 hover:text-red-500 transition-colors p-1" title="Xóa quy đổi này">
                <i class="fa-solid fa-xmark text-xs"></i>
            </button>
        `;

        itemDiv.querySelector('.remove-conversion-item').addEventListener('click', () => {
            itemDiv.classList.add('animate-out', 'fade-out', 'scale-95');
            setTimeout(() => itemDiv.remove(), 120);
        });

        conversionsList.appendChild(itemDiv);
    };

    // Khi click nút thêm quy đổi ĐVT
    addConvBtn.addEventListener('click', appendConversionItem);

    // Đồng bộ nhãn ĐVT Nhỏ khi người dùng gõ
    unitInput.addEventListener('input', () => {
        const baseUnitText = unitInput.value.trim() || 'Viên';
        tr.querySelectorAll('.quick-unit-label').forEach(label => {
            label.textContent = baseUnitText;
        });
    });

    // Mặc định tạo sẵn 1 dòng quy đổi đầu tiên để người dùng dễ nhìn thấy cách dùng
    appendConversionItem();

    // Bắt sự kiện nhấn Enter trong hàng để tự động thêm hàng mới
    tr.querySelectorAll('input').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.addQuickRow();
                // Focus vào ô tên hàng của hàng mới vừa tạo
                setTimeout(() => {
                    const newRows = container.querySelectorAll('.quick-row-item');
                    if (newRows.length > 0) {
                        const lastRow = newRows[newRows.length - 1];
                        lastRow.querySelector('.quick-name')?.focus();
                    }
                }, 50);
            }
        });
    });

    reindexQuickRows();
};

window.removeQuickRow = (rowId) => {
    const row = document.getElementById(rowId);
    if (!row) return;

    row.classList.add('animate-out', 'fade-out', 'slide-out-to-left-4', 'duration-200');
    setTimeout(() => {
        row.remove();
        reindexQuickRows();
        
        // Luôn đảm bảo có ít nhất 1 dòng
        const container = document.getElementById('quick-add-rows');
        if (container && container.children.length === 0) {
            window.addQuickRow();
        }
    }, 180);
};

function reindexQuickRows() {
    const container = document.getElementById('quick-add-rows');
    if (!container) return;

    Array.from(container.children).forEach((tr, index) => {
        const firstTd = tr.querySelector('td');
        if (firstTd) firstTd.textContent = index + 1;
    });

    const badge = document.getElementById('quick-items-count-badge');
    if (badge) {
        badge.textContent = `${container.children.length} dòng đang soạn thảo`;
    }
}

window.submitQuickAddOneTimeProducts = async () => {
    const container = document.getElementById('quick-add-rows');
    if (!container) return;

    const rows = container.querySelectorAll('.quick-row-item');
    const productsToCreate = [];

    // Lọc lấy các hàng có tên sản phẩm hợp lệ
    rows.forEach(row => {
        const name = row.querySelector('.quick-name').value.trim();
        const unit = row.querySelector('.quick-unit').value.trim() || 'Viên';
        const costPrice = parseFloat(row.querySelector('.quick-cost').value) || 0;
        const retailPrice = parseFloat(row.querySelector('.quick-retail').value) || 0;
        const stock = parseFloat(row.querySelector('.quick-stock').value) || 0;
        const expiry = row.querySelector('.quick-expiry').value;

        // Trích xuất danh sách tất cả các dòng quy đổi ĐVT
        const conversions = [];
        row.querySelectorAll('.conversion-item').forEach(itemEl => {
            const largeUnit = itemEl.querySelector('.quick-large-unit').value.trim();
            const conversionRate = parseFloat(itemEl.querySelector('.quick-conversion').value) || 1;
            if (largeUnit && conversionRate > 1) {
                conversions.push({ largeUnit, conversionRate });
            }
        });

        if (name) {
            productsToCreate.push({ name, unit, costPrice, retailPrice, conversions, stock, expiry });
        }
    });

    if (productsToCreate.length === 0) {
        window.showToast?.("Vui lòng điền thông tin của ít nhất 1 mặt hàng!", "error");
        return;
    }

    // Đẩy nút lưu về trạng thái loading
    const submitBtn = document.getElementById('submitQuickAddBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Đang tạo sản phẩm...';
    }
    window.showLoading?.("Đang tạo hàng loạt sản phẩm bán 1 lần...");

    try {
        // Tìm hoặc tạo nhóm hàng đặc thù "Quà tặng / Khuyến mãi" để gom nhóm quản lý
        const categories = await fetchCategories();
        let promoCategory = categories.find(cat => cat.name === 'Quà tặng / Khuyến mãi');
        if (!promoCategory) {
            promoCategory = await createCategory('Quà tặng / Khuyến mãi');
        }

        const categoryId = promoCategory.id;

        for (const item of productsToCreate) {
            // Sinh mã sản phẩm tự động có tiền tố KM (Khuyến Mãi)
            const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
            const productCode = `KM${Date.now().toString().slice(-6)}${randomSuffix}`;

            const productData = {
                name:              item.name,
                product_code:      productCode,
                category_id:       categoryId,
                is_active:         true,
                is_ecommerce:      false,
                is_direct_sale:    true,
                is_component_item: false,
                // Đánh dấu cờ is_one_time trong description JSON
                description:       JSON.stringify({ is_one_time: true })
            };

            const unitsData = [
                {
                    unit_name:       item.unit,
                    retail_price:    item.retailPrice,
                    cost_price:      item.costPrice,
                    conversion_rate: 1,
                    is_base_unit:    true
                }
            ];

            // Tự động thêm tất cả các quy cách đơn vị lớn quy đổi
            item.conversions.forEach(c => {
                unitsData.push({
                    unit_name:       c.largeUnit,
                    retail_price:    item.retailPrice * c.conversionRate,
                    cost_price:      item.costPrice * c.conversionRate,
                    conversion_rate: c.conversionRate,
                    is_base_unit:    false
                });
            });

            // Tồn kho được quy ước nhập theo ĐVT nhỏ nhất (ví dụ Viên)
            const batchData = [{
                batch_number:   'Lô KM',
                expiry_date:    item.expiry || '2099-12-31',
                stock_quantity: item.stock,
                is_tracked:     Boolean(item.expiry)
            }];

            await createProduct(productData, unitsData, batchData);
        }

        window.showToast?.(`Đã thêm thành công ${productsToCreate.length} sản phẩm bán 1 lần!`, "success");
        // Reset bảng nhập nhanh
        container.innerHTML = '';
        quickRowsCount = 0;
        window.addQuickRow();
        window.addQuickRow();
        window.addQuickRow();

        // Tải lại danh sách
        await window.loadOneTimeProductsData();

    } catch (error) {
        console.error("Lỗi khi thêm hàng loạt sản phẩm một lần:", error);
        window.showToast?.("Lỗi: " + error.message, "error", 5000);
    } finally {
        const actualSubmitBtn = document.getElementById('submitQuickAddBtn');
        if (actualSubmitBtn) {
            actualSubmitBtn.disabled = false;
            actualSubmitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> LƯU TẤT CẢ SẢN PHẨM';
        }
        window.hideLoading?.();
    }
};
