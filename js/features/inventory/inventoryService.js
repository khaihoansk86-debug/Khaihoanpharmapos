import { supabaseClient } from '../../core/supabase.js';

async function fetchAll(table, select, orderColumn) {
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
        let query = supabaseClient.from(table).select(select).range(page * pageSize, (page + 1) * pageSize - 1);
        if (orderColumn) {
            query = query.order(orderColumn, { ascending: true });
        }
        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        page++;
    }
    return allData;
}

export async function fetchInventoryProducts() {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');

    let productsPromise = fetchAll('products', 'id, product_code, barcode, name, is_active, categories(name)', 'name');
    let unitsPromise = fetchAll('product_units', 'id, product_id, unit_name, retail_price, cost_price, conversion_rate, is_base_unit');
    let batchesPromise = fetchAll('product_batches', 'id, product_id, batch_number, stock_quantity, expiry_date, is_tracked, cost_price')
        .catch(async (err) => {
            if (err.message?.includes('cost_price') || err.message?.includes('schema cache')) {
                return fetchAll('product_batches', 'id, product_id, batch_number, stock_quantity, expiry_date, is_tracked');
            }
            throw err;
        });

    const [products, units, batches] = await Promise.all([productsPromise, unitsPromise, batchesPromise]);

    const unitsByProduct = new Map();
    units.forEach(u => {
        if (!unitsByProduct.has(u.product_id)) unitsByProduct.set(u.product_id, []);
        unitsByProduct.get(u.product_id).push(u);
    });

    const batchesByProduct = new Map();
    batches.forEach(b => {
        if (!batchesByProduct.has(b.product_id)) batchesByProduct.set(b.product_id, []);
        batchesByProduct.get(b.product_id).push(b);
    });

    return products.map(p => ({
        ...p,
        product_units: unitsByProduct.get(p.id) || [],
        product_batches: batchesByProduct.get(p.id) || []
    }));
}

async function logMovement(payload) {
    const { error } = await supabaseClient
        .from('inventory_movements')
        .insert([payload]);

    if (error) {
        console.warn('Không ghi được inventory_movements:', error.message);
    }
}

async function retryReceiveWithoutBatchCost({ productId, batchNumber, expiryDate, quantity, reason, note }) {
    const qty = Number(quantity || 0);
    const { data: existing, error: findErr } = await supabaseClient
        .from('product_batches')
        .select('id, stock_quantity')
        .eq('product_id', productId)
        .eq('batch_number', batchNumber)
        .eq('expiry_date', expiryDate)
        .maybeSingle();

    if (findErr) throw findErr;

    let batchId = existing?.id || null;
    let newStock = qty;

    if (existing) {
        newStock = Number(existing.stock_quantity || 0) + qty;
        const { error } = await supabaseClient
            .from('product_batches')
            .update({ stock_quantity: newStock, is_tracked: true })
            .eq('id', existing.id);
        if (error) throw error;
    } else {
        const { data, error } = await supabaseClient
            .from('product_batches')
            .insert([{ product_id: productId, batch_number: batchNumber, expiry_date: expiryDate, stock_quantity: qty, is_tracked: true }])
            .select('id')
            .single();
        if (error) throw error;
        batchId = data.id;
    }

    await logMovement({ product_id: productId, batch_id: batchId, movement_type: 'purchase', quantity_base: qty, cost_price: 0, reason: reason || 'purchase', note: note || null });
    return { batchId, newStock };
}

export async function receiveStock({ productId, batchNumber, expiryDate, quantity, costPrice, reason, note }) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const qty = Number(quantity || 0);
    if (!productId) throw new Error('Vui lòng chọn hàng hóa.');
    if (!batchNumber) throw new Error('Vui lòng nhập mã lô.');
    if (!expiryDate) throw new Error('Vui lòng nhập hạn dùng.');
    if (qty <= 0) throw new Error('Số lượng nhập phải lớn hơn 0.');

    const { data: existing, error: findErr } = await supabaseClient
        .from('product_batches')
        .select('id, stock_quantity, cost_price')
        .eq('product_id', productId)
        .eq('batch_number', batchNumber)
        .eq('expiry_date', expiryDate)
        .maybeSingle();

    if (findErr) {
        if (findErr.message?.includes('cost_price')) return retryReceiveWithoutBatchCost({ productId, batchNumber, expiryDate, quantity, reason, note });
        throw findErr;
    }

    let batchId = existing?.id || null;
    let newStock = qty;

    try {
        if (existing) {
            newStock = Number(existing.stock_quantity || 0) + qty;
            const { error } = await supabaseClient
                .from('product_batches')
                .update({ stock_quantity: newStock, is_tracked: true, cost_price: Number(costPrice || existing.cost_price || 0) })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            const { data, error } = await supabaseClient
                .from('product_batches')
                .insert([{ product_id: productId, batch_number: batchNumber, expiry_date: expiryDate, stock_quantity: qty, is_tracked: true, cost_price: Number(costPrice || 0) }])
                .select('id')
                .single();
            if (error) throw error;
            batchId = data.id;
        }
    } catch (error) {
        if (error.message?.includes('cost_price')) return retryReceiveWithoutBatchCost({ productId, batchNumber, expiryDate, quantity, reason, note });
        throw error;
    }

    await logMovement({ product_id: productId, batch_id: batchId, movement_type: 'purchase', quantity_base: qty, cost_price: Number(costPrice || 0), reason: reason || 'purchase', note: note || null });
    return { batchId, newStock };
}
export async function issueInternalStock({ productId, batchId, quantity, reason, note }) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const qty = Number(quantity || 0);
    if (!productId || !batchId) throw new Error('Vui lòng chọn lô hàng cần xuất.');
    if (qty <= 0) throw new Error('Số lượng xuất phải lớn hơn 0.');

    const { data: batch, error: findErr } = await supabaseClient
        .from('product_batches')
        .select('id, stock_quantity')
        .eq('id', batchId)
        .single();

    if (findErr) throw findErr;
    const currentStock = Number(batch.stock_quantity || 0);
    if (currentStock < qty) throw new Error(`Không đủ tồn: cần ${qty}, còn ${currentStock}.`);

    const newStock = currentStock - qty;
    const { error } = await supabaseClient
        .from('product_batches')
        .update({ stock_quantity: newStock })
        .eq('id', batchId);

    if (error) throw error;
    await logMovement({ product_id: productId, batch_id: batchId, movement_type: 'internal_use', quantity_base: -qty, reason: reason || 'dose_cutting', note: note || null });
    return { newStock };
}

