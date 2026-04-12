import { state, showToast } from '../common.js';

export function initSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    window.openSettings = () => {
        // Prepare visibility based on role
        const isStudent = state.currentUser?.role !== 'teacher';
        document.getElementById('nav-security').style.display = isStudent ? 'flex' : 'none';
        
        modal.classList.remove('hidden');
        const overlay = document.getElementById('close-settings-overlay');
        const content = modal.querySelector('.modal-settings');
        
        // Switch to general by default
        showSection('general');

        setTimeout(() => {
            if(overlay) overlay.style.opacity = '1';
            content.classList.replace('translate-y-full', 'translate-y-0');
            content.classList.replace('opacity-0', 'opacity-100');
        }, 10);
    };

    const closeHandler = () => {
        const overlay = document.getElementById('close-settings-overlay');
        const content = modal.querySelector('.modal-settings');
        
        content.classList.replace('translate-y-0', 'translate-y-full');
        content.classList.replace('opacity-100', 'opacity-0');
        if(overlay) overlay.style.opacity = '0';
        
        setTimeout(() => modal.classList.add('hidden'), 500);
    };

    document.getElementById('close-settings-modal')?.addEventListener('click', closeHandler);
    document.getElementById('close-settings-overlay')?.addEventListener('click', closeHandler);

    // Section Switching Logic
    const showSection = (name) => {
        const sections = ['general', 'security', 'about'];
        sections.forEach(s => {
            const el = document.getElementById(`section-${s}`);
            const btn = document.getElementById(`nav-${s}`);
            if (el) el.classList.toggle('hidden', s !== name);
            if (btn) {
                if (s === name) {
                    btn.classList.add('bg-white', 'shadow-sm', 'text-primary');
                    btn.classList.remove('hover:bg-slate-100', 'text-text-secondary');
                } else {
                    btn.classList.remove('bg-white', 'shadow-sm', 'text-primary');
                    btn.classList.add('hover:bg-slate-100', 'text-text-secondary');
                }
            }
        });
    };

    document.getElementById('nav-general')?.addEventListener('click', () => showSection('general'));
    document.getElementById('nav-security')?.addEventListener('click', () => showSection('security'));
    document.getElementById('nav-about')?.addEventListener('click', () => showSection('about'));

    // Theme Switching
    const themeLight = document.getElementById('theme-light');
    const themeDark = document.getElementById('theme-dark');

    const updateThemeUI = (theme) => {
        const isDark = theme === 'dark';
        themeLight.classList.toggle('border-primary', !isDark);
        themeLight.querySelector('div').classList.toggle('hidden', isDark);
        
        themeDark.classList.toggle('border-primary', isDark);
        const darkCheck = themeDark.querySelector('div') || document.createElement('div');
        if (!themeDark.querySelector('div')) {
            darkCheck.className = 'absolute top-4 right-4 size-5 rounded-full bg-primary flex items-center justify-center';
            darkCheck.innerHTML = '<span class="material-symbols-outlined text-white text-xs">check</span>';
            themeDark.appendChild(darkCheck);
        }
        darkCheck.classList.toggle('hidden', !isDark);

        // Apply to body
        document.body.classList.toggle('dark-mode', isDark);
        localStorage.setItem('ournote_theme', theme);
    };

    themeLight?.addEventListener('click', () => updateThemeUI('light'));
    themeDark?.addEventListener('click', () => updateThemeUI('dark'));

    // PIN Update Logic
    document.getElementById('save-pin')?.addEventListener('click', async () => {
        const currentPin = document.getElementById('pin-current').value;
        const newPin = document.getElementById('pin-new').value;
        const confirmPin = document.getElementById('pin-confirm').value;

        if (newPin.length !== 6 || isNaN(newPin)) {
            showToast('PIN은 숫자 6자리여야 합니다.', 'error');
            return;
        }

        if (newPin !== confirmPin) {
            showToast('새 PIN이 일치하지 않습니다.', 'error');
            return;
        }

        try {
            const res = await fetch('/api/students/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: state.currentUser.id,
                    new_pin: newPin
                })
            });
            
            if (res.ok) {
                showToast('PIN이 성공적으로 변경되었습니다.');
                document.getElementById('pin-current').value = '';
                document.getElementById('pin-new').value = '';
                document.getElementById('pin-confirm').value = '';
                closeHandler();
            } else {
                showToast('PIN 변경에 실패했습니다.', 'error');
            }
        } catch (err) {
            showToast('서버 오류가 발생했습니다.', 'error');
        }
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('ournote_theme') || 'light';
    updateThemeUI(savedTheme);
}
