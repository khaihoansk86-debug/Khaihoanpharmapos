import { supabase } from '../../utils/supabase.js';

let allEmployees = [];
let branchSettingsId = null;

document.addEventListener('DOMContentLoaded', async () => {
    bindTabs();
    await loadBranchSettings();
    await loadEmployeesForAuth();

    document.getElementById('branchForm').addEventListener('submit', handleSaveBranchSettings);
    document.getElementById('userAuthForm').addEventListener('submit', handleSaveAuth);
    document.getElementById('authEmployeeSelect').addEventListener('change', handleSelectEmployeeAuth);
});

// --- Tab Navigation ---
function bindTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const views = {
        branch: document.getElementById('branchView'),
        auth: document.getElementById('authView')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const viewName = tab.getAttribute('data-view');
            
            // Reset styles
            tabs.forEach(t => {
                t.setAttribute('aria-selected', 'false');
                t.classList.add('text-slate-600', 'dark:text-slate-400');
            });
            
            // Set active style
            tab.setAttribute('aria-selected', 'true');
            tab.classList.remove('text-slate-600', 'dark:text-slate-400');

            // Hide all views, show active
            Object.values(views).forEach(v => v.classList.add('hidden'));
            if (views[viewName]) {
                views[viewName].classList.remove('hidden');
            }
        });
    });
}

// --- Branch Settings ---
async function loadBranchSettings() {
    try {
        const { data, error } = await supabase.from('branch_settings').select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') {
            console.error('Lỗi tải cài đặt chi nhánh:', error);
            return;
        }

        if (data) {
            branchSettingsId = data.id;
            document.getElementById('branchName').value = data.branch_name || '';
            document.getElementById('branchPhone').value = data.phone || '';
            document.getElementById('branchAddress').value = data.address || '';
            document.getElementById('receiptHeader').value = data.receipt_header || '';
            document.getElementById('receiptFooter').value = data.receipt_footer || '';
        }
    } catch (e) {
        console.error(e);
    }
}

async function handleSaveBranchSettings(e) {
    e.preventDefault();
    const data = {
        branch_name: document.getElementById('branchName').value.trim(),
        phone: document.getElementById('branchPhone').value.trim(),
        address: document.getElementById('branchAddress').value.trim(),
        receipt_header: document.getElementById('receiptHeader').value.trim(),
        receipt_footer: document.getElementById('receiptFooter').value.trim()
    };

    try {
        if (branchSettingsId) {
            const { error } = await supabase.from('branch_settings').update(data).eq('id', branchSettingsId);
            if (error) throw error;
        } else {
            const { data: newData, error } = await supabase.from('branch_settings').insert([data]).select().single();
            if (error) throw error;
            branchSettingsId = newData.id;
        }
        showToast('Đã lưu thông tin chi nhánh', 'success');
    } catch (error) {
        console.error('Lỗi lưu cài đặt:', error);
        showToast('Lỗi lưu cài đặt chi nhánh', 'error');
    }
}

// --- Auth Settings ---
async function loadEmployeesForAuth() {
    try {
        const { data, error } = await supabase.from('employees').select('id, name, username, role').order('created_at', { ascending: false });
        if (error) throw error;
        
        allEmployees = data || [];
        
        const select = document.getElementById('authEmployeeSelect');
        select.innerHTML = '<option value="">-- Chọn nhân viên --</option>';
        allEmployees.forEach(emp => {
            select.insertAdjacentHTML('beforeend', `<option value="${emp.id}">${emp.name} ${emp.username ? `(@${emp.username})` : ''}</option>`);
        });

        renderAuthTable();
    } catch (e) {
        console.error('Lỗi tải nhân viên:', e);
    }
}

