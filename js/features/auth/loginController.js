import { supabaseClient as supabase } from '../../core/supabase.js';
import { logActivity } from '../logs/auditService.js';
import {
    authenticateLegacyEmployee,
    tryUpgradeEmployeeAuthSession
} from './employeeAuthenticationService.js';

document.addEventListener('DOMContentLoaded', () => {
    // Nếu đã đăng nhập, chuyển hướng thẳng vào POS
    const existingUser = localStorage.getItem('pos_user');
    if (existingUser) {
        window.location.href = 'pos.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const errorText = document.getElementById('errorText');
    const loginBtn = document.getElementById('loginBtn');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Trạng thái loading
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xử lý...';
        errorMsg.classList.add('hidden');

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        try {
            const data = await authenticateLegacyEmployee(supabase, {
                username,
                password
            });
            data.authenticatedSession = await tryUpgradeEmployeeAuthSession(supabase, {
                employee: data,
                username,
                password
            });
            
            // Đảm bảo manager và staff có quyền xem Tổng quan
            data.permissions = data.permissions || [];

            if (data.role === 'manager' || data.role === 'staff') {
                if (!data.permissions.includes('access_overview')) {
                    data.permissions.push('access_overview');
                }
            }

            // Lưu thông tin người dùng vào localStorage để duy trì phiên
            localStorage.setItem('pos_user', JSON.stringify(data));

            // Ghi log đăng nhập (không throw lỗi nếu log thất bại)
            try {
                await logActivity('login', {
                    username: data.username,
                    message: `Đăng nhập thành công vào hệ thống.`
                }, data.name, data.role);
            } catch (logErr) {
                console.warn('Lỗi ghi log đăng nhập:', logErr);
            }
            
            // Điều hướng dựa trên quyền hạn chi tiết
            let hasAccessProducts = false;
            if (data.permissions && Array.isArray(data.permissions) && data.permissions.length > 0) {
                hasAccessProducts = data.permissions.includes('access_products');
            } else {
                hasAccessProducts = (data.role === 'admin' || data.role === 'manager');
            }

            if (hasAccessProducts) {
                window.location.href = 'products.html';
            } else {
                window.location.href = 'pos.html';
            }

        } catch (err) {
            errorText.textContent = err.message || 'Lỗi kết nối, vui lòng thử lại.';
            errorMsg.classList.remove('hidden');
            
            // Reset button
            loginBtn.disabled = false;
            loginBtn.innerHTML = `
                <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span class="relative z-10">Đăng nhập</span>
                <i class="fa-solid fa-arrow-right relative z-10 group-hover:translate-x-1 transition-transform"></i>
            `;
        }
    });
});
