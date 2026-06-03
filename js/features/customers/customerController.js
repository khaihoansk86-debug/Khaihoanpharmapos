import { initLayout } from '../../components/layout.js';
import { createCustomer, createCustomerGroup, fetchCustomerGroups, fetchCustomers, setCustomerActive, setCustomerGroupActive, updateCustomer, updateCustomerGroup } from './customerService.js';

let allCustomers = [];
let filteredCustomers = [];
let customerGroups = [];
let activeTab = 'customers';
let expandedGroupCode = null;
const groupMemberQueries = new Map();
const els = {};

const groupLabels = {
    retail: 'Khách lẻ',
    vip: 'VIP',
    wholesale: 'Bán sỉ',
    clinic: 'Phòng khám'
};

const genderLabels = {
    male: 'Nam',
    female: 'Nữ',
    other: 'Khác'
};

function cacheElements() {
    [
        'statCustomers', 'statActive', 'statSpent', 'statDebt',
        'customerSearch', 'groupFilter', 'statusFilter', 'groupFilterMobile', 'statusFilterMobile', 'mobileFilterPanel',
        'customersTabButton', 'groupsTabButton', 'customersTabPanel', 'groupsTabPanel', 'groupTableWrapper', 'groupEmptyState', 'groupTableBody',
        'groupModal', 'groupForm', 'groupModalTitle', 'groupId', 'groupNameInput', 'groupDiscountInput', 'groupDescriptionInput', 'groupActiveInput',
        'loadingState', 'errorState', 'emptyState', 'errorMessage', 'customerTableWrapper', 'customerTableBody',
        'customerModal', 'customerForm', 'modalTitle', 'customerId', 'fullNameInput', 'phoneInput', 'emailInput',
        'customerGroupInput', 'genderInput', 'birthDateInput', 'taxCodeInput', 'addressInput', 'noteInput', 'activeInput'
    ].forEach(id => { els[id] = document.getElementById(id); });
}

function escapeHTML(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function formatNumber(value) {
    return new Intl.NumberFormat('vi-VN').format(Number(value || 0));
}

function formatCurrency(value) {
    return `${formatNumber(value)} đ`;
}

function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('vi-VN');
}

function groupBadge(group) {
    const map = {
        retail: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        vip: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
        wholesale: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
        clinic: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
    };
    return map[group] || map.retail;
}

