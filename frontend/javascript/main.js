/**
 * OURNOTE ULTRA-ENGINE (V4 Modular)
 * Final integrated entry point.
 */
import { state, showToast, startRealtimePolling } from './modules/common.js?v=4.3';
import { initSplash, initCursor, initParticles, setupModal } from './modules/ui.js?v=4.3';
import { loadPosts, initPostForm } from './modules/posts.js?v=4.3';
import { initAuth } from './modules/auth.js?v=4.3';
import { initNavigation } from './modules/navigation.js?v=4.3';
import { initWriteModal } from './modules/popups/write-modal.js?v=4.3';
import { initPostDetailModal } from './modules/popups/post-detail-modal.js?v=4.3';
import { initSettingsModal } from './modules/popups/settings-modal.js?v=4.3';
import { initCommandPalette } from './modules/popups/command-palette.js?v=4.3';

// GLOBAL FAILSAFE: Ensure splash disappears even if script fails
setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 500);
        document.body.classList.add('ready');
    }
}, 3000);

document.addEventListener('DOMContentLoaded', async () => {
    // 0. Load Components
    await loadComponents();

    // 1. Initialize Global UI
    initSplash();
    initCursor();
    initParticles();
    initCommandPalette();
    
    // 2. Initialize Auth
    initAuth();

    // 3. Modular Initialization
    if (state.isDashboard) {
        console.log("OurNote: Dashboard mode active.");
        initNavigation();
        
        // Modal Setup
        setupModal('hamburger-modal', 'mobile-hamburger', 'close-hamburger-modal');
        setupModal('profile-modal', 'open-profile-modal', 'close-profile-modal');
        setupModal('qr-modal', 'open-qr-modal', 'close-qr-modal');
        setupModal('write-modal', 'open-write-modal', 'close-write-modal');
        setupModal('feedback-modal', 'open-feedback-btn', 'close-feedback-modal');
        
        // Shortcuts Initialization
        initShortcuts();

        // Business Logic
        loadPosts();
        initPostDetailModal();
        initPostForm();
        initSettingsModal();
        initFeedbackLogic();
        initProfileLogic();
        
        // 🔥 실시간 업데이트 시작!
        startRealtimePolling();

        if (window.updateUserAvatar) window.updateUserAvatar();

        // Sync Profile Data
        const usernameDisplay = document.getElementById('display-username');
        const userAvatar = document.getElementById('user-avatar');
        if (state.currentUser) {
            if (usernameDisplay) usernameDisplay.textContent = state.currentUser.nickname || state.currentUser.name;
            window.updateUserAvatar = () => {
                const seed = state.currentUser.avatar_seed || state.currentUser.name;
                const customAvatar = state.currentUser.avatar_url;
                const url = customAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
                if (userAvatar) userAvatar.style.backgroundImage = `url("${url}")`;
                const modalAvatar = document.getElementById('modal-user-avatar');
                if (modalAvatar) modalAvatar.style.backgroundImage = `url("${url}")`;
            };
            window.updateUserAvatar();
        }
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/frontend/sw.js').catch(() => {});
    }
});

async function loadComponents() {
    const components = [
        { id: 'modal-container', files: [
            'settings-modal.html', 'write-modal.html', 'master-modal.html', 
            'hamburger-modal.html', 'mobile-modal.html', 'system-modals.html', 
            'confirm-modal.html', 'post-detail-modal.html', 'comment-modal.html', 
            'qr-modal.html', 'feedback-modal.html', 'profile-modal.html', 'pin-modal.html'
        ] },
        { id: 'security-container', files: ['security-layers.html', 'prank-layers.html'] }
    ];

    const loadTasks = components.flatMap(group => {
        const container = document.getElementById(group.id);
        if (!container) return [];
        return group.files.map(async (file) => {
            try {
                const res = await fetch(`/frontend/html/components/${file}`);
                const html = await res.text();
                container.insertAdjacentHTML('beforeend', html);
            } catch (err) { console.error(`Failed to load: ${file}`, err); }
        });
    });
    await Promise.all(loadTasks);
}

