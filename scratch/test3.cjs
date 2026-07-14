const fs = require('fs');
const { fetchDashboardAnalytics } = require('./js/features/reports/reportService.js');
// Mock supabase
global.supabaseClient = {
    from: () => ({
        select: () => ({
            gte: () => ({ lte: () => ({ order: () => Promise.resolve({ data: [] }) }) }),
            in: () => Promise.resolve({ data: [] })
        })
    })
};
// I can't easily mock everything.
