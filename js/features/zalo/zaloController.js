import { initLayout } from '../../components/layout.js';
import {
    ZALO_COMMANDS,
    commandStatusLabel,
    formatCronLabel,
    isZaloAdmin,
    resolveBotConnection
} from './zaloControlRules.js';
import {
    enqueueZaloCommand,
    loadZaloControlDashboard
} from './zaloControlService.js';

let dashboard = { settings: {}, runtime: null, commands: [] };
let pendingCommand = null;
let refreshTimer = null;

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

function currentUser() {
    try {
        return JSON.parse(localStorage.getItem('pos_user') || 'null');
    } catch {
        return null;
    }
}

function showNotice(message, type = 'success') {
    const notice = $('zaloNotice');
    if (!notice) return;
    notice.textContent = message;
    notice.className = `fixed bottom-5 right-5 z-[200] max-w-sm rounded-xl px-4 py-3 text-sm font-bold text-white shadow-2xl ${
        type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
    }`;
    notice.classList.remove('hidden');
    setTimeout(() => notice.classList.add('hidden'), 4500);
}

function renderStatus() {
    const connection = resolveBotConnection(dashboard.runtime);
    const tone = {
        online: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
        degraded: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
        offline: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
    }[connection.state];
    $('botConnectionBadge').className = `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${tone}`;
    $('botConnectionBadge').innerHTML = `<span class="h-2.5 w-2.5 rounded-full bg-current" aria-hidden="true"></span>${escapeHTML(connection.label)}`;
    $('botConnectionDetail').textContent = connection.detail;
    $('botHeartbeat').textContent = dashboard.runtime?.last_heartbeat_at
        ? new Date(dashboard.runtime.last_heartbeat_at).toLocaleString('vi-VN')
        : 'Chưa ghi nhận';
    $('botVersion').textContent = dashboard.runtime?.version || 'Chưa xác định';
    const queued = dashboard.commands.filter(command => ['queued', 'processing'].includes(command.status)).length;
    const failed = dashboard.commands.filter(command => command.status === 'failed').length;
    $('botQueuedCount').textContent = queued.toLocaleString('vi-VN');
    $('botFailedCount').textContent = failed.toLocaleString('vi-VN');
}

function renderSchedule() {
    const settings = dashboard.settings || {};
    const rows = [
        ['Kế hoạch admin', settings.cron_admin_agenda, 'fa-calendar-check', 'text-blue-600'],
        ['Kiểm kê theo lô', settings.cron_audit, 'fa-clipboard-check', 'text-emerald-600'],
        ['Hàng hết', settings.cron_out_of_stock, 'fa-box-open', 'text-rose-600'],
        ['Hàng gần hết', settings.cron_low_stock, 'fa-arrow-trend-down', 'text-amber-600'],
        ['Thiếu giá vốn', settings.cron_missing_cost, 'fa-coins', 'text-violet-600'],
        ['Hàng cận date', settings.cron_expiring || settings.cron_report, 'fa-hourglass-half', 'text-orange-600'],
        ['Doanh thu cuối ngày', settings.cron_daily_sales || '0 20 * * *', 'fa-chart-line', 'text-blue-600']
    ];
    $('zaloSchedule').innerHTML = rows.map(([label, cron, icon, color]) => `
        <li class="flex min-h-11 items-center justify-between gap-3 border-b border-slate-200 py-2.5 last:border-0 dark:border-slate-800">
            <span class="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                <i class="fa-solid ${icon} w-5 text-center ${color}" aria-hidden="true"></i>${escapeHTML(label)}
            </span>
            <time class="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-sm font-black text-slate-800 dark:bg-slate-800 dark:text-white">${formatCronLabel(cron)}</time>
        </li>
    `).join('');
}

function renderActions() {
    const tone = {
        blue: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-900',
        emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-900',
        rose: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/30 dark:border-rose-900',
        amber: 'text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-900',
        violet: 'text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-300 dark:bg-violet-950/30 dark:border-violet-900',
        orange: 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-950/30 dark:border-orange-900',
        slate: 'text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700'
    };
    $('zaloActions').innerHTML = Object.entries(ZALO_COMMANDS).map(([command, meta]) => `
        <button type="button" data-zalo-command="${escapeHTML(command)}"
            class="group min-h-32 cursor-pointer rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/25 ${tone[meta.tone]}">
            <span class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-lg shadow-sm dark:bg-slate-900/70">
                <i class="fa-solid ${meta.icon}" aria-hidden="true"></i>
            </span>
            <span class="block text-sm font-black">${escapeHTML(meta.label)}</span>
            <span class="mt-1 block text-xs font-medium leading-5 opacity-80">${escapeHTML(meta.description)}</span>
        </button>
    `).join('');
}

