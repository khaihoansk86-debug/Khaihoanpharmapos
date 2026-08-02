const GROUP_LABELS = Object.freeze({
    ecommerce: 'Hàng TMĐT',
    dose_cut: 'Hàng cắt liều',
    retail: 'Hàng bán lẻ'
});

function uniqueNames(values = []) {
    return [...new Set(
        values
            .map(value => String(value || '').trim())
            .filter(Boolean)
    )];
}

export function resolveInventoryAuditTargets(config = {}, env = process.env) {
    const dedicatedGroup = String(
        config.audit_group_name
        || config.audit_group
        || env.ZALO_AUDIT_GROUP
        || ''
    ).trim();

    if (dedicatedGroup) return [dedicatedGroup];
    if (Array.isArray(config.audit_receivers) && config.audit_receivers.length > 0) {
        return uniqueNames(config.audit_receivers);
    }
    return uniqueNames(Array.isArray(config.staff_list) ? config.staff_list : []);
}

export function buildInventoryAuditMessages(tasks = [], options = {}) {
    if (!Array.isArray(tasks) || tasks.length === 0) return [];

    const chunkSize = Math.max(1, Number(options.chunkSize || 10));
    const dateLabel = options.dateLabel || new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date());
    const chunks = [];

    for (let index = 0; index < tasks.length; index += chunkSize) {
        chunks.push(tasks.slice(index, index + chunkSize));
    }

    return chunks.map((chunk, chunkIndex) => {
        const startNumber = chunkIndex * chunkSize;
        const lines = chunk.map((task, itemIndex) => {
            const number = startNumber + itemIndex + 1;
            const code = task.product_code ? ` [${task.product_code}]` : '';
            const group = GROUP_LABELS[task.tag_group] || task.tag_group || 'Khác';
            const baseUnit = (task.units || []).find(unit => unit.is_base_unit) || null;
            const baseUnitName = baseUnit?.unit_name || task.base_unit || 'ĐV cơ sở';
            const unitText = (task.units || []).length > 0
                ? task.units.map(unit => unit.is_base_unit
                    ? `${unit.unit_name} (gốc)`
                    : `${unit.unit_name}=${Number(unit.conversion_rate || 0)} ${baseUnitName}`
                ).join('; ')
                : `${baseUnitName} (chưa có quy đổi khác)`;
            const batchText = (task.batches || []).length > 0
                ? task.batches.map(batch => {
                    const expiry = batch.expiry_date
                        ? new Intl.DateTimeFormat('vi-VN').format(new Date(`${batch.expiry_date}T00:00:00`))
                        : 'không HSD';
                    return `${batch.batch_number || 'Chưa đặt số'} (HSD ${expiry})`;
                }).join('; ')
                : 'Không có lô đang theo dõi';
            return [
                `${number}. ${task.product_name}${code}`,
                `   Nhóm: ${group}`,
                `   Đơn vị: ${unitText}`,
                `   Lô cần kiểm: ${batchText}`,
                '   Thực đếm từng lô: ................'
            ].join('\n');
        });

        return [
            `📋 KIỂM KÊ NGẪU NHIÊN — ${dateLabel}`,
            `Phần ${chunkIndex + 1}/${chunks.length} • Tổng hôm nay: ${tasks.length} mặt hàng`,
            '',
            ...lines,
            '',
            'Yêu cầu: đếm thực tế độc lập, không xem tồn trên phần mềm trước khi đếm.',
            'Kiểm kỹ đơn vị quy đổi và từng số lô. Lô thực tế đã hết phải nhập 0 để PharmaPOS loại lô.',
            'Nếu có chênh lệch, ghi số thực đếm và lập phiếu kiểm kê trên PharmaPOS.'
        ].join('\n');
    });
}

function mapBy(items = [], keyBuilder) {
    return new Map(items.map(item => [keyBuilder(item), item]));
}

