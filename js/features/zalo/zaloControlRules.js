export const ZALO_COMMANDS = Object.freeze({
    send_admin_agenda: {
        label: 'Gửi kế hoạch hôm nay',
        description: 'Gửi bản tổng hợp lịch làm việc và số lượng cần xử lý cho admin.',
        icon: 'fa-calendar-check',
        tone: 'blue',
        confirmation: 'Gửi kế hoạch vận hành hôm nay tới Zalo admin?'
    },
    run_inventory_audit: {
        label: 'Chạy kiểm kê theo lô',
        description: 'Chỉ gửi khi Long và Hùng cùng ca; không gửi trùng danh sách trong ngày.',
        icon: 'fa-clipboard-check',
        tone: 'emerald',
        confirmation: 'Chạy giao kiểm kê theo lô ngay bây giờ?'
    },
    send_out_of_stock_report: {
        label: 'Báo hàng hết',
        description: 'Thống kê các SKU vật lý đang có tồn bằng 0.',
        icon: 'fa-box-open',
        tone: 'rose',
        confirmation: 'Gửi báo cáo hàng hết ngay bây giờ?'
    },
    send_low_stock_report: {
        label: 'Báo hàng gần hết',
        description: 'Đối chiếu tồn thấp theo đúng đơn vị gốc của sản phẩm.',
        icon: 'fa-arrow-trend-down',
        tone: 'amber',
        confirmation: 'Gửi báo cáo hàng gần hết ngay bây giờ?'
    },
    send_missing_cost_report: {
        label: 'Báo thiếu giá vốn',
        description: 'Liệt kê SKU chưa có giá vốn ở đơn vị gốc để bổ sung.',
        icon: 'fa-coins',
        tone: 'violet',
        confirmation: 'Gửi báo cáo thiếu giá vốn ngay bây giờ?'
    },
    send_expiring_report: {
        label: 'Báo hàng cận date',
        description: 'Gửi danh sách các lô còn tồn sắp đến hạn sử dụng.',
        icon: 'fa-hourglass-half',
        tone: 'orange',
        confirmation: 'Gửi báo cáo hàng cận date ngay bây giờ?'
    },
    check_connection: {
        label: 'Kiểm tra kết nối Zalo',
        description: 'Yêu cầu máy server kiểm tra phiên Zalo và cập nhật trạng thái.',
        icon: 'fa-signal',
        tone: 'slate',
        confirmation: 'Kiểm tra kết nối Zalo trên máy server?'
    }
});

export function isZaloAdmin(user = {}) {
    return user?.authenticatedSession === true && user?.role === 'admin';
}

export function resolveBotConnection(runtime = null, now = new Date()) {
    if (!runtime?.last_heartbeat_at) {
        return { state: 'offline', label: 'Chưa có tín hiệu', detail: 'Máy bot chưa cập nhật trạng thái.' };
    }
    const ageMs = now.getTime() - new Date(runtime.last_heartbeat_at).getTime();
    if (!Number.isFinite(ageMs) || ageMs > 3 * 60 * 1000) {
        return { state: 'offline', label: 'Mất kết nối', detail: 'Không có heartbeat trong 3 phút gần đây.' };
    }
    if (runtime.status === 'degraded' || runtime.zalo_connected !== true) {
        return { state: 'degraded', label: 'Cần kiểm tra', detail: runtime.last_error || 'Máy bot online nhưng Zalo chưa sẵn sàng.' };
    }
    return { state: 'online', label: 'Đang hoạt động', detail: 'Máy bot và phiên Zalo đều sẵn sàng.' };
}

export function formatCronLabel(value, fallback = '--:--') {
    const parts = String(value || '').trim().split(/\s+/);
    const minute = Number(parts[0]);
    const hour = Number(parts[1]);
    if (!Number.isInteger(minute) || !Number.isInteger(hour)
        || minute < 0 || minute > 59 || hour < 0 || hour > 23) {
        return fallback;
    }
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function commandStatusLabel(status) {
    return ({
        queued: 'Đang chờ',
        processing: 'Đang chạy',
        completed: 'Hoàn thành',
        failed: 'Thất bại'
    })[status] || 'Không rõ';
}