function renderCommands() {
    const rows = dashboard.commands || [];
    $('zaloCommandRows').innerHTML = rows.length ? rows.map(command => {
        const meta = ZALO_COMMANDS[command.command_type] || { label: command.command_type };
        const statusTone = {
            queued: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            processing: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
            completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
            failed: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
        }[command.status] || 'bg-slate-100 text-slate-700';
        return `<tr>
            <td class="px-4 py-3 text-sm font-bold text-slate-800 dark:text-white">${escapeHTML(meta.label)}</td>
            <td class="px-4 py-3"><span class="rounded-full px-2.5 py-1 text-[11px] font-black ${statusTone}">${commandStatusLabel(command.status)}</span></td>
            <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${new Date(command.requested_at).toLocaleString('vi-VN')}</td>
            <td class="max-w-xs px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${escapeHTML(command.error_message || command.result?.status || '—')}</td>
        </tr>`;
    }).join('') : '<tr><td colspan="4" class="px-4 py-10 text-center text-sm font-bold text-slate-400">Chưa có lệnh nào.</td></tr>';
}

async function refreshDashboard({ silent = false } = {}) {
    const button = $('btnRefreshZalo');
    if (!silent) {
        button.disabled = true;
        button.querySelector('i')?.classList.add('fa-spin');
    }
    try {
        dashboard = await loadZaloControlDashboard();
        renderStatus();
        renderSchedule();
        renderCommands();
    } catch (error) {
        console.error('[zalo-control] Không tải được bảng điều khiển:', error);
        showNotice('Không tải được dữ liệu quản lý Zalo.', 'error');
    } finally {
        button.disabled = false;
        button.querySelector('i')?.classList.remove('fa-spin');
    }
}

function openConfirmation(command) {
    const meta = ZALO_COMMANDS[command];
    if (!meta) return;
    pendingCommand = command;
    $('zaloConfirmTitle').textContent = meta.label;
    $('zaloConfirmMessage').textContent = meta.confirmation;
    $('zaloConfirmModal').classList.remove('hidden');
    $('btnConfirmZaloCommand').focus();
}

function closeConfirmation() {
    pendingCommand = null;
    $('zaloConfirmModal').classList.add('hidden');
}

async function submitCommand() {
    if (!pendingCommand || !ZALO_COMMANDS[pendingCommand]) return;
    const command = pendingCommand;
    const button = $('btnConfirmZaloCommand');
    button.disabled = true;
    button.textContent = 'Đang đưa vào hàng đợi...';
    try {
        await enqueueZaloCommand(command);
        closeConfirmation();
        showNotice('Đã gửi lệnh an toàn tới máy bot.');
        await refreshDashboard({ silent: true });
    } catch (error) {
        console.error('[zalo-control] Không tạo được lệnh:', error);
        showNotice(error?.message?.includes('already queued')
            ? 'Lệnh này đang chờ hoặc đang chạy.'
            : 'Không thể gửi lệnh. Vui lòng thử lại.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Xác nhận chạy';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const layoutReady = await initLayout('admin', 'zalo');
    if (!layoutReady || !isZaloAdmin(currentUser())) return;
    renderActions();
    $('btnRefreshZalo')?.addEventListener('click', () => refreshDashboard());
    $('zaloActions')?.addEventListener('click', event => {
        const button = event.target.closest('[data-zalo-command]');
        if (button) openConfirmation(button.dataset.zaloCommand);
    });
    $('btnCancelZaloCommand')?.addEventListener('click', closeConfirmation);
    $('btnConfirmZaloCommand')?.addEventListener('click', submitCommand);
    $('zaloConfirmModal')?.addEventListener('click', event => {
        if (event.target === $('zaloConfirmModal')) closeConfirmation();
    });
    await refreshDashboard();
    refreshTimer = setInterval(() => {
        if (document.visibilityState === 'visible') refreshDashboard({ silent: true });
    }, 15000);
});

window.addEventListener('beforeunload', () => clearInterval(refreshTimer));
