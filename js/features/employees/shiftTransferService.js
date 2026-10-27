function dateStartIso(dateKey) {
    return new Date(`${dateKey}T00:00:00+07:00`).toISOString();
}

function dateEndIso(dateKey) {
    return new Date(`${dateKey}T23:59:59.999+07:00`).toISOString();
}

async function resolveDependencies(overrides = {}) {
    const deps = { ...overrides };
    if (!deps.saveShift || !deps.getShifts || !deps.reconcileShiftSalesFromOrders || !deps.supabaseClient) {
        try {
            const [empMod, reconMod, supaMod] = await Promise.all([
                import('./employeeService.js?v=20260712a'),
                import('../pos/shiftRevenueReconciliationService.js?v=20260712a'),
                import('../../core/supabase.js')
            ]);
            deps.saveShift = deps.saveShift || empMod.saveShift;
            deps.getShifts = deps.getShifts || empMod.getShifts;
            deps.reconcileShiftSalesFromOrders = deps.reconcileShiftSalesFromOrders || reconMod.reconcileShiftSalesFromOrders;
            deps.supabaseClient = deps.supabaseClient || supaMod.supabaseClient;
        } catch {
            // In standalone test environments, caller provides mock dependencies
        }
    }
    return deps;
}

/**
 * Chuyển một ca làm việc và toàn bộ doanh thu (các đơn hàng) sang nhân viên tiếp nhận.
 * Dùng khi phân công lộn nhân viên hoặc đổi ca làm việc.
 */
export async function transferShiftToEmployee({
    shift,
    targetEmployeeId,
    transferOrders = true,
    client = null,
    saveShiftFn = null,
    reconcileFn = null
} = {}) {
    if (!shift || !shift.id) {
        throw new Error('Cần cung cấp ca làm việc hợp lệ để chuyển.');
    }
    if (!targetEmployeeId) {
        throw new Error('Vui lòng chọn nhân viên tiếp nhận ca làm việc.');
    }

    const oldEmployeeId = shift.employee_id;
    if (oldEmployeeId === targetEmployeeId) {
        return { shift, transferredOrdersCount: 0, reconciliation: null };
    }

    const deps = await resolveDependencies({
        supabaseClient: client,
        saveShift: saveShiftFn,
        reconcileShiftSalesFromOrders: reconcileFn
    });

    // 1. Cập nhật employee_id cho ca làm việc
    let updatedShift = {
        ...shift,
        employee_id: targetEmployeeId,
        updated_at: new Date().toISOString()
    };
    if (deps.saveShift) {
        updatedShift = await deps.saveShift(updatedShift);
    }

    let transferredOrdersCount = 0;
    const dbClient = client || deps.supabaseClient;

    // 2. Cập nhật seller_employee_id trên các đơn bán lẻ hoàn thành trong ngày ca
    if (transferOrders && dbClient?.from && oldEmployeeId) {
        const shiftDate = shift.shift_date;
        const { data: updatedOrders, error: orderErr } = await dbClient
            .from('orders')
            .update({ seller_employee_id: targetEmployeeId })
            .eq('seller_employee_id', oldEmployeeId)
            .eq('status', 'completed')
            .or('order_type.eq.retail,order_type.is.null')
            .gte('created_at', dateStartIso(shiftDate))
            .lte('created_at', dateEndIso(shiftDate))
            .select('id');

        if (!orderErr && updatedOrders) {
            transferredOrdersCount = updatedOrders.length;
        }
    }

    // 3. Tự động đối soát và tính lại doanh thu ca cho ngày đó
    let reconciliation = null;
    if (deps.reconcileShiftSalesFromOrders) {
        reconciliation = await deps.reconcileShiftSalesFromOrders({
            referenceDate: shift.shift_date,
            employeeId: targetEmployeeId
        });
    }

    return {
        shift: updatedShift,
        transferredOrdersCount,
        reconciliation
    };
}

