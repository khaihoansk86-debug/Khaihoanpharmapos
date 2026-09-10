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
    loadZaloControlDashboard,
    verifyZaloAdmin
} from './zaloControlService.js';
import { loadZaloInventoryPreview } from './zaloInventoryPreviewService.js';
import { INVENTORY_SECTIONS, audienceLabel, formatQuantity, formatZaloTime, readInventoryDTO, filterInventory, commandAudience, commandResultLabel, canDispatch, runtimeLayerLabels, commandDisplayName } from './zaloInventoryViewRules.js';

let dashboard = { settings: {}, runtime: null, commands: [] };
let pendingCommand = null;
let refreshTimer = null;
let submitting = false;
let refreshing = false;
let dataReady = false;
let pageNumber = 1;
let returnFocus = null;
let inventory = null;
let previewBusy = false;
let previewExpiresAt = null;
let previewStatus = 'unavailable';
let previewExpiryTimer = null;
let freshnessTimer = null;
let previewCommandId = null;
const uncertainCommands = new Set();

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
    const connection = dataReady ? resolveBotConnection(dashboard.runtime) : {state:'offline',label:'Chưa xác minh kết nối',detail:'Không đọc được trạng thái mới; thông tin trước đó có thể đã cũ.'};
    const layers=runtimeLayerLabels(dataReady ? dashboard.runtime : null);
    $('botLayerStatus').textContent=layers.bot;
    $('managerLayerStatus').textContent=layers.manager;
    $('zaloLayerStatus').textContent=layers.zalo;
    const source=dashboard.runtime?.metadata?.controlCapabilities?.sourceCommit;
    $('botSourceCommit').textContent=/^[0-9a-f]{40}$/i.test(source || '') ? source : 'Chưa có hash runtime được xác minh';
    const tone = {
        online: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
        degraded: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
        offline: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
    }[connection.state];
    $('botConnectionBadge').className = `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${tone}`;
    $('botConnectionBadge').innerHTML = `<span class="h-2.5 w-2.5 rounded-full bg-current" aria-hidden="true"></span>${escapeHTML(connection.label)}`;
    $('botConnectionDetail').textContent = connection.detail;
    $('botHeartbeat').textContent = formatZaloTime(dashboard.runtime?.last_heartbeat_at);
    $('botVersion').textContent = dashboard.runtime?.version || 'Chưa xác định';
    const queued = dashboard.commands.filter(command => ['queued', 'processing'].includes(command.status)).length;
    const failed = dashboard.commands.filter(command => command.status === 'failed').length;
    $('botQueuedCount').textContent = queued.toLocaleString('vi-VN');
    $('botFailedCount').textContent = failed.toLocaleString('vi-VN');
    const age = Date.now() - Date.parse(dashboard.runtime?.last_heartbeat_at);
    $('botObservation').textContent = `Nguồn: heartbeat Bot · Tuổi tín hiệu: ${Number.isFinite(age) && age >= 0 ? Math.floor(age/1000) + ' giây' : 'chưa xác định'}. Nhãn phiên bản không xác nhận commit đang chạy.`;
    const current = dashboard.commands.find(c => c.id === dashboard.runtime?.current_command_id);
    $('botCurrentCommand').textContent = dashboard.runtime?.current_command_id
        ? `Lệnh Bot báo đang chạy: ${ZALO_COMMANDS[current?.command_type]?.label || 'Ngoài 30 lệnh đã tải'}` : 'Bot chưa báo lệnh đang chạy.';
}

function renderSchedule() {
    const settings = dashboard.settings || {};
    const rows = [
        ['Kế hoạch admin', settings.cron_admin_agenda, 'fa-calendar-check', 'text-blue-600'],
        ['Kiểm kê theo lô', settings.cron_audit, 'fa-clipboard-check', 'text-emerald-600'],
        ['Hàng hết', settings.cron_out_of_stock, 'fa-box-open', 'text-rose-600'],
        ['Hàng dưới Min', settings.cron_low_stock, 'fa-arrow-trend-down', 'text-amber-600'],
        ['Thiếu giá vốn', settings.cron_missing_cost, 'fa-coins', 'text-violet-600'],
        ['Hàng cận date', settings.cron_expiring || settings.cron_report, 'fa-hourglass-half', 'text-orange-600'],
        ['Doanh thu cuối ngày', settings.cron_daily_sales, 'fa-chart-line', 'text-blue-600']
    ];
    $('zaloSchedule').innerHTML = rows.map(([label, cron, icon, color]) => `
        <li class="flex min-h-11 items-center justify-between gap-3 border-b border-slate-200 py-2.5 last:border-0 dark:border-slate-800">
            <span class="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                <i class="fa-solid ${icon} w-5 text-center ${color}" aria-hidden="true"></i>${escapeHTML(label)}
            </span>
            <span class="text-xs">${label.includes('admin') || label.includes('Doanh thu') ? 'Admin' : 'Nhóm vận hành'}</span>
            <time class="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-sm font-black text-slate-800 dark:bg-slate-800 dark:text-white">${escapeHTML(formatCronLabel(cron, cron ? 'Lịch tùy chỉnh: ' + cron : 'Chưa có cấu hình DB'))}</time>
        </li>
    `).join('');
}

