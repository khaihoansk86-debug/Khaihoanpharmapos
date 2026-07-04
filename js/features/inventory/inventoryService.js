/**
 * ==========================================
 * LÕI NGHIỆP VỤ - CORE LOGIC CONTRACT
 * ==========================================
 * Các hàm trong tệp này thuộc Core Logic của hệ thống PharmaPOS.
 * KHÔNG ĐƯỢC PHÉP CHỈNH SỬA HÀNH VI TÍNH TOÁN HIỆN TẠI (định dạng, tổng, tồn kho, v.v)
 * trừ khi có yêu cầu rõ ràng từ người dùng để thay đổi Core Logic.
 * Thay vào đó, hãy mở rộng thông qua các helper/adapter bên ngoài.
 * Đọc thêm: docs/core-logic-contract.md
 * ==========================================
 */
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
    if (!supabaseClient) throw new Error('Supabase chÆ°a Ä‘Æ°á»£c káº¿t ná»‘i.');

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
    const enrichedPayload = { ...payload };

    if ((enrichedPayload.product_id || enrichedPayload.batch_id) && (!enrichedPayload.product_name || !enrichedPayload.product_code || (enrichedPayload.batch_id && !enrichedPayload.batch_number))) {
        try {
            const productPromise = enrichedPayload.product_id
                ? supabaseClient.from('products').select('name, product_code').eq('id', enrichedPayload.product_id).maybeSingle()
                : Promise.resolve({ data: null });
            const batchPromise = enrichedPayload.batch_id
                ? supabaseClient.from('product_batches').select('batch_number').eq('id', enrichedPayload.batch_id).maybeSingle()
                : Promise.resolve({ data: null });

            const [{ data: product }, { data: batch }] = await Promise.all([productPromise, batchPromise]);
            if (!enrichedPayload.product_name) enrichedPayload.product_name = product?.name || 'Sáº£n pháº©m';
            if (!enrichedPayload.product_code) enrichedPayload.product_code = product?.product_code || null;
            if (!enrichedPayload.batch_number) enrichedPayload.batch_number = batch?.batch_number || null;
        } catch (snapshotErr) {
            console.warn('KhÃ´ng láº¥y Ä‘Æ°á»£c snapshot inventory_movement:', snapshotErr.message || snapshotErr);
        }
    }

    let { error } = await supabaseClient
        .from('inventory_movements')
        .insert([enrichedPayload]);

    if (error && (error.message?.includes('product_name') || error.message?.includes('product_code') || error.message?.includes('batch_number') || error.message?.includes('schema cache'))) {
        const legacyPayload = { ...enrichedPayload };
        delete legacyPayload.product_name;
        delete legacyPayload.product_code;
        delete legacyPayload.batch_number;
        ({ error } = await supabaseClient
            .from('inventory_movements')
            .insert([legacyPayload]));
    }

    if (error) {
        console.warn('KhÃ´ng ghi Ä‘Æ°á»£c inventory_movements:', error.message);
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
    if (!supabaseClient) throw new Error('Supabase chÆ°a Ä‘Æ°á»£c káº¿t ná»‘i.');
    const qty = Number(quantity || 0);
    if (!productId) throw new Error('Vui lÃ²ng chá»n hÃ ng hÃ³a.');
    if (!batchNumber) throw new Error('Vui lÃ²ng nháº­p mÃ£ lÃ´.');
    if (!expiryDate) throw new Error('Vui lÃ²ng nháº­p háº¡n dÃ¹ng.');
    if (qty <= 0) throw new Error('Sá»‘ lÆ°á»£ng nháº­p pháº£i lá»›n hÆ¡n 0.');

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
    if (!supabaseClient) throw new Error('Supabase chÆ°a Ä‘Æ°á»£c káº¿t ná»‘i.');
    const qty = Number(quantity || 0);
    if (!productId || !batchId) throw new Error('Vui lÃ²ng chá»n lÃ´ hÃ ng cáº§n xuáº¥t.');
    if (qty <= 0) throw new Error('Sá»‘ lÆ°á»£ng xuáº¥t pháº£i lá»›n hÆ¡n 0.');

    const { data: batch, error: findErr } = await supabaseClient
        .from('product_batches')
        .select('id, stock_quantity')
        .eq('id', batchId)
        .single();

    if (findErr) throw findErr;
    const currentStock = Number(batch.stock_quantity || 0);
    if (currentStock < qty) throw new Error(`KhÃ´ng Ä‘á»§ tá»“n: cáº§n ${qty}, cÃ²n ${currentStock}.`);

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
    if (!supabaseClient) throw new Error('Supabase chÆ°a Ä‘Æ°á»£c káº¿t ná»‘i.');
    const counted = Number(countedQuantity);
    if (!productId || !batchId) throw new Error('Vui lÃ²ng chá»n lÃ´ hÃ ng cáº§n kiá»ƒm kÃª.');
    if (Number.isNaN(counted) || counted < 0) throw new Error('Tá»“n thá»±c táº¿ khÃ´ng há»£p lá»‡.');

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
            console.warn('KhÃ´ng thá»ƒ xÃ³a cá»©ng lÃ´ hÃ ng do cÃ³ rÃ ng buá»™c khÃ³a ngoáº¡i lá»‹ch sá»­. Äáº·t sá»‘ lÆ°á»£ng tá»“n vá» 0:', delErr.message);
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

export async function saveInventoryDocument({ documentType, note, lines, supplier_id, paid_amount, debt_amount, throwOnError = false }) {
    if (!supabaseClient || !Array.isArray(lines) || lines.length === 0) return null;

    const documentPayload = {
        document_code: buildDocumentCode(documentType === 'purchase' ? 'PN' : documentType === 'internal_use' ? 'PXNB' : 'PKK'),
        document_type: documentType,
        status: 'confirmed',
        note: note || null,
        supplier_id: supplier_id || null,
        confirmed_at: new Date().toISOString(),
        paid_amount: paid_amount || 0,
        debt_amount: debt_amount || 0
    };

    let { data: document, error: documentError } = await supabaseClient
        .from('inventory_documents')
        .insert([documentPayload])
        .select('id')
        .single();

    if (documentError && (documentError.message?.includes('paid_amount') || documentError.message?.includes('debt_amount') || documentError.message?.includes('schema cache'))) {
        const legacyPayload = { ...documentPayload };
        delete legacyPayload.paid_amount;
        delete legacyPayload.debt_amount;
        ({ data: document, error: documentError } = await supabaseClient
            .from('inventory_documents')
            .insert([legacyPayload])
            .select('id')
            .single());
    }

    if (documentError) {
        console.warn('KhÃ´ng ghi Ä‘Æ°á»£c inventory_documents:', documentError.message);
        if (throwOnError) throw documentError;
        return null;
    }

    const itemPayloads = lines.map((line, index) => ({
        document_id: document.id,
        line_no: index + 1,
        product_id: line.productId || null,
        batch_id: line.batchId || null,
        product_name: line.productName || 'Sáº£n pháº©m',
        product_code: line.productCode || null,
        batch_number: line.batchNumber || null,
        expiry_date: line.expiryDate || null,
        quantity_base: documentType === 'internal_use' ? -Number(line.quantity || 0) : Number(line.quantity || 0),
        counted_quantity_base: documentType === 'stocktake_adjustment' ? Number(line.countedQuantity || line.quantity || 0) : null,
        cost_price: Number(line.costPrice || 0),
        reason: line.reason || null,
        note: note || null
    }));

    let { error: itemError } = await supabaseClient
        .from('inventory_document_items')
        .insert(itemPayloads);

    if (itemError && (itemError.message?.includes('product_name') || itemError.message?.includes('product_code') || itemError.message?.includes('schema cache'))) {
        const legacyPayloads = itemPayloads.map(({ product_name, product_code, ...rest }) => rest);
        ({ error: itemError } = await supabaseClient
            .from('inventory_document_items')
            .insert(legacyPayloads));
    }

    if (itemError) {
        console.warn('KhÃ´ng ghi Ä‘Æ°á»£c inventory_document_items:', itemError.message);
        if (throwOnError) throw itemError;
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
        console.warn('Lá»—i láº¥y thÃ´ng tin Ä‘á»‘i tÃ¡c:', error.message);
        return null;
    }
    
    return data?.[0]?.inventory_documents?.suppliers || null;
}

