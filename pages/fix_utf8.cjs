const fs = require('fs');
let html = fs.readFileSync('inventory.html', 'utf8');
html = html.replace(/<!-- Modal: Confirm Cancel Document -->[\s\S]*<\/html>/, `<!-- Modal: Confirm Cancel Document -->
    <div id="confirmCancelDocModal" class="fixed inset-0 z-[100] hidden bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300">
            <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 class="text-lg font-black text-rose-600 dark:text-rose-400">Xác nhận hủy phiếu</h3>
                <button type="button" id="closeCancelDocModalBtn" class="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-red-500 transition-all flex items-center justify-center">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-6 space-y-4">
                <p id="cancelDocMessage" class="text-sm font-medium text-slate-600 dark:text-slate-400"></p>
                <div>
                    <label class="block text-xs font-black uppercase text-slate-500 mb-2">Lý do hủy <span class="text-rose-500">*</span></label>
                    <input type="text" id="cancelDocReasonInput" placeholder="Nhập lý do hủy phiếu..." class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-rose-500 text-sm font-semibold">
                </div>
            </div>
            <div class="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
                <button type="button" id="dismissCancelDocBtn" class="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Đóng</button>
                <button type="button" id="confirmCancelDocBtn" class="px-6 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/30 transition-all">Xác nhận Hủy</button>
            </div>
        </div>
    </div>
</body>
</html>`);
fs.writeFileSync('inventory.html', html, 'utf8');
console.log('Fixed UTF-8');