function renderActions() {
    renderPreviewAction();
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
        <button type="button" data-zalo-command="${escapeHTML(command)}" ${!dataReady || !canDispatch(dashboard.runtime, command) || uncertainCommands.has(command) ? 'disabled' : ''}
            class="group min-h-32 cursor-pointer rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/25 ${tone[meta.tone]}">
            <span class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-lg shadow-sm dark:bg-slate-900/70">
                <i class="fa-solid ${meta.icon}" aria-hidden="true"></i>
            </span>
            <span class="block text-sm font-black">${escapeHTML(meta.label)}</span>
            <span class="mt-1 block text-xs font-medium leading-5 opacity-80">${escapeHTML(meta.description)} · ${commandAudience(command)}</span>
        </button>
    `).join('');
    $('zaloSendCapability').textContent = dataReady && Object.keys(ZALO_COMMANDS).some(c => canDispatch(dashboard.runtime,c))
        ? 'Chỉ nghiệp vụ backend xác nhận hỗ trợ được mở. Gửi ngay ngoài lịch tự động.' : 'Chưa xác minh capability/phiên bản backend hoặc dữ liệu đã cũ. Chức năng gửi đang khóa.';
}

function renderCommands() {
    const filtered = (dashboard.commands || []).filter(c => !$('commandFilter').value || c.status === $('commandFilter').value);
    const pages = Math.max(1, Math.ceil(filtered.length/10));
    pageNumber = Math.min(pageNumber,pages);
    const rows = filtered.slice((pageNumber-1)*10,pageNumber*10);
    $('historyPage').textContent = `Trang ${pageNumber}/${pages} · ${filtered.length} lệnh trong mẫu 30 gần nhất`;
    $('historyPrevious').disabled = pageNumber <= 1;
    $('historyNext').disabled = pageNumber >= pages;
    $('zaloCommandRows').innerHTML = rows.length ? rows.map(command => {
        const meta = ZALO_COMMANDS[command.command_type] || { label: commandDisplayName(command.command_type) };
        const statusTone = {
            queued: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            processing: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
            completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
            failed: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
        }[command.status] || 'bg-slate-100 text-slate-700';
        return `<tr>
            <td class="px-4 py-3 text-sm font-bold text-slate-800 dark:text-white">${escapeHTML(meta.label)}</td>
            <td class="px-4 py-3"><span class="rounded-full px-2.5 py-1 text-[11px] font-black ${statusTone}">${commandStatusLabel(command.status)}</span></td>
            <td class="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${formatZaloTime(command.requested_at)}<br>Người yêu cầu: ${escapeHTML(command.requester?.name || (command.requested_by ? 'Chưa tải được tên' : 'Không ghi nhận nhân sự'))}<details><summary>Chi tiết kỹ thuật</summary>Bắt đầu: ${formatZaloTime(command.started_at)}<br>Kết thúc: ${formatZaloTime(command.completed_at)}<br>Mã người yêu cầu: ${escapeHTML(command.requested_by || 'Chưa ghi nhận')}<br>Mã lệnh: ${escapeHTML(command.id)}<br>Loại lệnh: ${escapeHTML(command.command_type)}</details></td>
            <td class="max-w-xs px-4 py-3 text-xs text-slate-500 dark:text-slate-400">${escapeHTML(commandResultLabel(command))}</td>
        </tr>`;
    }).join('') : '<tr><td colspan="4" class="px-4 py-10 text-center text-sm font-bold text-slate-400">Chưa có lệnh nào.</td></tr>';
}

async function refreshDashboard({ silent = false } = {}) {
    if (refreshing) return;
    refreshing = true;
    const button = $('btnRefreshZalo');
    if (!silent) {
        button.disabled = true;
        button.querySelector('i')?.classList.add('fa-spin');
    }
    try {
        if (!await verifyZaloAdmin()) throw new Error('admin_session_changed');
        dashboard = await loadZaloControlDashboard();
        dataReady = true;
        $('zaloLoadState').textContent = `Dữ liệu đọc lúc ${formatZaloTime(new Date().toISOString())}. Chỉ phản ánh nguồn Supabase.`;
        renderStatus();
        renderSchedule();
        renderCommands();
        renderActions();
    } catch (error) {
        dataReady = false;
        inventory = null;
        clearTimeout(previewExpiryTimer);
        renderInventory();
        $('zaloLoadState').textContent = 'Không tải được dữ liệu. Thông tin đang hiển thị có thể đã cũ; đã khóa gửi. Hãy kiểm tra kết nối rồi làm mới.';
        renderStatus();
        renderActions();
        showNotice('Không tải được dữ liệu quản lý Zalo.', 'error');
    } finally {
        refreshing = false;
        button.disabled = false;
        button.querySelector('i')?.classList.remove('fa-spin');
    }
}

function openConfirmation(command) {
    const meta = ZALO_COMMANDS[command];
    if (!meta || submitting || !dataReady || uncertainCommands.has(command) || !canDispatch(dashboard.runtime,command)) return;
    returnFocus = document.activeElement;
    pendingCommand = command;
    $('zaloConfirmTitle').textContent = meta.label;
    $('zaloConfirmMessage').textContent = `${meta.confirmation} Người nhận: ${commandAudience(command)}. Gửi ngay ngoài lịch tự động. Dữ liệu sẽ được tính lại khi thực thi, có thể khác bản xem trước.`;
    $('zaloConfirmModal').classList.remove('hidden');
    $('btnConfirmZaloCommand').focus();
}

function closeConfirmation() {
    if (submitting) return;
    pendingCommand = null;
    $('zaloConfirmModal').classList.add('hidden');
    returnFocus?.focus();
}

async function submitCommand() {
    if (submitting || !pendingCommand || !ZALO_COMMANDS[pendingCommand] || !dataReady || !canDispatch(dashboard.runtime,pendingCommand)) return;
    submitting = true;
    const command = pendingCommand;
    const button = $('btnConfirmZaloCommand');
    button.disabled = true;
    button.textContent = 'Đang đưa vào hàng đợi...';
    try {
        await enqueueZaloCommand(command);
        submitting = false;
        closeConfirmation();
        showNotice('Đã tiếp nhận lệnh; chưa xác nhận gửi tin. Theo dõi Lịch sử lệnh.');
        await refreshDashboard({ silent: true });
    } catch (error) {
        uncertainCommands.add(command);
        submitting = false;
        closeConfirmation();
        renderActions();
        showNotice(error?.message?.includes('already queued')
            ? 'Lệnh này đang chờ hoặc đang chạy.'
            : 'Chưa xác định lệnh đã được nhận hay chưa. Đối chiếu lịch sử/Manager, không gửi lại ngay.', 'error');
    } finally {
        button.disabled = false;
        submitting = false;
        button.textContent = 'Xác nhận chạy';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const layoutReady = await initLayout('admin', 'zalo');
    if (!layoutReady || !isZaloAdmin(currentUser())) {
        $('zaloLoadState').textContent = 'Trang điều phối chỉ dành cho phiên quản trị đã xác minh.';
        $('btnRefreshZalo').disabled = true;
        return;
    }
    try {
        if (!await verifyZaloAdmin()) throw new Error('denied');
    } catch {
        $('zaloLoadState').textContent = 'Không có quyền hoặc không xác minh được phiên quản trị. Không tải dữ liệu điều phối.';
        $('btnRefreshZalo').disabled = true;
        return;
    }
    setupTabs();
    renderInventory();
    $('btnPreviewInventory').addEventListener('click', () => refreshPreview(true));
    $('inventoryGroup').addEventListener('change',renderInventory);
    $('inventorySearch').addEventListener('input',renderInventory);
    $('commandFilter').addEventListener('change',()=>{pageNumber=1;renderCommands();});
    $('historyPrevious').addEventListener('click',()=>{pageNumber--;renderCommands();});
    $('historyNext').addEventListener('click',()=>{pageNumber++;renderCommands();});
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
    $('zaloConfirmModal').addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();closeConfirmation();}
        if(event.key==='Tab'){
            event.preventDefault();
            const buttons=[$('btnCancelZaloCommand'),$('btnConfirmZaloCommand')].filter(b=>!b.disabled);
            const next=(buttons.indexOf(document.activeElement)+(event.shiftKey?-1:1)+buttons.length)%buttons.length;
            buttons[next]?.focus();
        }
    });
    await refreshDashboard();
    await refreshPreview(false);
    refreshTimer = setInterval(() => {
        if (document.visibilityState === 'visible') refreshDashboard({ silent: true });
    }, 15000);
    freshnessTimer = setInterval(() => {
        renderStatus(); renderPreviewAction();
        document.querySelectorAll('[data-zalo-command]').forEach(button => {
            button.disabled=!dataReady || !canDispatch(dashboard.runtime,button.dataset.zaloCommand) || uncertainCommands.has(button.dataset.zaloCommand);
        });
    },5000);
});

function renderPreviewAction() {
    if (inventory && Date.parse(previewExpiresAt) <= Date.now()) {
        inventory = null;
        previewStatus = 'expired';
        $('inventoryAvailability').textContent = 'Preview đã hết hạn. Bấm Xem trước để đọc bản mới.';
        renderInventory();
    }
    const button = $('btnPreviewInventory');
    const resume = ['pending','uncertain'].includes(previewStatus) || (previewStatus === 'error' && previewCommandId);
    button.disabled = previewBusy || !dataReady || (!resume
        && (!canDispatch(dashboard.runtime, 'preview_inventory_health_v1')
            || dashboard.runtime?.metadata?.controlCapabilities?.previewInventoryHealthV1 !== true));
    button.textContent = previewBusy ? 'Đang kiểm tra preview...' : resume ? 'Kiểm tra lại preview' : 'Xem trước trực tiếp';
}

async function refreshPreview(request) {
    if (previewBusy) return;
    previewBusy = true;
    clearTimeout(previewExpiryTimer);
    inventory = null;
    renderInventory();
    renderPreviewAction();
    $('inventoryAvailability').textContent = 'Đang xác minh phiên admin và đọc preview...';
    try {
        const preview = await loadZaloInventoryPreview({ request });
        previewStatus = preview.status;
        previewCommandId = preview.commandId || null;
        if (preview.status === 'ready') {
            inventory = readInventoryDTO(preview.data);
            previewExpiresAt = preview.expiresAt;
            previewExpiryTimer = setTimeout(renderPreviewAction, Math.max(0, Date.parse(previewExpiresAt) - Date.now()));
        }
        $('inventoryAvailability').textContent = preview.reason || 'Dữ liệu preview chưa hợp lệ.';
    } catch {
        previewStatus = 'error';
        $('inventoryAvailability').textContent = 'Không đọc được preview. Kiểm tra kết nối và quyền admin.';
    } finally {
        previewBusy = false;
        renderInventory();
        renderPreviewAction();
    }
}

function setupTabs() {
    const tabs=[...document.querySelectorAll('[data-tab]')];
    const select=tab=>{tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;$('panel-'+t.dataset.tab).hidden=!selected;});};
    tabs.forEach((tab,index)=>{
        tab.addEventListener('click',()=>select(tab));
        tab.addEventListener('keydown',event=>{
            if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
            event.preventDefault();
            const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowLeft'?-1:1)+tabs.length)%tabs.length;
            select(tabs[next]);tabs[next].focus();
        });
    });
}

function renderInventory() {
    $('inventoryCounts').innerHTML=Object.entries(INVENTORY_SECTIONS).map(([key,label])=>`<div>${label}<strong>${formatQuantity(inventory?.counts[key])}</strong></div>`).join('');
    $('inventorySearch').disabled=!inventory;
    const rows=filterInventory(inventory?.sections[$('inventoryGroup').value] || [],$('inventorySearch').value);
    $('inventoryRows').innerHTML=rows.length?rows.map(r=>`<tr><td><a href="products.html?zaloSku=${encodeURIComponent(r.productId)}" title="Xem SKU trong danh mục">${escapeHTML(r.code)}</a><small>${escapeHTML(r.name)}</small></td><td>${formatQuantity(r.availableStock)}</td><td>${escapeHTML(r.baseUnit || 'Chưa rõ')}</td><td>${formatQuantity(r.min)}</td><td>${formatQuantity(r.max)}</td><td>${escapeHTML(r.note)}<small>Bán chậm: Chưa có đánh giá</small></td></tr>`).join(''):`<tr><td colspan="6">${inventory?'Không có mặt hàng phù hợp.':'Chưa có dữ liệu preview; dấu — không phải tồn bằng 0.'}</td></tr>`;
    $('inventoryObservedAt').textContent=inventory?`Quan sát: ${formatZaloTime(inventory.observedAt)} · Hết hạn: ${formatZaloTime(previewExpiresAt)}`:'Chưa có bản preview còn hạn.';
    $('inventoryTechnical').textContent=`Quy tắc: ${inventory?.ruleVersion || 'Chưa ghi nhận'} · Hash nguồn: ${inventory?.sourceCommit || 'Chưa xác minh'} · Mã lệnh: ${previewCommandId || 'Chưa ghi nhận'}`;
    $('inventoryMessages').innerHTML=inventory?inventory.messages.map(m=>m.parts.map((part,i)=>`<article class="zalo-phone"><strong>${audienceLabel(m.audience)} · Phần ${i+1}/${m.parts.length}</strong><p>${escapeHTML(part)}</p></article>`).join('')).join(''):'Chưa có bản tin từ backend.';
}

window.addEventListener('beforeunload', () => { clearInterval(refreshTimer); clearInterval(freshnessTimer); clearTimeout(previewExpiryTimer); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') renderPreviewAction(); });
