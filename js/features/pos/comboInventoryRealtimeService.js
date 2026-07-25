export function startProductBatchRealtimeSync({
    client,
    onInventoryChange,
    debounceMs = 750
} = {}) {
    if (!client || typeof onInventoryChange !== 'function') return () => {};

    let syncTimer = null;
    let stopped = false;
    const channel = client
        .channel('pos_product_batch_stock_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'product_batches'
            },
            payload => {
                if (stopped) return;
                if (syncTimer) clearTimeout(syncTimer);
                syncTimer = setTimeout(async () => {
                    syncTimer = null;
                    try {
                        await onInventoryChange(payload);
                    } catch (error) {
                        console.warn('[combo-realtime] Không thể đồng bộ lại tồn kho:', error);
                    }
                }, Math.max(0, Number(debounceMs || 0)));
            }
        )
        .subscribe();

    return () => {
        stopped = true;
        if (syncTimer) clearTimeout(syncTimer);
        syncTimer = null;
        client.removeChannel?.(channel);
    };
}
