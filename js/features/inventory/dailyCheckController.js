import { dailyCheckService } from './dailyCheckService.js';
import { formatNumber } from '../../utils/formatters.js';

let dailyTasks = [];
let currentCycleId = 0;
let daysRemaining = 0;

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}

function initDailyCheck() {
    const btn = document.getElementById('generateDailyCheckBtn');
    if (btn) btn.addEventListener('click', generateOrLoadTasks);

    checkTimeAndLoad();
    // Tự động kiểm tra thời gian mỗi phút để mở khóa lúc 12h mà không cần tải lại trang
    setInterval(checkTimeAndLoad, 60000);
}

function checkTimeAndLoad() {
    const forceTime = new URLSearchParams(window.location.search).get('forceTime') === '1';
    const now = new Date();
    
    // Yêu cầu: khóa lại trước 12h
    if (now.getHours() < 12 && !forceTime) {
        document.getElementById('dailyCheckWaitState').classList.remove('hidden');
        document.getElementById('dailyCheckContent').classList.add('hidden');
        document.getElementById('generateDailyCheckBtn').classList.add('hidden');
    } else {
        document.getElementById('dailyCheckWaitState').classList.add('hidden');
        // Cho phép ấn Lấy danh sách hoặc tự động tải
        document.getElementById('generateDailyCheckBtn').classList.remove('hidden');
        
        // Thử tải danh sách của ngày hôm nay nếu đã có
        if (dailyTasks.length === 0) {
            loadTasks();
        }
    }
}

async function loadTasks() {
    try {
        const tasks = await dailyCheckService.getTasks();
        if (tasks && tasks.length > 0) {
            dailyTasks = tasks;
            renderTasks();
            document.getElementById('dailyCheckContent').classList.remove('hidden');
            document.getElementById('generateDailyCheckBtn').classList.add('hidden');
        }
    } catch (error) {
        console.error("Lỗi khi tải tasks:", error);
    }
}

async function generateOrLoadTasks() {
    const btn = document.getElementById('generateDailyCheckBtn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG TẠO...';
    btn.disabled = true;

    try {
        const res = await dailyCheckService.generateTasks();
        if (res.status === 'success' || res.status === 'already_generated') {
            await loadTasks();
        } else {
            alert("Lỗi khi tạo danh sách: " + JSON.stringify(res));
        }
    } catch (error) {
        alert("Lỗi: " + error.message);
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}

function renderTasks() {
    const retail = dailyTasks.filter(t => t.tag_group === 'retail');
    const dose = dailyTasks.filter(t => t.tag_group === 'dose_cut');
    const eco = dailyTasks.filter(t => t.tag_group === 'ecommerce');

    renderTable('dailyCheckRetailBody', retail, 'retailCheckCount');
    renderTable('dailyCheckDoseBody', dose, 'doseCheckCount');
    renderTable('dailyCheckEcommerceBody', eco, 'ecommerceCheckCount');
}

function renderTable(tbodyId, data, countId) {
    const tbody = document.getElementById(tbodyId);
    const countEl = document.getElementById(countId);
    
    // Lấy dữ liệu nháp
    const draftStr = localStorage.getItem('daily_check_draft');
    let drafts = draftStr ? JSON.parse(draftStr) : {};

    const completedCount = data.filter(t => t.status === 'completed').length;
    countEl.innerText = `${completedCount} / ${data.length}`;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-500">Không có hàng hóa nào trong mục này cho hôm nay.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(item => {
        const isCompleted = item.status === 'completed';
        const bgClass = isCompleted ? 'bg-green-50 dark:bg-green-900/10' : '';
        const textColor = isCompleted ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300';
        
        // Load draft value if exists
        let draftVal = drafts[item.task_id] !== undefined ? drafts[item.task_id] : '';
        
        return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${bgClass}" data-task-id="${item.task_id}">
            <td class="py-3 px-5 font-bold ${textColor}">${escapeHTML(item.product_code)}</td>
            <td class="py-3 px-5 font-bold ${textColor}">${escapeHTML(item.product_name)}</td>
            <td class="py-3 px-5 text-right font-black text-slate-900 dark:text-white">${formatNumber(item.total_stock)} ${escapeHTML(item.base_unit || '')}</td>
            <td class="py-3 px-5 text-center">
                ${isCompleted ? 
                    `<span class="font-black text-lg ${textColor}">${formatNumber(item.counted_quantity)}</span>` : 
                    `<div class="flex items-center justify-center gap-2">
                        <input type="number" min="0" step="1" value="${draftVal}" class="counted-input w-24 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-slate-800 text-center font-bold" placeholder="Tồn kho...">
                    </div>`
                }
            </td>
            <td class="py-3 px-5 text-center">
                ${isCompleted ? 
                    `<span class="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-black"><i class="fa-solid fa-check"></i> Đã kiểm</span>` : 
                    `<button type="button" class="btn-save-count px-4 py-1.5 rounded-xl bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400 text-xs font-black transition-all">Lưu</button>`
                }
            </td>
        </tr>
        `;
    }).join('');

    // Save draft on input
    tbody.querySelectorAll('.counted-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            // Prevent negative numbers visually
            if (val !== '' && parseInt(val) < 0) {
                e.target.value = 0;
            }
            const taskId = e.target.closest('tr').dataset.taskId;
            
            const currentDraftsStr = localStorage.getItem('daily_check_draft');
            let currentDrafts = currentDraftsStr ? JSON.parse(currentDraftsStr) : {};
            
            if (e.target.value === '') {
                delete currentDrafts[taskId];
            } else {
                currentDrafts[taskId] = parseInt(e.target.value) || 0;
            }
            
            localStorage.setItem('daily_check_draft', JSON.stringify(currentDrafts));
        });
    });

    // Add event listeners for save buttons
    tbody.querySelectorAll('.btn-save-count').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const tr = e.target.closest('tr');
            const taskId = tr.dataset.taskId;
            const input = tr.querySelector('.counted-input');
            const val = parseInt(input.value);
            
            if (isNaN(val) || val < 0) {
                alert("Vui lòng nhập số lượng hợp lệ.");
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            try {
                await dailyCheckService.updateTask(taskId, val);
                
                // Clear from draft
                const currentDraftsStr = localStorage.getItem('daily_check_draft');
                if (currentDraftsStr) {
                    let currentDrafts = JSON.parse(currentDraftsStr);
                    delete currentDrafts[taskId];
                    localStorage.setItem('daily_check_draft', JSON.stringify(currentDrafts));
                }

                // Update UI state
                const task = dailyTasks.find(t => t.task_id === taskId);
                if (task) {
                    task.status = 'completed';
                    task.counted_quantity = val;
                }
                renderTasks();
            } catch (err) {
                alert("Lỗi lưu kết quả: " + err.message);
                btn.disabled = false;
                btn.innerHTML = 'Lưu';
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initDailyCheck);
