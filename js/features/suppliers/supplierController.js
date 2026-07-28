import { initLayout } from '../../components/layout.js';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier, buildSupplierCode } from './supplierService.js';

let allSuppliers = [];

async function initSuppliers() {
    if (!await initLayout('admin', 'suppliers')) return;
    await loadSuppliers();
    setupEventListeners();
}

async function loadSuppliers() {
    const grid = document.getElementById('supplierGrid');
    try {
        allSuppliers = await fetchSuppliers();
        renderSuppliers();
        updateStats();
    } catch (err) {
        console.error('Lỗi tải đối tác:', err);
        if (grid) {
            grid.innerHTML = `
                <div class="col-span-full py-20 text-center glass-card rounded-3xl border-red-200 bg-red-50 dark:bg-red-900/10">
                    <i class="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
                    <p class="font-bold text-red-600 dark:text-red-400">Không thể tải danh sách đối tác</p>
                    <p class="text-sm text-red-500/70 mt-1">${err.message}</p>
                    <button onclick="location.reload()" class="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all">Thử lại</button>
                </div>`;
        }
    }
}

function renderSuppliers() {
    const grid = document.getElementById('supplierGrid');
    const searchTerm = document.getElementById('supplierSearch')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('contactTypeFilter')?.value || 'all';

    const filtered = allSuppliers.filter(s => {
        const matchesSearch = 
            s.name.toLowerCase().includes(searchTerm) || 
            s.supplier_code.toLowerCase().includes(searchTerm) ||
            (s.contact_info || '').toLowerCase().includes(searchTerm);
        
        const matchesType = typeFilter === 'all' || s.contact_type === typeFilter;
        
        return matchesSearch && matchesType;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-20 text-center glass-card rounded-3xl border-dashed">
                <i class="fa-solid fa-handshake-slash text-5xl text-slate-200 dark:text-slate-800 mb-4"></i>
                <p class="font-bold text-slate-400">Không tìm thấy đối tác nào phù hợp.</p>
            </div>`;
        return;
    }

    grid.innerHTML = filtered.map(s => {
        let contactIcon = 'fa-phone';
        let contactLabel = 'Gọi điện / Zalo';
        let actionColor = 'bg-emerald-500 shadow-emerald-500/20';
        let actionIcon = 'fa-phone';
        let contactUrl = `tel:${s.contact_info}`;

        if (s.contact_type === 'web') {
            contactIcon = 'fa-globe';
            contactLabel = 'Website';
            actionColor = 'bg-blue-500 shadow-blue-500/20';
            actionIcon = 'fa-external-link-alt';
            contactUrl = s.contact_info?.startsWith('http') ? s.contact_info : `https://${s.contact_info}`;
        } else if (s.contact_type === 'internal') {
            contactIcon = 'fa-building-user';
            contactLabel = 'Nội bộ';
            actionColor = 'bg-slate-500 shadow-slate-500/20';
            actionIcon = 'fa-info-circle';
            contactUrl = 'javascript:void(0)';
        }

        const infoDisplay = s.contact_info || (s.contact_type === 'internal' ? 'Nguồn nội bộ' : 'Chưa có thông tin');

        return `
            <div class="glass-card rounded-[2rem] p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                
                <div class="flex justify-between items-start mb-6">
                    <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <i class="fa-solid ${contactIcon} text-xl"></i>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.editSupplier('${s.id}')" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-500 hover:text-blue-600 transition-all flex items-center justify-center">
                            <i class="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button onclick="window.deleteSupplierBtn('${s.id}')" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-slate-500 hover:text-red-600 transition-all flex items-center justify-center">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="font-black text-lg text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">${s.name}</h3>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">${s.supplier_code}</p>
                </div>

                <div class="space-y-3 mb-6">
                    <div class="flex items-center gap-3 text-sm">
                        <div class="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 shrink-0">
                            <i class="fa-solid fa-link text-[10px]"></i>
                        </div>
                        <span class="font-bold text-slate-600 dark:text-slate-400 truncate">${infoDisplay}</span>
                    </div>
                    ${s.address ? `
                    <div class="flex items-center gap-3 text-sm">
                        <div class="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 shrink-0">
                            <i class="fa-solid fa-location-dot text-[10px]"></i>
                        </div>
                        <span class="text-slate-500 truncate">${s.address}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <span class="w-1.5 h-1.5 ${s.is_active ? 'bg-emerald-500' : 'bg-slate-400'} rounded-full"></span>
                        <span class="text-[10px] font-black text-slate-500 uppercase">${s.is_active ? 'Hoạt động' : 'Tạm dừng'}</span>
                    </div>
                    
                    ${s.contact_type !== 'internal' ? `
                    <a href="${contactUrl}" target="_blank" class="${actionColor} text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all">
                        <i class="fa-solid ${actionIcon}"></i> ${contactLabel}
                    </a>
                    ` : `
                    <div class="bg-slate-100 dark:bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                        <i class="fa-solid fa-lock"></i> Nguồn nội bộ
                    </div>
                    `}
                </div>
            </div>`;
    }).join('');
}

function updateStats() {
    const totalEl = document.getElementById('totalSuppliers');
    if (totalEl) totalEl.textContent = allSuppliers.length;
}

function setupEventListeners() {
    document.getElementById('supplierSearch')?.addEventListener('input', renderSuppliers);
    document.getElementById('contactTypeFilter')?.addEventListener('change', renderSuppliers);

    const contactTypeSelect = document.getElementById('contact_type');
    if (contactTypeSelect) {
        contactTypeSelect.addEventListener('change', (e) => updateModalContactType(e.target.value));
    }

    const form = document.getElementById('supplierForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitSupplierForm();
        });
    }
}

function updateModalContactType(type) {
    const label = document.getElementById('contactInfoLabel');
    const icon = document.getElementById('contactInfoIcon');
    const input = document.getElementById('contact_info');
    const section = document.getElementById('contactInfoSection');

    if (type === 'phone') {
        section.classList.remove('hidden');
        label.textContent = 'Số điện thoại / Zalo';
        icon.className = 'fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400';
        input.placeholder = 'Nhập số điện thoại...';
        input.required = true;
    } else if (type === 'web') {
        section.classList.remove('hidden');
        label.textContent = 'Website / Link đặt hàng';
        icon.className = 'fa-solid fa-globe absolute left-4 top-1/2 -translate-y-1/2 text-slate-400';
        input.placeholder = 'https://example.com...';
        input.required = true;
    } else {
        section.classList.add('hidden');
        input.required = false;
        input.value = '';
    }
}

window.openAddSupplierModal = () => {
    const form = document.getElementById('supplierForm');
    form.reset();
    document.getElementById('supplier_id').value = '';
    document.getElementById('modalTitle').textContent = 'Thêm đối tác';
    document.getElementById('supplier_code').value = buildSupplierCode();
    updateModalContactType('phone');
    document.getElementById('supplierModal').classList.remove('hidden');
};

window.editSupplier = (id) => {
    const s = allSuppliers.find(x => x.id === id);
    if (!s) return;

    document.getElementById('supplier_id').value = s.id;
    document.getElementById('modalTitle').textContent = 'Sửa đối tác';
    document.getElementById('name').value = s.name;
    document.getElementById('supplier_code').value = s.supplier_code;
    document.getElementById('contact_type').value = s.contact_type;
    document.getElementById('contact_info').value = s.contact_info || '';
    document.getElementById('note').value = s.note || '';
    document.getElementById('is_active').checked = s.is_active;

    updateModalContactType(s.contact_type);
    document.getElementById('supplierModal').classList.remove('hidden');
};

window.closeSupplierModal = () => {
    document.getElementById('supplierModal').classList.add('hidden');
};

async function submitSupplierForm() {
    const id = document.getElementById('supplier_id').value;
    const payload = {
        name: document.getElementById('name').value,
        supplier_code: document.getElementById('supplier_code').value,
        contact_type: document.getElementById('contact_type').value,
        contact_info: document.getElementById('contact_info').value,
        note: document.getElementById('note').value,
        is_active: document.getElementById('is_active').checked
    };

    try {
        if (id) {
            await updateSupplier(id, payload);
        } else {
            await createSupplier(payload);
        }
        window.closeSupplierModal();
        await loadSuppliers();
    } catch (err) {
        alert('Lỗi: ' + err.message);
    }
}

window.deleteSupplierBtn = async (id) => {
    if (confirm('Bạn có chắc muốn xóa đối tác này?')) {
        try {
            await deleteSupplier(id);
            await loadSuppliers();
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    }
};

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSuppliers);
} else {
    initSuppliers();
}
