// js/features/products/productService.js
import { supabaseClient } from '../../core/supabase.js';

/**
 * Lấy danh sách sản phẩm liên kết với danh mục, đơn vị tính và lô hàng
 * Hỗ trợ Offline: Lưu cache vào localStorage
 */
const PRODUCTS_CACHE_KEY = 'cache_products_list';

export async function fetchProducts() {
    // 1. Nếu có mạng, ưu tiên lấy từ Supabase
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
            
            // Lưu vào cache
            localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products || []));
            localStorage.setItem(PRODUCTS_CACHE_KEY + '_time', Date.now());
            
            return products || [];
        } catch (err) {
            console.warn("Fetch lỗi, đang sử dụng dữ liệu offline:", err);
        }
    }
    
    // 2. Nếu mất mạng hoặc fetch lỗi, dùng dữ liệu cache
    const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (cached) {
        console.log("SW: Sử dụng dữ liệu sản phẩm từ cache.");
        return JSON.parse(cached);
    }

    if (!supabaseClient && !cached) throw new Error("Không có kết nối mạng và không có dữ liệu cache.");
    return [];
}

/**
 * Cập nhật thông tin cơ bản sản phẩm
 */
export async function updateProduct(productCode, updateData) {
    if (!supabaseClient) throw new Error("Supabase client chưa được khởi tạo.");
    
    const { error } = await supabaseClient
        .from('products')
        .update(updateData)
        .eq('product_code', productCode);
        
    if (error) throw error;
    return true;
}

/**
 * ĐỒNG BỘ DANH MỤC: Kiểm tra danh mục đã có, thêm mới nếu chưa có, trả về Dictionary Map { name: id }
 */
export async function syncCategories(categoryNames) {
    if (!supabaseClient) throw new Error("Supabase client chưa được khởi tạo.");
    
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
 * ĐỒNG BỘ SẢN PHẨM: Upsert bằng product_code, trả về Dictionary Map { product_code: id }
 */
export async function syncProducts(productsData) {
    if (!supabaseClient) throw new Error("Supabase client chưa được khởi tạo.");
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
 * ĐỒNG BỘ ĐƠN VỊ TÍNH: Query ID cũ nếu có, Insert nếu chưa có
 */
export async function syncProductUnits(unitsData) {
    if (!supabaseClient) throw new Error("Supabase client chưa được khởi tạo.");
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
 * ĐỒNG BỘ LÔ HÀNG: Query ID cũ nếu có, Insert nếu chưa có
 */
export async function syncProductBatches(batchesData) {
    if (!supabaseClient) throw new Error("Supabase client chưa được khởi tạo.");
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
 * Lấy toàn bộ danh mục để populate select box
 */
export async function fetchCategories() {
    if (!supabaseClient) throw new Error("Supabase client chưa được khởi tạo.");
    const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .order('name');
        
    if (error) throw error;
    return data || [];
}

/**
 * Tạo mới một danh mục hàng hóa
 */
export async function createCategory(name) {
    if (!supabaseClient) throw new Error("Supabase client chưa được khởi tạo.");
    const { data, error } = await supabaseClient
        .from('categories')
        .insert([{ name }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

/**
 * Tạo mới một sản phẩm từ form Add Product
 */
export async function createProduct(productData, unitsData, batchData) {
    if (!supabaseClient) throw new Error("Supabase client chưa được khởi tạo.");
    
    // 1. Insert Product
    const { data: pData, error: pErr } = await supabaseClient
        .from('products')
        .insert([productData])
        .select()
        .single();
        
    if (pErr) {
        if (pErr.code === '23505') {
            throw new Error(`Mã hàng ${productData.product_code} đã tồn tại!`);
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
 * Cập nhật toàn bộ thông tin sản phẩm (bao gồm ĐVT và Lô hàng)
 */
export async function updateProductFull(productId, productData, unitsData, batchData) {
    if (!supabaseClient) throw new Error("Supabase client chưa được khởi tạo.");
    
    // 1. Cập nhật bảng products
    const { error: pErr } = await supabaseClient
        .from('products')
        .update(productData)
        .eq('id', productId);
        
    if (pErr) throw pErr;
    
    // 2. Cập nhật đơn vị tính: Cách đơn giản nhất là xóa cũ thêm mới 
    // (Hoặc có thể dùng syncProductUnits nếu muốn giữ ID cũ)
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
    
    // 3. Cập nhật lô hàng: Xóa cũ thêm mới
    const { error: delBErr } = await supabaseClient
        .from('product_batches')
        .delete()
        .eq('product_id', productId);
    if (delBErr) throw delBErr;
    
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
