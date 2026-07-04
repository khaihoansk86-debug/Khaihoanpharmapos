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
// js/features/products/productService.js
import { supabaseClient } from '../../core/supabase.js';

/**
 * Láº¥y danh sÃ¡ch sáº£n pháº©m liÃªn káº¿t vá»›i danh má»¥c, Ä‘Æ¡n vá»‹ tÃ­nh vÃ  lÃ´ hÃ ng
 * Há»— trá»£ Offline: LÆ°u cache vÃ o localStorage
 */
const PRODUCTS_CACHE_KEY = 'cache_products_list';

export function removeVietnameseTones(str) {
    if (!str) return '';
    return String(str).normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Ä‘/g, 'd').replace(/Ä/g, 'D');
}

function processProductsData(products) {
    if (!products) return [];
    return products.map(p => {
        const searchStr = `${p.product_code || ''} ${p.name || ''} ${p.active_ingredient || ''} ${p.barcode || ''}`.toUpperCase();
        p._searchKey = removeVietnameseTones(searchStr);
        p._searchName = removeVietnameseTones((p.name || '').toUpperCase());
        return p;
    });
}

export async function fetchProducts() {
    // 1. Náº¿u cÃ³ máº¡ng, Æ°u tiÃªn láº¥y tá»« Supabase
    if (navigator.onLine && supabaseClient) {
        try {
            const { data: products, error } = await supabaseClient
                .from('products')
                .select(`
                    *,
                    product_categories:categories(id, name),
                    product_units(*),
                    product_batches(*)
                `);

            if (error) throw error;

            const processed = processProductsData(products);
            // LÆ°u vÃ o cache
            try {
                localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(processed));
                localStorage.setItem(PRODUCTS_CACHE_KEY + '_time', Date.now());
            } catch (cacheErr) {
                console.warn("KhÃ´ng thá»ƒ lÆ°u cache (cÃ³ thá»ƒ do dung lÆ°á»£ng quÃ¡ lá»›n):", cacheErr);
            }

            return processed;
        } catch (err) {
            console.warn("Fetch lá»—i, Ä‘ang sá»­ dá»¥ng dá»¯ liá»‡u offline:", err);
        }
    }

    // 2. Náº¿u máº¥t máº¡ng hoáº·c fetch lá»—i, dÃ¹ng dá»¯ liá»‡u cache
    const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (cached) {
        console.log("SW: Sá»­ dá»¥ng dá»¯ liá»‡u sáº£n pháº©m tá»« cache.");
        const parsed = JSON.parse(cached);
        // Äáº£m báº£o cache cÅ© cÅ©ng Ä‘Æ°á»£c process
        if (parsed.length > 0 && !parsed[0]._searchKey) {
            return processProductsData(parsed);
        }
        return parsed;
    }

    if (!supabaseClient && !cached) throw new Error("KhÃ´ng cÃ³ káº¿t ná»‘i máº¡ng vÃ  khÃ´ng cÃ³ dá»¯ liá»‡u cache.");
    return [];
}

/**
 * Cáº­p nháº­t thÃ´ng tin cÆ¡ báº£n sáº£n pháº©m
 */
export async function updateProduct(productCode, updateData) {
    if (!supabaseClient) throw new Error("Supabase client chÆ°a Ä‘Æ°á»£c khá»Ÿi táº¡o.");

    const { error } = await supabaseClient
        .from('products')
        .update(updateData)
        .eq('product_code', productCode);

    if (error) throw error;
    return true;
}

/**
 * Äá»’NG Bá»˜ DANH Má»¤C: Kiá»ƒm tra danh má»¥c Ä‘Ã£ cÃ³, thÃªm má»›i náº¿u chÆ°a cÃ³, tráº£ vá» Dictionary Map { name: id }
 */