function renderAuthTable() {
    const tbody = document.getElementById('authTableBody');
    tbody.innerHTML = '';
    
    const authedEmployees = allEmployees.filter(emp => emp.username);

    if (authedEmployees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-4 py-6 text-center text-slate-500 italic text-sm">Chưa có tài khoản nào được cấp.</td></tr>`;
        return;
    }

    authedEmployees.forEach(emp => {
        const roleBadge = emp.role === 'admin' 
            ? '<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">Quản lý</span>'
            : '<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">Nhân viên</span>';

        const row = `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="px-4 py-3 font-bold text-slate-800 dark:text-white">${emp.name}</td>
                <td class="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono">@${emp.username}</td>
                <td class="px-4 py-3">${roleBadge}</td>
                <td class="px-4 py-3 text-right">
                    <button onclick="window.editAuth('${emp.id}')" class="text-blue-500 hover:text-blue-700 px-2" title="Sửa quyền">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="window.removeAuth('${emp.id}')" class="text-red-400 hover:text-red-600 px-2" title="Gỡ tài khoản">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

function handleSelectEmployeeAuth() {
    const empId = document.getElementById('authEmployeeSelect').value;
    const emp = allEmployees.find(e => e.id === empId);
    
    if (emp && emp.username) {
        document.getElementById('authEmployeeId').value = emp.id;
        document.getElementById('authUsername').value = emp.username;
        document.getElementById('authRole').value = emp.role || 'staff';
        document.getElementById('authPassword').value = '';
    } else {
        document.getElementById('authEmployeeId').value = empId;
        document.getElementById('authUsername').value = '';
        document.getElementById('authRole').value = 'staff';
        document.getElementById('authPassword').value = '';
    }
}

window.editAuth = (id) => {
    document.getElementById('authEmployeeSelect').value = id;
    handleSelectEmployeeAuth();
    document.getElementById('authUsername').focus();
};

window.removeAuth = async (id) => {
    if (!confirm('Bạn có chắc muốn gỡ quyền đăng nhập của nhân viên này? (Họ vẫn có tên trong danh sách nhân sự)')) return;
    try {
        const { error } = await supabase.from('employees').update({ username: null, password_hash: null, role: 'staff' }).eq('id', id);
        if (error) throw error;
        showToast('Đã gỡ tài khoản thành công', 'success');
        document.getElementById('userAuthForm').reset();
        await loadEmployeesForAuth();
    } catch (e) {
        console.error(e);
        showToast('Lỗi khi gỡ tài khoản', 'error');
    }
};

// Hàm mã hóa MD5 đơn giản (Chỉ để test, thực tế nên dùng bcrypt trên server)
async function hashPassword(str) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleSaveAuth(e) {
    e.preventDefault();
    const empId = document.getElementById('authEmployeeId').value || document.getElementById('authEmployeeSelect').value;
    if (!empId) {
        showToast('Vui lòng chọn nhân viên', 'error');
        return;
    }

    const username = document.getElementById('authUsername').value.trim();
    const role = document.getElementById('authRole').value;
    const rawPass = document.getElementById('authPassword').value;

    const updateData = { username, role };
    if (rawPass) {
        updateData.password_hash = await hashPassword(rawPass);
    }

    try {
        const { error } = await supabase.from('employees').update(updateData).eq('id', empId);
        if (error) {
            if (error.code === '23505') { // Unique violation
                showToast('Tên đăng nhập đã tồn tại!', 'error');
            } else {
                throw error;
            }
            return;
        }
        
        showToast('Đã cấp tài khoản thành công', 'success');
        document.getElementById('userAuthForm').reset();
        document.getElementById('authEmployeeId').value = '';
        await loadEmployeesForAuth();
    } catch (error) {
        console.error('Lỗi cấp tài khoản:', error);
        showToast('Có lỗi xảy ra', 'error');
    }
}

// Toast Utils (Copy từ các UI file khác)
function showToast(message, type = 'success', duration = 3000) {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const colorMap = {
        success: 'bg-emerald-600 text-white',
        error:   'bg-red-600 text-white',
        info:    'bg-blue-600 text-white',
    };
    const iconMap = {
        success: 'fa-circle-check',
        error:   'fa-circle-xmark',
        info:    'fa-circle-info',
    };

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = [
        'fixed top-5 right-5 z-[9999] flex items-center gap-3',
        'px-5 py-3 rounded-xl shadow-2xl text-sm font-bold',
        'transition-all duration-300 translate-x-0 opacity-100',
        colorMap[type] || colorMap.info
    ].join(' ');
    toast.innerHTML = `<i class="fa-solid ${iconMap[type] || iconMap.info}"></i><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-4');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
