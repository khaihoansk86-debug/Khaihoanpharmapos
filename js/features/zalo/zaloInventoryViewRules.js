export const INVENTORY_SECTIONS = Object.freeze({ outOfStock:'Hết hàng', belowMin:'Dưới Min', aboveMax:'Trên Max', withoutMin:'Chưa Min', needsReview:'Cần đối chiếu' });
export const audienceLabel = value => ({ operations_group:'Nhóm vận hành', admin_primary:'Admin' })[value] || 'Chưa xác nhận';
export const formatQuantity = value => value === null || value === undefined ? '—' : Number(value).toLocaleString('vi-VN');
export function formatZaloTime(value) {
    if (!value || !Number.isFinite(Date.parse(value))) return 'Chưa ghi nhận';
    return new Date(value).toLocaleString('vi-VN', { timeZone:'Asia/Ho_Chi_Minh' });
}
export function readInventoryDTO(dto) {
    const fail = () => { throw Object.assign(new Error('Dữ liệu xem trước không đúng contract v1.'), { code:'preview_invalid_data' }); };
    if (dto?.contractVersion !== 1 || typeof dto.ruleVersion !== 'string' || !dto.ruleVersion || dto.ruleVersion.length > 100
        || !Number.isFinite(Date.parse(dto.observedAt)) || !/^\d{4}-\d{2}-\d{2}$/.test(dto.businessDate || '')
        || !Number.isFinite(Date.parse(dto.businessDate+'T00:00:00Z'))
        || new Date(dto.businessDate+'T00:00:00Z').toISOString().slice(0,10) !== dto.businessDate
        || (dto.sourceCommit != null && !/^[0-9a-f]{40}$/i.test(dto.sourceCommit))) fail();
    const sections = {};
    for (const key of Object.keys(INVENTORY_SECTIONS)) {
        const items = dto.sections?.[key];
        if (!Array.isArray(items) || !Number.isInteger(dto.counts?.[key]) || dto.counts[key] !== items.length || items.length > 10000) fail();
        const seen = new Set();
        sections[key] = items.map(row => {
            if (!row || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(row.productId || '') || seen.has(row.productId) || typeof row.name !== 'string' || row.name.length > 500 || typeof row.code !== 'string' || row.code.length > 200) fail();
            seen.add(row.productId);
            for (const field of ['availableStock','min','max']) if (row[field] !== null && (typeof row[field] !== 'number' || !Number.isFinite(row[field]))) fail();
            if (row.baseUnit !== null && typeof row.baseUnit !== 'string') fail();
            return { productId:row.productId,code:row.code,name:row.name,availableStock:row.availableStock,min:row.min,max:row.max,baseUnit:row.baseUnit,note:String(row.note || '').slice(0,1000) };
        });
    }
    if (!Array.isArray(dto.messages)) fail();
    const messages = dto.messages.map(m => {
        if (!m || !['operations_group','admin_primary'].includes(m.audience) || !Array.isArray(m.parts) || m.parts.some(p => typeof p !== 'string' || p.length > 10000)) fail();
        return { audience:m.audience,parts:m.parts };
    });
    return { contractVersion:1,ruleVersion:dto.ruleVersion,sourceCommit:dto.sourceCommit ?? null,observedAt:dto.observedAt,businessDate:dto.businessDate,
        counts:Object.fromEntries(Object.keys(INVENTORY_SECTIONS).map(key=>[key,dto.counts[key]])),sections,messages };
}
export function filterInventory(items, query='') {
    const norm = v => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
    const search = norm(query.trim());
    return items.filter(r => norm(`${r.code} ${r.name}`).includes(search));
}
export function commandAudience(type) {
    if (type === 'preview_inventory_health_v1') return 'Chỉ xem trước, không gửi Zalo';
    return ['send_admin_agenda','send_daily_sales_report'].includes(type) ? 'Admin' : type === 'check_connection' ? 'Kiểm tra server, không gửi báo cáo' : 'Nhóm vận hành';
}
export function runtimeLayerLabels(runtime, now=Date.now()) {
    const age=now-Date.parse(runtime?.last_heartbeat_at);
    const fresh=Number.isFinite(age) && age>=-60000 && age<=180000;
    return {
        bot:fresh ? (runtime?.status==='online'?'Có tín hiệu mới':'Có tín hiệu; cần kiểm tra') : 'Mất kết nối / chưa xác minh',
        manager:'Chưa có tín hiệu riêng được xác minh',
        zalo:fresh && runtime?.zalo_connected===true ? 'Bot báo có kết nối; chưa có thời điểm kiểm tra riêng' : 'Chưa xác minh kết nối'
    };
}
export function commandDisplayName(type) {
    return ({preview_inventory_health_v1:'Xem trước tồn kho',notify_purchase_document:'Thông báo phiếu nhập',
        notify_expense_transaction:'Thông báo phiếu chi',notify_stocktake_document:'Thông báo kiểm kê'})[type] || 'Nghiệp vụ chưa nhận diện';
}
export function canDispatch(runtime, type, now=Date.now()) {
    const caps = runtime?.metadata?.controlCapabilities;
    const age = now-Date.parse(runtime?.last_heartbeat_at);
    return Boolean(age >= -60000 && age <= 180000 && runtime?.status === 'online' && caps?.contractVersion === 1 && caps.verified === true
        && /^[0-9a-f]{40}$/i.test(caps.sourceCommit || '') && Array.isArray(caps.commands) && caps.commands.includes(type));
}
export function commandResultLabel(command) {
    if (command.command_type === 'preview_inventory_health_v1') {
        if (command.status === 'completed' && command.result?.status === 'preview_ready') return 'Đã tạo preview; không gửi Zalo. Bản xem trước có hạn 15 phút.';
        if (command.status === 'completed') return 'Preview đã kết thúc nhưng kết quả chưa hợp lệ; cần đối chiếu backend.';
        if (command.status === 'failed') return 'Không tạo được preview; không gửi Zalo.';
        return 'Preview đang chờ/đang xử lý; không gửi Zalo.';
    }
    if (command.status === 'queued') return 'Đã tiếp nhận, chưa thực thi';
    if (command.status === 'processing') return 'Đang xử lý; chưa xác nhận gửi';
    if (command.status === 'failed' || command.status === 'timeout') return 'Lỗi/quá thời gian chờ; chưa chắc tin chưa gửi. Đối chiếu trên Manager trước khi gửi lại.';
    if (command.result?.status === 'sent' && Number.isInteger(command.result?.sent) && command.result.sent >= 0) return `Handler báo gửi: ${command.result.sent} lượt. Chưa có xác nhận người nhận.`;
    return command.status === 'completed' ? 'Handler đã kết thúc; chưa đủ bằng chứng xác nhận gửi.' : 'Chưa rõ kết quả';
}