function statusBadge(isActive) {
    return isActive
        ? ['Đang hoạt động', 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800']
        : ['Ngưng theo dõi', 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'];
}

function setLoading(isLoading) {
    els.loadingState.classList.toggle('hidden', !isLoading);
    els.errorState.classList.add('hidden');
    els.emptyState.classList.add('hidden');
    els.customerTableWrapper.classList.add('hidden');
}

function updateStats(customers) {
    els.statCustomers.textContent = formatNumber(customers.length);
    els.statActive.textContent = formatNumber(customers.filter(customer => customer.is_active !== false).length);
    els.statSpent.textContent = formatCurrency(customers.reduce((sum, customer) => sum + Number(customer.total_spent || 0), 0));
    els.statDebt.textContent = formatCurrency(customers.reduce((sum, customer) => sum + Number(customer.debt_amount || 0), 0));
}

function applyFilters() {
    const query = els.customerSearch.value.trim().toLowerCase();

    filteredCustomers = allCustomers.filter(customer => {
        const groupLabel = getGroupLabel(customer.customer_group || 'retail');
        const haystack = `${customer.customer_code || ''} ${customer.full_name || ''} ${customer.phone || ''} ${customer.email || ''} ${customer.note || ''} ${groupLabel}`.toLowerCase();
        if (query && !haystack.includes(query)) return false;
        return true;
    });

    renderTable(filteredCustomers);
    updateStats(filteredCustomers);
}
function renderTable(customers) {
    if (!customers.length) {
        els.customerTableWrapper.classList.add('hidden');
        els.emptyState.classList.remove('hidden');
        return;
    }

    els.emptyState.classList.add('hidden');
    els.customerTableWrapper.classList.remove('hidden');
    els.customerTableBody.innerHTML = customers.map(renderCustomerRow).join('');
}

function renderCustomerRow(customer) {
    const encoded = encodeURIComponent(JSON.stringify(customer));
    const [statusLabel, statusClass] = statusBadge(customer.is_active !== false);
    const group = customer.customer_group || 'retail';
    const phone = customer.phone || '-';
    const email = customer.email || '';

    return `
        <tr class="group/customer bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-md">
            <td class="py-4 px-5 align-top border-y border-l border-slate-200 dark:border-slate-800 rounded-l-2xl">
                <div class="font-black text-slate-900 dark:text-white group-hover/customer:text-blue-700 dark:group-hover/customer:text-blue-300 transition-colors">${escapeHTML(customer.full_name)}</div>
                <div class="text-xs font-mono text-slate-500 mt-1">${escapeHTML(customer.customer_code || '')}</div>
                ${customer.gender ? `<div class="text-xs text-slate-500 mt-1">${escapeHTML(genderLabels[customer.gender] || customer.gender)}</div>` : ''}
            </td>
            <td class="py-4 px-5 align-top border-y border-slate-200 dark:border-slate-800">
                <div class="font-bold text-slate-800 dark:text-slate-200">${escapeHTML(phone)}</div>
                ${email ? `<div class="text-xs text-slate-500 mt-1">${escapeHTML(email)}</div>` : ''}
                ${customer.address ? `<div class="text-xs text-slate-500 mt-1 max-w-[260px] truncate">${escapeHTML(customer.address)}</div>` : ''}
            </td>
            <td class="py-4 px-5 align-top border-y border-slate-200 dark:border-slate-800"><span class="inline-flex px-2.5 py-1 rounded-lg text-xs font-black uppercase border ${groupBadge(group)}">${escapeHTML(getGroupLabel(group))}</span>${customer.note ? `<div class="text-xs text-slate-500 mt-2 max-w-[220px] truncate">${escapeHTML(customer.note)}</div>` : ""}</td>
            <td class="py-4 px-5 align-top text-right border-y border-slate-200 dark:border-slate-800 font-black text-blue-600 dark:text-blue-400">${formatCurrency(customer.total_spent)}</td>
            <td class="py-4 px-5 align-top text-right border-y border-slate-200 dark:border-slate-800 font-black ${Number(customer.debt_amount || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}">${formatCurrency(customer.debt_amount)}</td>
            <td class="py-4 px-5 align-top border-y border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">${formatDateTime(customer.last_purchase_at)}</td>
            <td class="py-4 px-5 align-top border-y border-slate-200 dark:border-slate-800"><span class="inline-flex px-2.5 py-1 rounded-lg text-xs font-black uppercase border ${statusClass}">${statusLabel}</span></td>
            <td class="py-4 px-5 align-top text-center border-y border-r border-slate-200 dark:border-slate-800 rounded-r-2xl">
                <div class="inline-flex items-center gap-1">
                    <button data-action="edit-customer" data-customer="${encoded}" class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 transition-all duration-200" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                    <button data-action="toggle-customer-active" data-customer="${encoded}" class="w-8 h-8 rounded-lg ${customer.is_active !== false ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200'} border transition-all duration-200" title="${customer.is_active !== false ? 'Ngưng theo dõi' : 'Kích hoạt'}"><i class="fa-solid ${customer.is_active !== false ? 'fa-user-slash' : 'fa-user-check'}"></i></button>
                </div>
            </td>
        </tr>`;
}

function getGroupLabel(code) {
    const group = customerGroups.find(item => item.group_code === code);
    return group?.group_name || groupLabels[code] || code || 'Khách lẻ';
}

function populateGroupControls() {
    const activeGroups = customerGroups.filter(group => group.is_active !== false);
    const filterOptions = '<option value="all">Tất cả nhóm</option>' + activeGroups.map(group => `<option value="${escapeHTML(group.group_code)}">${escapeHTML(group.group_name)}</option>`).join('');
    const inputOptions = activeGroups.map(group => `<option value="${escapeHTML(group.group_code)}">${escapeHTML(group.group_name)}</option>`).join('');
    els.groupFilter.innerHTML = filterOptions;
    els.groupFilterMobile.innerHTML = filterOptions;
    els.customerGroupInput.innerHTML = inputOptions || '<option value="retail">Khách lẻ</option>';
}

function renderGroupTable() {
    if (!customerGroups.length) {
        els.groupTableWrapper.classList.add('hidden');
        els.groupEmptyState.classList.remove('hidden');
        return;
    }
    els.groupEmptyState.classList.add('hidden');
    els.groupTableWrapper.classList.remove('hidden');
    els.groupTableBody.innerHTML = customerGroups.map(renderGroupRow).join('');
}

function renderGroupRow(group) {
    const encoded = encodeURIComponent(JSON.stringify(group));
    const [label, cls] = statusBadge(group.is_active !== false);
    return `
        <tr class="group/customer bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-md">
            <td class="py-4 px-5 align-top border-y border-l border-slate-200 dark:border-slate-800 rounded-l-2xl"><div class="font-black text-slate-900 dark:text-white">${escapeHTML(group.group_name)}</div>${group.description ? `<div class="text-xs text-slate-500 mt-1 max-w-[360px] truncate">${escapeHTML(group.description)}</div>` : ''}</td>
            <td class="py-4 px-5 align-top border-y border-slate-200 dark:border-slate-800 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">${escapeHTML(group.group_code)}</td>
            <td class="py-4 px-5 align-top text-right border-y border-slate-200 dark:border-slate-800 font-black text-blue-600 dark:text-blue-400">${formatNumber(group.discount_percent)}%</td>
            <td class="py-4 px-5 align-top border-y border-slate-200 dark:border-slate-800"><span class="inline-flex px-2.5 py-1 rounded-lg text-xs font-black uppercase border ${cls}">${label}</span></td>
            <td class="py-4 px-5 align-top text-center border-y border-r border-slate-200 dark:border-slate-800 rounded-r-2xl"><div class="inline-flex items-center gap-1"><button data-action="edit-group" data-group="${encoded}" class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 transition-all duration-200" title="Sửa"><i class="fa-solid fa-pen"></i></button><button data-action="toggle-group-active" data-group="${encoded}" class="w-8 h-8 rounded-lg ${group.is_active !== false ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200'} border transition-all duration-200" title="${group.is_active !== false ? 'Ngưng sử dụng' : 'Kích hoạt'}"><i class="fa-solid ${group.is_active !== false ? 'fa-eye-slash' : 'fa-eye'}"></i></button></div></td>
        </tr>`;
}

function switchTab(tab) {
    activeTab = tab;
    const isCustomers = tab === 'customers';
    els.customersTabPanel.classList.toggle('hidden', !isCustomers);
    els.groupsTabPanel.classList.toggle('hidden', isCustomers);
    els.customersTabButton.className = isCustomers ? 'px-4 py-2 rounded-xl text-sm font-black bg-blue-600 text-white shadow-sm transition-all duration-200' : 'px-4 py-2 rounded-xl text-sm font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200';
    els.groupsTabButton.className = !isCustomers ? 'px-4 py-2 rounded-xl text-sm font-black bg-blue-600 text-white shadow-sm transition-all duration-200' : 'px-4 py-2 rounded-xl text-sm font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200';
}

async function loadGroups() {
    customerGroups = await fetchCustomerGroups();
    populateGroupControls();
    renderGroupTable();
}
async function loadCustomers() {
    setLoading(true);
    try {
        allCustomers = await fetchCustomers();
        applyFilters();
    } catch (error) {
        console.error('Không thể tải khách hàng:', error);
        els.errorMessage.textContent = `Lỗi tải khách hàng: ${error.message}`;
        els.errorState.classList.remove('hidden');
    } finally {
        els.loadingState.classList.add('hidden');
    }
}

function openModal(customer = null) {
    els.customerForm.reset();
    els.customerId.value = customer?.id || '';
    els.modalTitle.textContent = customer ? 'Sửa khách hàng' : 'Thêm khách hàng';
    els.fullNameInput.value = customer?.full_name || '';
    els.phoneInput.value = customer?.phone || '';
    els.emailInput.value = customer?.email || '';
    els.customerGroupInput.value = customer?.customer_group || 'retail';
    els.genderInput.value = customer?.gender || '';
    els.birthDateInput.value = customer?.birth_date || '';
    els.taxCodeInput.value = customer?.tax_code || '';
    els.addressInput.value = customer?.address || '';
    els.noteInput.value = customer?.note || '';
    els.activeInput.checked = customer?.is_active !== false;
    els.customerModal.classList.remove('hidden');
}

function closeModal() {
    els.customerModal.classList.add('hidden');
}

function getFormPayload() {
    return {
        full_name: els.fullNameInput.value,
        phone: els.phoneInput.value,
        email: els.emailInput.value,
        customer_group: els.customerGroupInput.value,
        gender: els.genderInput.value,
        birth_date: els.birthDateInput.value,
        tax_code: els.taxCodeInput.value,
        address: els.addressInput.value,
        note: els.noteInput.value,
        is_active: els.activeInput.checked
    };
}

async function submitCustomerForm() {
    if (!els.customerForm.reportValidity()) return;
    const button = document.querySelector('[data-action="submit-customer-form"]');
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

    try {
        const id = els.customerId.value;
        if (id) await updateCustomer(id, getFormPayload());
        else await createCustomer(getFormPayload());
        closeModal();
        await loadGroups();
        await loadCustomers();
    } catch (error) {
        alert(`Không thể lưu khách hàng: ${error.message}`);
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu khách hàng';
    }
}

function decodeCustomer(target) {
    const encoded = target.closest('[data-customer]')?.dataset.customer;
    return encoded ? JSON.parse(decodeURIComponent(encoded)) : null;
}

async function toggleCustomerActive(customer) {
    if (!customer) return;
    const nextActive = customer.is_active === false;
    const ok = confirm(nextActive ? 'Kích hoạt lại khách hàng này?' : 'Ngưng theo dõi khách hàng này?');
    if (!ok) return;

    try {
        await setCustomerActive(customer.id, nextActive);
        await loadGroups();
        await loadCustomers();
    } catch (error) {
        alert(`Không thể cập nhật trạng thái: ${error.message}`);
    }
}

function syncFilters(source) {
    if (source === 'mobile') {
        els.groupFilter.value = els.groupFilterMobile.value;
        els.statusFilter.value = els.statusFilterMobile.value;
    } else {
        els.groupFilterMobile.value = els.groupFilter.value;
        els.statusFilterMobile.value = els.statusFilter.value;
    }
    applyFilters();
}
function openGroupModal(group = null) {
    els.groupForm.reset();
    els.groupId.value = group?.id || '';
    els.groupModalTitle.textContent = group ? 'Sửa nhóm khách' : 'Tạo nhóm khách';
    els.groupNameInput.value = group?.group_name || '';
    els.groupDiscountInput.value = group?.discount_percent || 0;
    els.groupDescriptionInput.value = group?.description || '';
    els.groupActiveInput.checked = group?.is_active !== false;
    els.groupModal.classList.remove('hidden');
}

function closeGroupModal() {
    els.groupModal.classList.add('hidden');
}

function getGroupPayload() {
    return {
        group_name: els.groupNameInput.value,
        discount_percent: els.groupDiscountInput.value,
        description: els.groupDescriptionInput.value,
        is_active: els.groupActiveInput.checked
    };
}

async function submitGroupForm() {
    if (!els.groupForm.reportValidity()) return;
    const button = document.querySelector('[data-action="submit-group-form"]');
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
    try {
        const id = els.groupId.value;
        if (id) await updateCustomerGroup(id, getGroupPayload());
        else await createCustomerGroup(getGroupPayload());
        closeGroupModal();
        await loadGroups();
        applyFilters();
    } catch (error) {
        alert(`Không thể lưu nhóm khách: ${error.message}`);
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu nhóm';
    }
}

function decodeGroup(target) {
    const encoded = target.closest('[data-group]')?.dataset.group;
    return encoded ? JSON.parse(decodeURIComponent(encoded)) : null;
}

async function toggleGroupActive(group) {
    if (!group) return;
    const nextActive = group.is_active === false;
    const ok = confirm(nextActive ? 'Kích hoạt lại nhóm khách này?' : 'Ngưng sử dụng nhóm khách này?');
    if (!ok) return;
    try {
        await setCustomerGroupActive(group.id, nextActive);
        await loadGroups();
        applyFilters();
    } catch (error) {
        alert(`Không thể cập nhật nhóm khách: ${error.message}`);
    }
}
function bindEvents() {
    let customerSearchTimeout;
    els.customerSearch.addEventListener('input', () => {
        clearTimeout(customerSearchTimeout);
        customerSearchTimeout = setTimeout(applyFilters, 300);
    });
    els.groupFilter.addEventListener('change', () => syncFilters('desktop'));
    els.statusFilter.addEventListener('change', () => syncFilters('desktop'));
    els.groupFilterMobile.addEventListener('change', () => syncFilters('mobile'));
    els.statusFilterMobile.addEventListener('change', () => syncFilters('mobile'));

    document.addEventListener('input', event => {
        const searchEl = event.target.closest('[data-group-member-search]');
        if (!searchEl) return;
        groupMemberQueries.set(searchEl.dataset.groupMemberSearch, searchEl.value);
        renderGroupTable();
    });

    document.addEventListener('click', event => {
        const actionEl = event.target.closest('[data-action]');
        const action = actionEl?.dataset.action;
        if (!action) return;

        if (action === 'reload-customers') { loadGroups(); loadCustomers(); }
        if (action === 'switch-tab') switchTab(actionEl.dataset.tab);
        if (action === 'toggle-group-members') { expandedGroupCode = expandedGroupCode === actionEl.dataset.groupCode ? null : actionEl.dataset.groupCode; renderGroupTable(); }
        if (action === 'open-mobile-filters') els.mobileFilterPanel.classList.toggle('hidden');
        if (action === 'open-customer-modal') openModal();
        if (action === 'open-group-modal') openGroupModal();
        if (action === 'close-group-modal') closeGroupModal();
        if (action === 'submit-group-form') submitGroupForm();
        if (action === 'edit-group') openGroupModal(decodeGroup(actionEl));
        if (action === 'toggle-group-active') toggleGroupActive(decodeGroup(actionEl));
        if (action === 'close-customer-modal') closeModal();
        if (action === 'submit-customer-form') submitCustomerForm();
        if (action === 'edit-customer') openModal(decodeCustomer(actionEl));
        if (action === 'toggle-customer-active') toggleCustomerActive(decodeCustomer(actionEl));
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    initLayout('admin', 'customers');
    cacheElements();
    bindEvents();
    await loadGroups();
        await loadCustomers();
});
