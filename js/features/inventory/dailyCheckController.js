import { dailyCheckService } from './dailyCheckService.js';
import { formatNumber } from '../../utils/formatters.js';
import { supabaseClient } from '../../core/supabase.js';
import { verifyAuthenticatedEmployeeSession } from '../auth/employeeAuthSessionGuard.js';

const DRAFT_KEY = 'bot_inventory_batch_check_draft';
let dailyChecks = [];

function escapeHTML(value) {
    const div = document.createElement('div');
    div.innerText = String(value ?? '');
    return div.innerHTML;
}

function formatDate(value) {
    if (!value) return 'Không HSD';
    return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`));
}

function readDrafts() {
    try {
        return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    } catch {
        return {};
    }
}

function writeDraft(checkId, value) {
    const drafts = readDrafts();
    if (value === '') delete drafts[checkId];
    else drafts[checkId] = Number(value);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
}

function isCompleted(check) {
    return check.status === 'completed';
}

function hasDifference(check) {
    return isCompleted(check)
        && Number(check.counted_quantity) !== Number(check.expected_quantity);
}

function renderStatus(check) {
    if (!isCompleted(check)) {
        return '<span class="text-xs font-black text-slate-400">Chưa kiểm</span>';
    }
    if (!hasDifference(check)) {
        return '<span class="inline-flex px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black"><i class="fa-solid fa-check mr-1"></i> Khớp</span>';
    }
    const url = `stocktake.html?productId=${encodeURIComponent(check.product_id)}&batchId=${encodeURIComponent(check.batch_id)}`;
    return `
        <div class="flex flex-col items-center gap-1.5">
            <span class="inline-flex px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-black">
                Lệch ${formatNumber(Number(check.counted_quantity) - Number(check.expected_quantity))}
            </span>
            <a href="${url}" class="text-[11px] font-black text-violet-600 hover:underline">
                Lập phiếu điều chỉnh
            </a>
        </div>
    `;
}

function renderTable(tbodyId, rows, countId) {
    const tbody = document.getElementById(tbodyId);
    const countEl = document.getElementById(countId);
    if (!tbody || !countEl) return;

    const completedCount = rows.filter(isCompleted).length;
    countEl.innerText = `${completedCount} / ${rows.length} lô`;
    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-500">Không có lô được giao trong nhóm này.</td></tr>';
        return;
    }

    const drafts = readDrafts();
    tbody.innerHTML = rows.map(check => {
        const completed = isCompleted(check);
        const draftValue = drafts[check.check_id] ?? '';
        const counted = completed ? formatNumber(check.counted_quantity) : '';
        return `
            <tr class="${completed ? 'bg-emerald-50/40 dark:bg-emerald-950/10' : ''}" data-check-id="${check.check_id}">
                <td class="py-3 px-5 align-top">
                    <div class="font-mono text-xs font-black text-blue-600">${escapeHTML(check.product_code)}</div>
                    <div class="mt-1 font-black text-slate-800 dark:text-slate-100">${escapeHTML(check.product_name)}</div>
                </td>
                <td class="py-3 px-5 align-top">
                    <div class="font-black text-slate-800 dark:text-slate-100">${escapeHTML(check.batch_number)}</div>
                    <div class="mt-1 text-xs font-bold text-slate-500">${escapeHTML(check.base_unit || 'ĐV cơ sở')}</div>
                </td>
                <td class="py-3 px-5 align-top text-sm font-bold text-slate-600 dark:text-slate-300">${formatDate(check.expiry_date)}</td>
                <td class="py-3 px-5 text-center align-top">
                    ${completed
                        ? `<span class="text-lg font-black text-slate-900 dark:text-white">${counted}</span>`
                        : `<div class="flex items-center justify-center gap-2">
                            <input type="number" min="0" step="1" inputmode="numeric" value="${draftValue}"
                                class="counted-input w-24 px-3 py-2 rounded-xl border-2 border-pink-200 dark:border-pink-900 bg-white dark:bg-slate-800 text-center font-black outline-none focus:ring-2 focus:ring-pink-500"
                                aria-label="Thực đếm ${escapeHTML(check.product_name)} lô ${escapeHTML(check.batch_number)}">
                            <button type="button" class="btn-save-count min-h-10 px-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-black">
                                Lưu
                            </button>
                        </div>`}
                </td>
                <td class="py-3 px-5 text-center align-top">${renderStatus(check)}</td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('.counted-input').forEach(input => {
        input.addEventListener('input', event => {
            if (event.target.value !== '' && Number(event.target.value) < 0) {
                event.target.value = '0';
            }
            writeDraft(
                event.target.closest('tr').dataset.checkId,
                event.target.value
            );
        });
    });

    tbody.querySelectorAll('.btn-save-count').forEach(button => {
        button.addEventListener('click', async event => {
            const row = event.target.closest('tr');
            const input = row.querySelector('.counted-input');
            const countedQuantity = Number(input.value);
            if (input.value === '' || !Number.isFinite(countedQuantity) || countedQuantity < 0) {
                alert('Vui lòng nhập số lượng thực đếm hợp lệ.');
                return;
            }

            button.disabled = true;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            try {
                const result = await dailyCheckService.completeBatchCheck(
                    row.dataset.checkId,
                    countedQuantity
                );
                writeDraft(row.dataset.checkId, '');
                if (result?.has_difference) {
                    alert('Lô có chênh lệch. Hãy lập phiếu điều chỉnh tồn cho đúng số thực đếm.');
                }
                await loadChecks();
            } catch (error) {
                alert(`Không thể lưu kết quả kiểm lô: ${error.message}`);
                button.disabled = false;
                button.innerText = 'Lưu';
            }
        });
    });
}