export async function adjustStocktake({ productId, batchId, countedQuantity, reason, note }) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const counted = Number(countedQuantity);
    if (!productId || !batchId) throw new Error('Vui lòng chọn lô hàng cần kiểm kê.');
    if (Number.isNaN(counted) || counted < 0) throw new Error('Tồn thực tế không hợp lệ.');

    const { data: batch, error: findErr } = await supabaseClient
        .from('product_batches')
        .select('id, stock_quantity')
        .eq('id', batchId)
        .single();

    if (findErr) throw findErr;
    const currentStock = Number(batch.stock_quantity || 0);
    const delta = counted - currentStock;

    // Log movement history first to preserve audit log
    await logMovement({ product_id: productId, batch_id: batchId, movement_type: 'stocktake_adjustment', quantity_base: delta, reason: reason || 'stocktake', note: note || null });

    if (counted === 0) {
        // Attempt to completely delete the empty batch from database
        const { error: delErr } = await supabaseClient
            .from('product_batches')
            .delete()
            .eq('id', batchId);

        if (delErr) {
            console.warn('Không thể xóa cứng lô hàng do có ràng buộc khóa ngoại lịch sử. Đặt số lượng tồn về 0:', delErr.message);
            const { error: updErr } = await supabaseClient
                .from('product_batches')
                .update({ stock_quantity: 0 })
                .eq('id', batchId);
            if (updErr) throw updErr;
        }
    } else {
        const { error } = await supabaseClient
            .from('product_batches')
            .update({ stock_quantity: counted })
            .eq('id', batchId);
        if (error) throw error;
    }

    return { newStock: counted, delta };
}
function buildDocumentCode(prefix = 'KHO') {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `${prefix}-${date}-${random}`;
}

export async function saveInventoryDocument({ documentType, note, lines, supplier_id }) {
    if (!supabaseClient || !Array.isArray(lines) || lines.length === 0) return null;

    const documentPayload = {
        document_code: buildDocumentCode(documentType === 'purchase' ? 'PN' : documentType === 'internal_use' ? 'PXNB' : 'PKK'),
        document_type: documentType,
        status: 'confirmed',
        note: note || null,
        supplier_id: supplier_id || null,
        confirmed_at: new Date().toISOString()
    };

    const { data: document, error: documentError } = await supabaseClient
        .from('inventory_documents')
        .insert([documentPayload])
        .select('id')
        .single();

    if (documentError) {
        console.warn('Không ghi được inventory_documents:', documentError.message);
        return null;
    }

    const itemPayloads = lines.map((line, index) => ({
        document_id: document.id,
        line_no: index + 1,
        product_id: line.productId,
        batch_id: line.batchId || null,
        batch_number: line.batchNumber || null,
        expiry_date: line.expiryDate || null,
        quantity_base: documentType === 'internal_use' ? -Number(line.quantity || 0) : Number(line.quantity || 0),
        counted_quantity_base: documentType === 'stocktake_adjustment' ? Number(line.countedQuantity || line.quantity || 0) : null,
        cost_price: Number(line.costPrice || 0),
        reason: line.reason || null,
        note: note || null
    }));

    const { error: itemError } = await supabaseClient
        .from('inventory_document_items')
        .insert(itemPayloads);

    if (itemError) {
        console.warn('Không ghi được inventory_document_items:', itemError.message);
    }

    return document.id;
}

export async function fetchBatchSupplier(batchId) {
    if (!supabaseClient || !batchId) return null;
    
    const { data, error } = await supabaseClient
        .from('inventory_document_items')
        .select(`
            inventory_documents!inner (
                document_type,
                suppliers (
                    name,
                    contact_type,
                    contact_info,
                    note
                )
            )
        `)
        .eq('batch_id', batchId)
        .eq('inventory_documents.document_type', 'purchase')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.warn('Lỗi lấy thông tin đối tác:', error.message);
        return null;
    }
    
    return data?.[0]?.inventory_documents?.suppliers || null;
}