/**
 * Chuyển toàn bộ doanh thu (và tùy chọn ca làm) trong một ngày giữa 2 nhân viên.
 * Hữu ích khi ca cũ đã bị xóa hoặc cần gán lại toàn bộ doanh thu do phân công nhầm.
 */
export async function transferDayRevenueBetweenEmployees({
    shiftDate,
    fromEmployeeId,
    toEmployeeId,
    reassignShifts = true,
    client = null,
    getShiftsFn = null,
    saveShiftFn = null,
    reconcileFn = null
} = {}) {
    if (!shiftDate) {
        throw new Error('Vui lòng chọn ngày cần chuyển doanh thu.');
    }
    if (!fromEmployeeId || !toEmployeeId) {
        throw new Error('Vui lòng chọn cả nhân viên chuyển và nhân viên tiếp nhận.');
    }
    if (fromEmployeeId === toEmployeeId) {
        throw new Error('Nhân viên chuyển và nhân viên tiếp nhận không được trùng nhau.');
    }

    const deps = await resolveDependencies({
        supabaseClient: client,
        getShifts: getShiftsFn,
        saveShift: saveShiftFn,
        reconcileShiftSalesFromOrders: reconcileFn
    });

    let reassignedShiftsCount = 0;

    // 1. Gán lại các ca của nhân viên cũ sang nhân viên tiếp nhận (nếu có và được chọn)
    if (reassignShifts && deps.getShifts && deps.saveShift) {
        const dayShifts = await deps.getShifts({ from: shiftDate, to: shiftDate });
        const fromShifts = (dayShifts || []).filter(
            (s) => s.shift_date === shiftDate && s.employee_id === fromEmployeeId
        );
        for (const s of fromShifts) {
            await deps.saveShift({
                ...s,
                employee_id: toEmployeeId,
                updated_at: new Date().toISOString()
            });
            reassignedShiftsCount += 1;
        }
    }

    // 2. Chuyển người bán trên các đơn hàng hoàn thành trong ngày
    let transferredOrdersCount = 0;
    const dbClient = client || deps.supabaseClient;
    if (dbClient?.from) {
        const { data: updatedOrders, error: orderErr } = await dbClient
            .from('orders')
            .update({ seller_employee_id: toEmployeeId })
            .eq('seller_employee_id', fromEmployeeId)
            .eq('status', 'completed')
            .or('order_type.eq.retail,order_type.is.null')
            .gte('created_at', dateStartIso(shiftDate))
            .lte('created_at', dateEndIso(shiftDate))
            .select('id');

        if (!orderErr && updatedOrders) {
            transferredOrdersCount = updatedOrders.length;
        }
    }

    // 3. Đối soát lại toàn bộ ca trong ngày
    let reconciliation = null;
    if (deps.reconcileShiftSalesFromOrders) {
        reconciliation = await deps.reconcileShiftSalesFromOrders({
            referenceDate: shiftDate,
            employeeId: toEmployeeId
        });
    }

    return {
        reassignedShiftsCount,
        transferredOrdersCount,
        reconciliation
    };
}

/**
 * Đồng bộ / đối soát lại doanh thu cho toàn bộ các ca trong khoảng ngày.
 */
export async function reconcileShiftsForDateRange({
    fromDate,
    toDate,
    reconcileFn = null
} = {}) {
    if (!fromDate) return { updatedTotal: 0, daysProcessed: 0 };
    const to = toDate || fromDate;

    const deps = await resolveDependencies({
        reconcileShiftSalesFromOrders: reconcileFn
    });

    const start = new Date(fromDate);
    const end = new Date(to);
    let updatedTotal = 0;
    let daysProcessed = 0;

    const current = new Date(start);
    while (current <= end && daysProcessed < 31) {
        const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        if (deps.reconcileShiftSalesFromOrders) {
            const result = await deps.reconcileShiftSalesFromOrders({ referenceDate: dateKey });
            if (result?.updated?.length) {
                updatedTotal += result.updated.length;
            }
        }
        daysProcessed += 1;
        current.setDate(current.getDate() + 1);
    }

    return {
        updatedTotal,
        daysProcessed
    };
}
