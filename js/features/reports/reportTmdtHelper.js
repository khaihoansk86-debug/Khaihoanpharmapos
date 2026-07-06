export async function patchTMDTAnalytics(analytics) {
    if (!window.supabaseClient || !analytics || !analytics.range) return;
    
    const fromIso = analytics.range.fromIso;
    const toIso = analytics.range.toIso;
    
    if (!fromIso || !toIso) return;
    
    // Fetch TMDT orders (ecommerce)
    const { data: orders, error: ordersErr } = await window.supabaseClient
        .from('orders')
        .select('id, created_at, status, ecommerce_platform')
        .eq('order_type', 'ecommerce')
        .gte('created_at', fromIso)
        .lte('created_at', toIso);
        
    if (ordersErr || !orders || orders.length === 0) {
        if (analytics.summary) {
            analytics.summary.ecommerceCost = 0;
            analytics.summary.ecommerceItemsSold = 0;
        }
        analytics.platformsPerformance = [];
        return;
    }
    
    const completedOrders = orders.filter(o => o.status === 'completed');
    if (completedOrders.length === 0) {
        if (analytics.summary) {
            analytics.summary.ecommerceCost = 0;
            analytics.summary.ecommerceItemsSold = 0;
        }
        analytics.platformsPerformance = [];
        return;
    }
    
    const orderIds = completedOrders.map(o => o.id);
    
    // Fetch their items
    const { data: items, error: itemsErr } = await window.supabaseClient
        .from('order_items')
        .select('order_id, quantity, product_id, unit_name, total_price, batch_id')
        .in('order_id', orderIds);
        
    if (itemsErr || !items) return;
    
    // Fetch unit costs for these items to calculate cost accurately
    const productIds = [...new Set(items.map(i => i.product_id))].filter(Boolean);
    const { data: units } = await window.supabaseClient
        .from('product_units')
        .select('product_id, unit_name, cost_price, conversion_rate, is_base')
        .in('product_id', productIds);
        
    const unitMap = new Map();
    if (units) {
        units.forEach(u => {
            unitMap.set(u.product_id + '::' + (u.unit_name||''), Number(u.cost_price || 0));
            if (u.is_base) unitMap.set(u.product_id + '::__base__', Number(u.cost_price || 0));
        });
    }

    // Now recalculate TMDT metrics
    let totalEcommerceCost = 0;
    let totalEcommerceItemsSold = 0;
    const platformCosts = new Map();
    
    const orderMap = new Map(completedOrders.map(o => [o.id, o]));
    
    items.forEach(item => {
        const order = orderMap.get(item.order_id);
        if (!order) return;
        
        const qty = Math.abs(Number(item.quantity || 0));
        const costPrice = unitMap.get(item.product_id + '::' + (item.unit_name||'')) || unitMap.get(item.product_id + '::__base__') || 0;
        const lineCost = costPrice * qty;
        
        totalEcommerceCost += lineCost;
        totalEcommerceItemsSold += qty;
        
        const platform = order.ecommerce_platform || 'Khác';
        if (!platformCosts.has(platform)) platformCosts.set(platform, { name: platform, revenue: 0, orders: new Set() });
        const pStat = platformCosts.get(platform);
        pStat.revenue += lineCost; // We store cost in 'revenue' field for renderEcommercePlatforms to render as Giá vốn
        pStat.orders.add(order.id);
    });
    
    if (analytics.summary) {
        analytics.summary.ecommerceCost = totalEcommerceCost;
        analytics.summary.ecommerceItemsSold = totalEcommerceItemsSold;
    }
    
    // Override platform performance to use Cost instead of Revenue
    analytics.platformsPerformance = Array.from(platformCosts.values()).map(p => ({
        name: p.name,
        revenue: p.revenue, 
        orders: p.orders.size
    }));
}
