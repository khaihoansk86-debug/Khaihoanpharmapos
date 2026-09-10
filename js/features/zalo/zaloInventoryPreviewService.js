import { canDispatch, readInventoryDTO } from './zaloInventoryViewRules.js';

export const PREVIEW_COMMAND = 'preview_inventory_health_v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const unavailable = reason => ({ status: 'unavailable', data: null, reason });

// Persist only command references per authenticated user, never inventory DTOs.
// request=false may resume a command but never enqueues on navigation/F5.
export function createZaloInventoryPreviewService({ client, storage, now = Date.now, timeoutMs = 15000 }) {
    let busy = false;
    async function query(request) {
        let timer;
        try {
            const result = await Promise.race([request, new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error('preview_timeout')), timeoutMs);
            })]);
            if (result.error) throw result.error;
            return result.data;
        } finally { clearTimeout(timer); }
    }
    return async function load({ request = false } = {}) {
        if (busy) return { status: 'pending', reason: 'Đang kiểm tra preview; không tạo lệnh trùng.' };
        busy = true;
        let key;
        let pending;
        try {
            const auth = await query(client.auth.getUser());
            if (!UUID.test(auth?.user?.id || '') || await query(client.rpc('is_current_employee_admin')) !== true) {
                return unavailable('Không xác minh được phiên admin.');
            }
            key = `zalo-preview-v1:${auth.user.id}`;
            const raw = storage.getItem(key);
            if (raw) {
                try { pending = JSON.parse(raw); } catch { return unavailable('Thông tin lệnh lưu trên máy không hợp lệ. Cần đối chiếu lịch sử trước khi tạo lại.'); }
                if (!Number.isFinite(pending?.at) || pending.at > now() + 60000 || (pending.id !== null && !UUID.test(pending.id || ''))) {
                    return unavailable('Thông tin lệnh lưu trên máy không hợp lệ. Cần đối chiếu lịch sử trước khi tạo lại.');
                }
                // Known command IDs never expire by request age: a slow queue is not a failed command.
                if (!pending.id && now() - pending.at >= 5 * 60000) {
                    storage.removeItem(key);
                    pending = null;
                }
            }
            if (!pending) {
                const runtime = await query(client.from('zalo_bot_runtime_status').select('status,last_heartbeat_at,metadata')
                    .order('last_heartbeat_at', { ascending: false }).limit(1).maybeSingle());
                if (!canDispatch(runtime, PREVIEW_COMMAND, now()) || runtime.metadata.controlCapabilities.previewInventoryHealthV1 !== true) {
                    return unavailable('Preview chưa được backend xác minh; cần heartbeat mới có capability preview.');
                }
                if (!request) return { status: 'idle', reason: 'Sẵn sàng. Bấm Xem trước để đọc dữ liệu mới; không gửi Zalo.' };
                // Save intent BEFORE the write: timeout/F5 must not blindly enqueue again.
                pending = { id: null, at: now() };
                storage.setItem(key, JSON.stringify(pending));
                const id = await query(client.rpc('enqueue_zalo_bot_command', { p_command_type: PREVIEW_COMMAND, p_payload: {} }));
                if (!UUID.test(id || '')) throw new Error('preview_unknown_admission');
                pending.id = id;
                storage.setItem(key, JSON.stringify(pending));
            }
            if (!pending.id) return { status: 'uncertain', reason: 'Chưa xác định lệnh đã tiếp nhận. Đối chiếu Lịch sử; tạm khóa tạo lại tối đa 5 phút, không tự gửi lại.' };
            const command = await query(client.from('zalo_bot_commands').select('id,command_type,status,result')
                .eq('id', pending.id).maybeSingle());
            if (!command || command.id !== pending.id || command.command_type !== PREVIEW_COMMAND) throw new Error('preview_invalid_command');
            if (['queued', 'processing'].includes(command.status)) return { status: 'pending', commandId: pending.id, reason: 'Preview đang chờ/đang xử lý. Bấm kiểm tra lại để đọc đúng lệnh này; không tạo lệnh mới.' };
            if (command.status === 'failed') {
                storage.removeItem(key);
                return { status: 'error', reason: 'Bot không tạo được preview. Xem lịch sử và kiểm tra backend trước khi yêu cầu lại.' };
            }
            const ref = command.result;
            if (command.status !== 'completed' || ref?.status !== 'preview_ready' || ref.contractVersion !== 1
                || !UUID.test(ref.result_id || '') || !Number.isFinite(Date.parse(ref.expires_at))
                || !Number.isInteger(ref.byte_count) || ref.byte_count < 1 || ref.byte_count > 1048576) throw new Error('preview_invalid_reference');
            if (Date.parse(ref.expires_at) <= now()) {
                storage.removeItem(key);
                return { status: 'expired', reason: 'Preview đã hết hạn. Bấm Xem trước để yêu cầu bản mới.' };
            }
            const dto = await query(client.rpc('get_zalo_inventory_preview', { p_result_id: ref.result_id }));
            if (new TextEncoder().encode(JSON.stringify(dto)).length > 1048576) throw new Error('preview_too_large');
            const data = readInventoryDTO(dto);
            const currentAuth = await query(client.auth.getUser());
            if (currentAuth?.user?.id !== auth.user.id || await query(client.rpc('is_current_employee_admin')) !== true) {
                return unavailable('Phiên admin đã thay đổi; không hiển thị dữ liệu của phiên trước.');
            }
            if (Date.parse(ref.expires_at) <= now()) throw new Error('preview_expired');
            storage.removeItem(key);
            return { status: 'ready', data, expiresAt: ref.expires_at, commandId: pending.id, reason: 'Bản xem trước từ backend, không phải lệnh gửi Zalo.' };
        } catch (error) {
            if (error?.code === '42501') return unavailable('Quyền truy cập đã thay đổi. Hãy xác minh lại phiên admin.');
            if (error?.code === 'preview_invalid_data' || ['preview_invalid_reference','preview_invalid_command','preview_too_large'].includes(error?.message)) {
                return { status:'error', commandId:pending?.id, reason:'Kết quả preview không hợp lệ hoặc vượt giới hạn. Cần đối chiếu lệnh/backend; chưa tạo lệnh khác.' };
            }
            if (['preview_expired', 'preview_not_found'].some(code => error?.message?.includes(code))) {
                if (key) storage.removeItem(key);
                return { status: 'expired', reason: 'Preview đã hết hạn hoặc không còn. Bấm Xem trước để yêu cầu bản mới.' };
            }
            return { status: pending ? (pending.id ? 'pending' : 'uncertain') : 'error', data: null,
                reason: pending ? 'Chưa đọc được kết quả. Mã/yêu cầu đang được giữ để kiểm tra lại, không tự tạo lệnh khác.'
                    : 'Không xác minh được preview. Kiểm tra kết nối, phiên admin và bộ nhớ trình duyệt.' };
        } finally { busy = false; }
    };
}

let browserService;
export async function loadZaloInventoryPreview(options) {
    if (typeof window === 'undefined') return unavailable('Preview chỉ khả dụng trong phiên admin trên trình duyệt.');
    try {
        if (!browserService) {
            const { supabaseClient } = await import('../../core/supabase.js');
            browserService = createZaloInventoryPreviewService({ client: supabaseClient, storage: window.sessionStorage });
        }
        return await browserService(options);
    } catch { return unavailable('Không kết nối được dịch vụ preview.'); }
}
