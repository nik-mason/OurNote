import { state, showToast } from '../common.js';

export function initSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    // Section Switching Logic (defined first so openSettings can use it)
    const switchTab = (tabName) => {
        modal.querySelectorAll('.settings-pane').forEach(el => el.classList.add('hidden'));
        modal.querySelectorAll('.settings-tab').forEach(el => el.classList.remove('active', 'bg-white/10'));

        const targetPane = modal.querySelector(`#tab-${tabName}`);
        if (targetPane) targetPane.classList.remove('hidden');

        const activeBtn = modal.querySelector(`.settings-tab[data-tab="${tabName}"]`);
        if (activeBtn) activeBtn.classList.add('active', 'bg-white/10');
    };

    // 전역 함수로 등록 — 버튼 onclick에서 호출 가능
    window.openSettings = () => {
        const isTeacher = state.currentUser?.role === 'teacher';
        const securityTab = modal.querySelector('.settings-tab[data-tab="security"]');
        if (securityTab) {
            securityTab.style.display = isTeacher ? 'flex' : 'none';
        }

        modal.classList.remove('hidden');
        // 이 모달 전용 overlay만 선택
        const overlay = modal.querySelector('.modal-overlay');
        const content = modal.querySelector('.modal-v4');

        switchTab('visual');

        setTimeout(() => {
            if (overlay) overlay.style.opacity = '1';
            if (content) content.classList.add('active');
        }, 10);
    };

    const closeHandler = () => {
        const overlay = modal.querySelector('.modal-overlay');
        const content = modal.querySelector('.modal-v4');

        if (content) content.classList.remove('active');
        if (overlay) overlay.style.opacity = '0';

        setTimeout(() => modal.classList.add('hidden'), 500);
    };

    document.getElementById('close-settings-modal')?.addEventListener('click', closeHandler);
    modal.querySelector('.modal-overlay')?.addEventListener('click', closeHandler);

    modal.querySelectorAll('.settings-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.currentTarget.getAttribute('data-tab'));
        });
    });

    // Theme Switching V4
    const updateThemeUI = (theme) => {
        const isDark = theme === 'dark';

        document.querySelectorAll('.theme-option').forEach(el => {
            if (el.getAttribute('data-theme') === theme) {
                el.classList.add('active', 'ring-2', 'ring-primary');
            } else {
                el.classList.remove('active', 'ring-2', 'ring-primary');
            }
        });

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
            updateThemeUI(e.currentTarget.getAttribute('data-theme'));
        });
    });

    const savedTheme = localStorage.getItem('ournote_theme') || 'white';
    updateThemeUI(savedTheme);
}