function renderChecks() {
    renderTable(
        'dailyCheckRetailBody',
        dailyChecks.filter(check => check.tag_group === 'retail'),
        'retailCheckCount'
    );
    renderTable(
        'dailyCheckDoseBody',
        dailyChecks.filter(check => check.tag_group === 'dose_cut'),
        'doseCheckCount'
    );
    renderTable(
        'dailyCheckEcommerceBody',
        dailyChecks.filter(check => check.tag_group === 'ecommerce'),
        'ecommerceCheckCount'
    );
}

async function loadChecks() {
    const content = document.getElementById('dailyCheckContent');
    const button = document.getElementById('generateDailyCheckBtn');
    try {
        // This controller is loaded in parallel with inventoryController. Do
        // not call the bot RPC until the employee session has been verified;
        // stale/expired browser state must not leak protected data requests.
        const employee = await verifyAuthenticatedEmployeeSession(supabaseClient);
        if (!employee) return;
        dailyChecks = await dailyCheckService.getBatchChecks();
        renderChecks();
        content.classList.toggle('hidden', dailyChecks.length === 0);
        button.classList.remove('hidden');
        document.getElementById('dailyCheckStatusText').textContent = dailyChecks.length
            ? 'Đếm độc lập từng lô. Chỉ sau khi lưu mới hiển thị lô khớp hay chênh lệch.'
            : 'Hôm nay chưa có danh sách từ Zalo Bot hoặc không đủ ca Long–Hùng.';
    } catch (error) {
        console.error('Lỗi tải danh sách kiểm kê theo lô:', error);
        document.getElementById('dailyCheckStatusText').textContent =
            `Không tải được danh sách kiểm kê: ${error.message}`;
    }
}

function checkTimeAndLoad() {
    const forceTime = new URLSearchParams(window.location.search).get('forceTime') === '1';
    const beforeNoon = new Date().getHours() < 12 && !forceTime;
    document.getElementById('dailyCheckWaitState').classList.toggle('hidden', !beforeNoon);
    document.getElementById('dailyCheckContent').classList.toggle('hidden', beforeNoon);
    document.getElementById('generateDailyCheckBtn').classList.toggle('hidden', beforeNoon);
    if (!beforeNoon) loadChecks();
}

function initDailyCheck() {
    document.getElementById('generateDailyCheckBtn')
        ?.addEventListener('click', loadChecks);
    checkTimeAndLoad();
    setInterval(checkTimeAndLoad, 60000);
}

document.addEventListener('DOMContentLoaded', initDailyCheck);
