import { supabaseClient as supabase } from '../../core/supabase.js';
import { logActivity } from '../logs/auditService.js';

// Hàm mã hóa mật khẩu tương tự như trong settingsController.js
async function hashPassword(str) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    // Nếu đã đăng nhập, chuyển hướng thẳng vào POS
    const user = localStorage.getItem('pos_user');
    if (user) {
        window.location.href = 'pos.html';
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
            const hashed = await hashPassword(password);
            
            // Tìm nhân viên khớp username và password_hash
            let result = await supabase
                .from('employees')
                .select('id, name, username, role, status, permissions')
                .eq('username', username)
                .eq('password_hash', hashed)
                .single();

            let data = result.data;
            let error = result.error;

            if (error && (error.message?.includes('permissions') || error.code === 'PGRST100' || String(error.status) === '400')) {
                const retry = await supabase
                    .from('employees')
                    .select('id, name, username, role, status')
                    .eq('username', username)
                    .eq('password_hash', hashed)
                    .single();
                data = retry.data;
                error = retry.error;
                if (data) {
                    data.permissions = [];
                }
            }

            if (error || !data) {
                throw new Error('Sai tên đăng nhập hoặc mật khẩu!');
            }

            if (data.status === 'inactive') {
                throw new Error('Tài khoản này đã bị vô hiệu hóa!');
            }
            
            // Thành công
            localStorage.setItem('pos_user', JSON.stringify(data));

            // Ghi log đăng nhập
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