export async function syncCategories(categoryNames) {
    if (!supabaseClient) throw new Error("Supabase client chÆ°a Ä‘Æ°á»£c khá»Ÿi táº¡o.");

    const uniqueNames = [...new Set(categoryNames.filter(name => name))];
    if (uniqueNames.length === 0) return {};

    const { data: existing, error: fetchErr } = await supabaseClient
        .from('categories')
        .select('id, name')
        .in('name', uniqueNames);
    if (fetchErr) throw fetchErr;

    const categoryMap = {};
    existing.forEach(cat => {
        categoryMap[cat.name] = cat.id;
    });

    const missingNames = uniqueNames.filter(name => !categoryMap[name]);
    if (missingNames.length > 0) {
        const { data: inserted, error: insertErr } = await supabaseClient
            .from('categories')
            .insert(missingNames.map(name => ({ name })))
            .select('id, name');

        if (insertErr) throw insertErr;
        inserted.forEach(cat => {
            categoryMap[cat.name] = cat.id;
        });
    }

    return categoryMap;
}

/**
 * Äá»’NG Bá»˜ Sáº¢N PHáº¨M: Upsert báº±ng product_code, tráº£ vá» Dictionary Map { product_code: id }
 */
export async function syncProducts(productsData) {
    if (!supabaseClient) throw new Error("Supabase client chÆ°a Ä‘Æ°á»£c khá»Ÿi táº¡o.");
    if (productsData.length === 0) return {};

    const { data: upserted, error } = await supabaseClient
        .from('products')
        .upsert(productsData, { onConflict: 'product_code' })
        .select('id, product_code');

    if (error) throw error;

    const productMap = {};
    upserted.forEach(p => {
        productMap[p.product_code] = p.id;
    });

    return productMap;
}

/**
 * Äá»’NG Bá»˜ ÄÆ N Vá»Š TÃNH: Query ID cÅ© náº¿u cÃ³, Insert náº¿u chÆ°a cÃ³
 */
export async function syncProductUnits(unitsData) {
    if (!supabaseClient) throw new Error("Supabase client chÆ°a Ä‘Æ°á»£c khá»Ÿi táº¡o.");
    if (unitsData.length === 0) return true;

    const productIds = [...new Set(unitsData.map(u => u.product_id))];

    const { data: existingUnits, error: fetchErr } = await supabaseClient
        .from('product_units')
        .select('id, product_id, unit_name')
        .in('product_id', productIds);

    if (fetchErr) throw fetchErr;

    const existingMap = {};
    existingUnits.forEach(u => {
        existingMap[`${u.product_id}_${u.unit_name}`] = u.id;
    });

    const toUpdate = [];
    const toInsert = [];

    unitsData.forEach(unit => {
        const key = `${unit.product_id}_${unit.unit_name}`;
        if (existingMap[key]) {
            toUpdate.push({ id: existingMap[key], ...unit });
        } else {
            toInsert.push(unit);
        }
    });

    if (toInsert.length > 0) {
        const { error: insertErr } = await supabaseClient
            .from('product_units')
            .insert(toInsert);
        if (insertErr) throw insertErr;
    }

    if (toUpdate.length > 0) {
        const { error: updateErr } = await supabaseClient
            .from('product_units')
            .upsert(toUpdate, { onConflict: 'id' });
        if (updateErr) throw updateErr;
    }

    return true;
}

/**
 * Äá»’NG Bá»˜ LÃ” HÃ€NG: Query ID cÅ© náº¿u cÃ³, Insert náº¿u chÆ°a cÃ³
 */
