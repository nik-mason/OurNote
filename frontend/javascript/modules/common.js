/**
 * OURNOTE COMMON MODULE (Shared State & Utils)
 */
export const state = {
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
    currentCategory: 'all',
    isDashboard: window.location.pathname.includes('/dashboard')
};

export function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `ultra-glass p-6 rounded-2xl flex items-center gap-4 border-l-4 ${type === 'error' ? 'border-accent' : 'border-primary'}`;
    toast.style.cssText = 'position: relative; animation: slideIn 0.5s ease forwards;';
    toast.innerHTML = `
        <span class="material-symbols-outlined ${type === 'error' ? 'text-accent' : 'text-primary'}">
            ${type === 'error' ? 'error' : 'auto_awesome'}
        </span>
        <span class="font-bold text-white">${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