export function buildInventoryAuditFollowup(snapshot, currentDetails, movements = [], options = {}) {
    const stocktakeProductIds = new Set(
        movements
            .filter(movement => movement.movement_type === 'stocktake_adjustment')
            .map(movement => movement.product_id)
    );
    const results = (snapshot.tasks || []).map(task => {
        const current = currentDetails.get(task.product_id) || { units: [], batches: [] };
        const oldUnits = mapBy(task.units || [], unit => unit.id || unit.unit_name);
        const newUnits = mapBy(current.units || [], unit => unit.id || unit.unit_name);
        const unitChanges = [];
        newUnits.forEach((unit, key) => {
            const old = oldUnits.get(key);
            if (!old) unitChanges.push(`thêm ${unit.unit_name}`);
            else if (Number(old.conversion_rate) !== Number(unit.conversion_rate)
                || Boolean(old.is_base_unit) !== Boolean(unit.is_base_unit)) {
                unitChanges.push(`${unit.unit_name}: ${old.conversion_rate} → ${unit.conversion_rate}`);
            }
        });
        oldUnits.forEach((unit, key) => {
            if (!newUnits.has(key)) unitChanges.push(`bỏ ${unit.unit_name}`);
        });
        if ((current.units || []).length === 0) {
            unitChanges.push('chưa cấu hình đơn vị tính');
        }

        const oldBatches = mapBy(task.batches || [], batch => batch.id);
        const newBatches = mapBy(current.batches || [], batch => batch.id);
        const batchChanges = [];
        newBatches.forEach((batch, key) => {
            const old = oldBatches.get(key);
            if (!old) batchChanges.push(`thêm lô ${batch.batch_number}`);
            else if (Number(old.stock_quantity) !== Number(batch.stock_quantity)) {
                batchChanges.push(
                    `lô ${batch.batch_number}: ${Number(old.stock_quantity)} → ${Number(batch.stock_quantity)}`
                );
            }
        });
        oldBatches.forEach((batch, key) => {
            if (!newBatches.has(key)) batchChanges.push(`lô ${batch.batch_number}: đã hết/đã loại`);
        });
        if ((current.batches || []).length === 0) {
            batchChanges.push('không còn lô đang theo dõi');
        }

        return {
            product_id: task.product_id,
            product_name: task.product_name,
            product_code: task.product_code,
            completed: stocktakeProductIds.has(task.product_id),
            unitChanges,
            batchChanges
        };
    });

    const completed = results.filter(result => result.completed);
    const missing = results.filter(result => !result.completed);
    const changed = results.filter(result => result.unitChanges.length || result.batchChanges.length);
    const timeLabel = options.timeLabel || new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date());

    const detailLines = changed.flatMap(result => [
        `• ${result.product_name} [${result.product_code || 'không mã'}]`,
        ...result.unitChanges.map(change => `  - Đơn vị: ${change}`),
        ...result.batchChanges.map(change => `  - Lô: ${change}`)
    ]);
    const missingLines = missing.slice(0, 30)
        .map(result => `- ${result.product_name} [${result.product_code || 'không mã'}]`);

    return {
        completedCount: completed.length,
        missingCount: missing.length,
        changedCount: changed.length,
        message: [
            `📊 BÁO CÁO KIỂM KÊ SAU 2 GIỜ — ${timeLabel}`,
            `Đã có thao tác kiểm kê: ${completed.length}/${results.length}`,
            `Có thay đổi đơn vị/lô/tồn: ${changed.length}`,
            `Chưa ghi nhận kiểm kê: ${missing.length}`,
            '',
            ...(detailLines.length ? ['CHI TIẾT THAY ĐỔI:', ...detailLines] : ['Không ghi nhận thay đổi tồn, lô hoặc đơn vị.']),
            ...(missingLines.length ? ['', 'CHƯA KIỂM:', ...missingLines] : []),
            ...(missing.length > 30 ? [`... và ${missing.length - 30} mặt hàng khác.`] : [])
        ].join('\n')
    };
}