export async function syncProductBatches(batchesData) {
    if (!supabaseClient) throw new Error("Supabase client chÆ°a Ä‘Æ°á»£c khá»Ÿi táº¡o.");
    if (batchesData.length === 0) return true;

    const productIds = [...new Set(batchesData.map(b => b.product_id))];

    const { data: existingBatches, error: fetchErr } = await supabaseClient
        .from('product_batches')
        .select('id, product_id, batch_number')
        .in('product_id', productIds);

    if (fetchErr) throw fetchErr;

    const existingMap = {};
    existingBatches.forEach(b => {
        existingMap[`${b.product_id}_${b.batch_number}`] = b.id;
    });

    const toUpdate = [];
    const toInsert = [];

    batchesData.forEach(batch => {
        const key = `${batch.product_id}_${batch.batch_number}`;
        if (existingMap[key]) {
            toUpdate.push({ id: existingMap[key], ...batch });
        } else {
            toInsert.push(batch);
        }
    });

    if (toInsert.length > 0) {
        const { error: insertErr } = await supabaseClient
            .from('product_batches')
            .insert(toInsert);
        if (insertErr) throw insertErr;
    }

    if (toUpdate.length > 0) {
        const { error: updateErr } = await supabaseClient
            .from('product_batches')
            .upsert(toUpdate, { onConflict: 'id' });
        if (updateErr) throw updateErr;
    }

    return true;
}

/**
 * Láº¥y toÃ n bá»™ danh má»¥c Ä‘á»ƒ populate select box
 */
export async function fetchCategories() {
    if (!supabaseClient) throw new Error("Supabase client chÆ°a Ä‘Æ°á»£c khá»Ÿi táº¡o.");
    const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .order('name');

    if (error) throw error;
    return data || [];
}

/**
 * Táº¡o má»›i má»™t danh má»¥c hÃ ng hÃ³a
 */
