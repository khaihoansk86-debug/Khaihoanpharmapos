import { supabaseClient } from '../../core/supabase.js';
import { buildAtomicStocktakePayload } from './stocktakeAtomicRules.js';

export async function applyStocktakeDocumentAtomic(input, client = supabaseClient) {
    if (!client) throw new Error('Supabase chưa được kết nối.');
    const payload = buildAtomicStocktakePayload(input);
    const { data, error } = await client.rpc('apply_stocktake_document_atomic', payload);
    if (error) throw error;
    return data;
}

export { buildAtomicStocktakePayload } from './stocktakeAtomicRules.js';
