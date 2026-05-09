// js/core/supabase.js
// -------------------------------------------------------
// Cấu hình kết nối Supabase
//
// ⚠️  PRODUCTION: Đặt giá trị này vào Vercel Environment Variables
//     - SUPABASE_URL
//     - SUPABASE_ANON_KEY
//
// 🛠️  LOCAL DEV: Tạo file js/core/config.local.js (đã gitignore)
//     với nội dung:
//         export const LOCAL_SUPABASE_URL = 'https://xxx.supabase.co';
//         export const LOCAL_SUPABASE_ANON_KEY = 'sb_publishable_xxx';
// -------------------------------------------------------
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Giá trị này được Vercel inject lúc build (nếu dùng framework).
// Với static HTML deploy, để trực tiếp ở đây — anon key của Supabase
// được thiết kế để public, bảo mật nằm ở Row Level Security (RLS).
const SUPABASE_URL      = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';

let supabaseClient = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.error('Lỗi khởi tạo Supabase:', error);
    }
}

export { supabaseClient, SUPABASE_URL, SUPABASE_ANON_KEY };
