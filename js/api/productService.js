import { supabaseClient } from '../config/supabase.js';

/**
 * Lấy danh sách sản phẩm cùng với đơn vị tính
 */
export async function fetchProducts() {
    if (!supabaseClient) throw new Error("Supabase client chưa được khởi tạo.");
    
    const { data: products, error } = await supabaseClient
        .from('products')
        .select('*, product_units(*)');

    if (error) throw error;
    return products || [];
}

/**
 * Cập nhật thông tin sản phẩm
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
 * Upsert danh sách sản phẩm (Import)
 */
export async function upsertProducts(productsList) {
    if (!supabaseClient) throw new Error("Supabase client chưa được khởi tạo.");
    
    const { error } = await supabaseClient
        .from('products')
        .upsert(productsList, { onConflict: 'product_code' });
        
    if (error) throw error;
    return true;
}