export async function createCategory(name) {
    if (!supabaseClient) throw new Error("Supabase client chÆ°a Ä‘Æ°á»£c khá»Ÿi táº¡o.");
    const { data, error } = await supabaseClient
        .from('categories')
        .insert([{ name }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

/**
 * Táº¡o má»›i má»™t sáº£n pháº©m tá»« form Add Product
 */
export async function createProduct(productData, unitsData, batchData) {
    if (!supabaseClient) throw new Error("Supabase client chÆ°a Ä‘Æ°á»£c khá»Ÿi táº¡o.");

    // 1. Insert Product
    const { data: pData, error: pErr } = await supabaseClient
        .from('products')
        .insert([productData])
        .select()
        .single();

    if (pErr) {
        if (pErr.code === '23505') {
            throw new Error(`MÃ£ hÃ ng ${productData.product_code} Ä‘Ã£ tá»“n táº¡i!`);
        }
        throw pErr;
    }

    const productId = pData.id;

    // 2. Insert Units
    const unitsToInsert = unitsData.map(unit => ({
        ...unit,
        product_id: productId
    }));

    const { error: uErr } = await supabaseClient
        .from('product_units')
        .insert(unitsToInsert);

    if (uErr) throw uErr;

    // 3. Insert Batch if applicable
    const batchesToInsert = Array.isArray(batchData)
        ? batchData
        : (batchData ? [batchData] : []);

    if (batchesToInsert.length > 0) {
        const rows = batchesToInsert.map(batch => ({
            ...batch,
            product_id: productId
        }));
        const { error: bErr } = await supabaseClient
            .from('product_batches')
            .insert(rows);

        if (bErr) throw bErr;
    }

    return true;
}
/**
 * Cáº­p nháº­t toÃ n bá»™ thÃ´ng tin sáº£n pháº©m (bao gá»“m ÄVT vÃ  LÃ´ hÃ ng)
 */
export async function updateProductFull(productId, productData, unitsData, batchData) {
    if (!supabaseClient) throw new Error("Supabase client chÆ°a Ä‘Æ°á»£c khá»Ÿi táº¡o.");

    // 1. Cáº­p nháº­t báº£ng products
    const { error: pErr } = await supabaseClient
        .from('products')
        .update(productData)
        .eq('id', productId);

    if (pErr) throw pErr;

    // 2. Cáº­p nháº­t Ä‘Æ¡n vá»‹ tÃ­nh: xÃ³a cÅ©, thÃªm má»›i (product_units khÃ´ng cÃ³ FK rÃ ng buá»™c ngoÃ i)
    const { error: delUErr } = await supabaseClient
        .from('product_units')
        .delete()
        .eq('product_id', productId);
    if (delUErr) throw delUErr;

    const unitsToInsert = unitsData.map(unit => ({
        ...unit,
        product_id: productId
    }));
    const { error: uErr } = await supabaseClient
        .from('product_units')
        .insert(unitsToInsert);
    if (uErr) throw uErr;

    // 3. Cáº­p nháº­t lÃ´ hÃ ng: Äá»“ng bá»™ thÃ´ng minh (upsert + xÃ³a an toÃ n)
    const batchesFromUI = Array.isArray(batchData)
        ? batchData
        : (batchData ? [batchData] : []);

    // 3a. Láº¥y danh sÃ¡ch lÃ´ hiá»‡n táº¡i trong DB
    const { data: dbBatches, error: fetchErr } = await supabaseClient
        .from('product_batches')
        .select('id, batch_number')
        .eq('product_id', productId);
    if (fetchErr) throw fetchErr;

    // Táº¡o map batch_number -> id tá»« DB
    const dbBatchesMap = new Map();
    (dbBatches || []).forEach(b => {
        dbBatchesMap.set(b.batch_number, b.id);
    });

    // 3b. PhÃ¢n loáº¡i cÃ¡c lÃ´ tá»« UI: náº¿u cÃ³ id hoáº·c trÃ¹ng sá»‘ lÃ´ thÃ¬ upsert, náº¿u khÃ´ng thÃ¬ insert
    const toUpsert = [];
    const toInsert = [];
    const uiBatchNumbers = new Set();

    batchesFromUI.forEach(batch => {
        let batchId = batch.id || null;
        // Náº¿u khÃ´ng cÃ³ id nhÆ°ng trÃ¹ng batch_number vá»›i DB thÃ¬ gÃ¡n id cÅ©
        if (!batchId && dbBatchesMap.has(batch.batch_number)) {
            batchId = dbBatchesMap.get(batch.batch_number);
        }

        const row = {
            ...batch,
            product_id: productId
        };
        if (batchId) {
            row.id = batchId;
            toUpsert.push(row);
        } else {
            toInsert.push(row);
        }
        uiBatchNumbers.add(batch.batch_number);
    });

    // Thá»±c hiá»‡n upsert cÃ¡c lÃ´ cÃ³ id
    if (toUpsert.length > 0) {
        const { error: upsertErr } = await supabaseClient
            .from('product_batches')
            .upsert(toUpsert, { onConflict: 'id' });
        if (upsertErr) throw upsertErr;
    }

    // Thá»±c hiá»‡n insert cÃ¡c lÃ´ má»›i
    if (toInsert.length > 0) {
        const { error: insertErr } = await supabaseClient
            .from('product_batches')
            .insert(toInsert);
        if (insertErr) throw insertErr;
    }

    // 3c. TÃ¬m cÃ¡c lÃ´ cÅ© trong DB nhÆ°ng KHÃ”NG cÃ³ trong danh sÃ¡ch UI (ngÆ°á»i dÃ¹ng Ä‘Ã£ xÃ³a khá»i form)
    const batchesToDelete = (dbBatches || []).filter(b => !uiBatchNumbers.has(b.batch_number));

    for (const batch of batchesToDelete) {
        try {
            const { error: delErr } = await supabaseClient
                .from('product_batches')
                .delete()
                .eq('id', batch.id);
            if (delErr) throw delErr;
        } catch (fkErr) {
            // Náº¿u bá»‹ rÃ ng buá»™c khÃ³a ngoáº¡i (Ä‘Ã£ cÃ³ giao dá»‹ch), Ä‘áº·t tá»“n = 0 vÃ  táº¯t theo dÃµi
            console.warn(`KhÃ´ng thá»ƒ xÃ³a lÃ´ ${batch.batch_number} do FK constraint. Äáº·t stock_quantity=0.`);
            await supabaseClient
                .from('product_batches')
                .update({ stock_quantity: 0, is_tracked: false })
                .eq('id', batch.id);
        }
    }

    return true;
}

