export async function executeOrderPersistenceWorkflow({
    insertItems,
    deductInventory,
    afterInventory,
    finalizeOrder,
    rollbackInventory,
    deleteItems,
    deleteOrder
} = {}) {
    let inventoryChanges = [];
    try {
        await insertItems?.();
        inventoryChanges = await deductInventory?.() || [];
        await afterInventory?.();
        await finalizeOrder?.();
        return { inventoryChanges };
    } catch (error) {
        if (Array.isArray(error?.inventoryChanges)) {
            inventoryChanges = error.inventoryChanges;
        }
        try {
            await rollbackInventory?.(inventoryChanges);
        } catch (rollbackError) {
            console.error('Không thể hoàn tác tồn kho sau lỗi ghi đơn:', rollbackError);
        }
        try {
            await deleteItems?.();
        } catch (rollbackError) {
            console.error('Không thể xóa chi tiết đơn sau lỗi ghi đơn:', rollbackError);
        }
        try {
            await deleteOrder?.();
        } catch (rollbackError) {
            console.error('Không thể xóa đơn sau lỗi ghi đơn:', rollbackError);
        }
        throw error;
    }
}
