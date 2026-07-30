export const dailyCheckService = {
    getBatchChecks: async (dateStr) => {
        if (!dateStr) {
            const now = new Date();
            dateStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
                .toISOString()
                .split('T')[0];
        }
        const { data, error } = await window.supabase.rpc(
            'get_bot_inventory_batch_checks',
            { p_date: dateStr }
        );
        if (error) throw error;
        return data || [];
    },

    completeBatchCheck: async (checkId, countedQuantity) => {
        const { data, error } = await window.supabase.rpc(
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
