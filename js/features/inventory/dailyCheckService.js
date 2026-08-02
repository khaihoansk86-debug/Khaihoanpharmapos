import { supabaseClient } from '../../core/supabase.js';

export const dailyCheckService = {
    getBatchChecks: async (dateStr) => {
        if (!dateStr) {
            const now = new Date();
            dateStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
                .toISOString()
                .split('T')[0];
        }
        if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
        const { data, error } = await supabaseClient.rpc(
            'get_bot_inventory_batch_checks',
            { p_date: dateStr }
        );
        if (error) throw error;
        return data || [];
    },

    completeBatchCheck: async (checkId, countedQuantity) => {
        if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
        const { data, error } = await supabaseClient.rpc(
            'complete_bot_inventory_batch_check',
            {
                p_check_id: checkId,
                p_counted_quantity: countedQuantity
            }
        );
        if (error) throw error;
        return data;
    }
};
