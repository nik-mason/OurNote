import { state, showToast } from '../common.js';

export function initSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    window.openSettings = () => {
        // Evaluate role: hide 'security' tab if NOT teacher
        const isTeacher = state.currentUser?.role === 'teacher';
        const securityTab = document.querySelector('.settings-tab[data-tab="security"]');
        if (securityTab) {
            securityTab.style.display = isTeacher ? 'flex' : 'none';
        }
        
        modal.classList.remove('hidden');
        const overlay = document.querySelector('.modal-overlay');
        const content = modal.querySelector('.modal-v4');
        
        // Show visual tab by default
        switchTab('visual');

        setTimeout(() => {
            if(overlay) overlay.style.opacity = '1';
            content.classList.add('active');
        }, 10);
    };

    const closeHandler = () => {
        const overlay = modal.querySelector('.modal-overlay');
        const content = modal.querySelector('.modal-v4');
        
        content.classList.remove('active');
        if (overlay) overlay.style.opacity = '0';
        
        setTimeout(() => modal.classList.add('hidden'), 500);
    };

    document.getElementById('close-settings-modal')?.addEventListener('click', closeHandler);
    modal.querySelector('.modal-overlay')?.addEventListener('click', closeHandler);

    // Section Switching Logic
    const switchTab = (tabName) => {
        document.querySelectorAll('.settings-pane').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.settings-tab').forEach(el => el.classList.remove('active', 'bg-white/10'));

        const targetPane = document.getElementById(`tab-${tabName}`);
        if(targetPane) targetPane.classList.remove('hidden');

        const activeBtn = document.querySelector(`.settings-tab[data-tab="${tabName}"]`);
        if(activeBtn) activeBtn.classList.add('active', 'bg-white/10');
    };

    document.querySelectorAll('.settings-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.currentTarget.getAttribute('data-tab'));
        });
    });

    // Theme Switching V4
    const updateThemeUI = (theme) => {
        const isDark = theme === 'dark';
        
        // Update DOM active classes
        document.querySelectorAll('.theme-option').forEach(el => {
            if (el.getAttribute('data-theme') === theme) {
                el.classList.add('active', 'ring-2', 'ring-primary');
            } else {
                el.classList.remove('active', 'ring-2', 'ring-primary');
            }
        });

        // Apply to body and html
        if (isDark) {
            document.body.classList.add('dark-mode', 'dark');
            document.documentElement.classList.add('dark-mode', 'dark');
        } else {
            document.body.classList.remove('dark-mode', 'dark');
            document.documentElement.classList.remove('dark-mode', 'dark');
        }
        localStorage.setItem('ournote_theme', theme);
    };

    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = e.currentTarget.getAttribute('data-theme');
            updateThemeUI(theme);
        });
    });

    // Saved theme handling
    const savedTheme = localStorage.getItem('ournote_theme') || 'white';
    updateThemeUI(savedTheme);
}
