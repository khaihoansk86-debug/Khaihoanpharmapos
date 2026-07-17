export const dailyCheckService = {
    generateTasks: async () => {
        const { data, error } = await window.supabase.rpc('generate_daily_inventory_tasks');
        if (error) throw error;
        return data;
    },
    
    getTasks: async (dateStr) => {
        if (!dateStr) {
            // Local time formatted as YYYY-MM-DD
            const now = new Date();
            dateStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        }
        const { data, error } = await window.supabase.rpc('get_daily_inventory_tasks', { p_date: dateStr });
        if (error) throw error;
        return data;
    },

    updateTask: async (taskId, countedQuantity) => {
        const { error } = await window.supabase
            .from('daily_inventory_tasks')
            .update({ 
                counted_quantity: countedQuantity, 
                status: 'completed', 
                updated_at: new Date().toISOString() 
            })
            .eq('id', taskId);
        if (error) throw error;
    }
};
