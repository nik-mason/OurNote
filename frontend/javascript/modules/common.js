/**
 * OURNOTE COMMON MODULE (Shared State & Utils)
 */
export const state = {
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
    currentCategory: 'all',
    isDashboard: window.location.pathname.includes('/dashboard') || !!document.getElementById('dashboard-hero') || (window.location.pathname === '/' && !!document.getElementById('posts-container'))
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

export function showConfirm(message, title = '확인') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const okBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        const msgEl = document.getElementById('confirm-message');
        const titleEl = document.getElementById('confirm-title');

        if (!modal || !okBtn || !cancelBtn) {
            resolve(confirm(message));
            return;
        }

        msgEl.textContent = message;
        titleEl.textContent = title;
        modal.classList.remove('hidden');
        
        // Add active class for animation
        const body = modal.querySelector('.modal-v4');
        setTimeout(() => body?.classList.add('active'), 10);

        const onOk = () => {
            close();
            resolve(true);
        };

        const onCancel = () => {
            close();
            resolve(false);
        };

        const close = () => {
            body?.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 400);
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
        };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}