function initShortcuts() {
    window.addEventListener('keydown', (e) => {
        if (e.altKey) {
            switch(e.key.toLowerCase()) {
                case 'n': // Notice
                    e.preventDefault();
                    window.location.hash = '#notice';
                    showToast('공지사항 필터가 적용되었습니다.', 'info');
                    break;
                case 'h': // Homework
                    e.preventDefault();
                    window.location.hash = '#homework';
                    showToast('숙제 필터가 적용되었습니다.', 'info');
                    break;
                case 'e': // Event
                    e.preventDefault();
                    window.location.hash = '#event';
                    showToast('이벤트 필터가 적용되었습니다.', 'info');
                    break;
                case 'w': // Write
                    e.preventDefault();
                    document.getElementById('open-write-modal')?.click();
                    break;
                case 's': // Settings
                    e.preventDefault();
                    window.openSettings();
                    break;
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            document.getElementById('open-qr-modal')?.click();
        }
    });
}

function initProfileLogic() {
    const saveBtn = document.getElementById('save-profile-btn');
    const nicknameInput = document.getElementById('modal-user-nickname');
    const avatarInput = document.getElementById('avatar-upload-input');
    const triggerUpload = document.getElementById('trigger-avatar-upload');
    const logoutBtn = document.getElementById('profile-logout-btn');

    if (state.currentUser) {
        const nameEl = document.getElementById('modal-user-name');
        if (nameEl) nameEl.textContent = state.currentUser.name;
        if (nicknameInput) nicknameInput.value = state.currentUser.nickname || state.currentUser.name;
        const seedInput = document.getElementById('avatar-seed-input');
        if (seedInput) seedInput.value = state.currentUser.avatar_seed || state.currentUser.name;
    }

    triggerUpload?.addEventListener('click', () => avatarInput?.click());

    avatarInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            showToast('이미지 업로드 중...', 'info');
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.url) {
                state.currentUser.avatar_url = data.url;
                window.updateUserAvatar();
                showToast('아바타 업로드 완료! 저장 버튼을 누르세요.', 'success');
            }
        } catch (err) { showToast('업로드 실패', 'error'); }
    });

    saveBtn?.addEventListener('click', async () => {
        const nickname = nicknameInput.value.trim();
        if (!nickname) return showToast('닉네임을 입력해주세요.', 'error');
        try {
            await fetch('/api/user/nickname', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: state.currentUser.id, nickname })
            });
            if (state.currentUser.avatar_url) {
                await fetch('/api/user/avatar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: state.currentUser.id, url: state.currentUser.avatar_url })
                });
            }
            state.currentUser.nickname = nickname;
            localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
            const display = document.getElementById('display-username');
            if (display) display.textContent = nickname;
            showToast('프로필 저장 완료!', 'success');
            document.getElementById('close-profile-modal').click();
        } catch (err) { showToast('저장 중 오류 발생', 'error'); }
    });

    logoutBtn?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    });

    document.getElementById('random-avatar-btn')?.addEventListener('click', () => {
        const newSeed = Math.random().toString(36).substring(7);
        state.currentUser.avatar_seed = newSeed;
        delete state.currentUser.avatar_url; 
        window.updateUserAvatar();
    });
}

function initFeedbackLogic() {
    const submitBtn = document.getElementById('btn-submit-feedback');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const content = document.getElementById('feedback-content').value.trim();
            if (!content) return showToast('내용을 입력해주세요.', 'error');
            try {
                const uid = state.currentUser?.id || 'anon';
                const name = state.currentUser?.name || 'Anon';
                await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ author: `${name} (#${uid})`, content: content })
                });
                showToast('피드백 전송 완료!', 'success');
                document.getElementById('feedback-content').value = '';
                document.getElementById('close-feedback-modal').click();
            } catch (err) { showToast('전송 실패', 'error'); }
        });
    }
}

window.openSettings = () => {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => modal.querySelector('.modal-v4')?.classList.add('active'), 10);
    }
};
