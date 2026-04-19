/**
 * OURNOTE ULTRA-ENGINE (V4 Modular)
 * Final integrated entry point.
 */
import { state, showToast } from './modules/common.js?v=4.3';
import { initSplash, initCursor, initParticles, setupModal } from './modules/ui.js?v=4.3';
import { loadPosts, initPostForm } from './modules/posts.js?v=4.3';
import { initAuth } from './modules/auth.js?v=4.3';
import { initNavigation, setupRoomCreation } from './modules/navigation.js?v=4.3';
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
        
        setupModal('main-nav', 'mobile-hamburger', 'close-mobile-modal');
        setupModal('qr-modal', 'open-qr-modal', 'close-qr-modal');
        setupModal('write-modal', 'open-write-modal', 'close-write-modal');
        setupModal('write-modal', 'open-write-modal-sidebar', 'close-write-modal');
        setupModal('master-modal', 'xxx', 'close-master-modal'); // Placeholder for master trigger if any
        
        // Load initial data
        loadPosts();
        initPostDetailModal();
        initPostForm();
        initSettingsModal();
        initProfileModal();
        
        setupModal('profile-modal', 'open-profile-modal', 'close-profile-modal');
        setupModal('main-nav', 'mobile-hamburger', 'close-nav-modal');
        setupModal('qr-modal', 'open-qr-modal', 'close-qr-modal');
        setupModal('feedback-modal', 'open-feedback-btn', 'close-feedback-modal');
        initFeedbackLogic();

        if (window.updateUserAvatar) window.updateUserAvatar();

        // Display user name and set dynamic avatar
        const usernameDisplay = document.getElementById('display-username');
        const userAvatar = document.getElementById('user-avatar');
        if (state.currentUser) {
            if (usernameDisplay) usernameDisplay.textContent = state.currentUser.name;
            window.updateUserAvatar = () => {
                const seed = state.currentUser.avatar_seed || state.currentUser.name;
                const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
                if (userAvatar) userAvatar.style.backgroundImage = `url("${url}")`;
                const modalAvatar = document.getElementById('modal-user-avatar');
                if (modalAvatar) modalAvatar.style.backgroundImage = `url("${url}")`;
            };
            window.updateUserAvatar();
        }

        // Load Rules Component
        try {
            fetch('/api/rules').then(r => r.json()).then(data => {
                if (data && data.rules) {
                    const rulesSec = document.getElementById('rules-section');
                    const rulesContent = document.getElementById('rules-content');
                    if (rulesSec && rulesContent) {
                        rulesSec.classList.remove('hidden');
                        rulesContent.textContent = data.rules;
                    }
                }
            });
        } catch(e) {}

        // Load Daily Alert
        try {
            fetch('/api/alert').then(r => r.json()).then(data => {
                if (data && data.message) {
                    const today = new Date().toLocaleDateString();
                    const dismissedDate = localStorage.getItem('dismissed_alert_date');
                    
                    if (dismissedDate !== today) {
                        const alertModal = document.getElementById('daily-alert-modal');
                        const alertText = document.getElementById('daily-alert-text');
                        if (alertModal && alertText) {
                            alertText.textContent = data.message;
                            alertModal.classList.remove('hidden');
                        }
                    }
                }
            });
        } catch(e) {}

        // Teacher-only features
        if (state.currentUser?.role === 'teacher') {
            console.log("OurNote: Teacher role detected.");
            document.querySelectorAll('.hidden-by-role').forEach(el => el.classList.remove('hidden-by-role'));
            document.getElementById('btn-add-room')?.classList.remove('hidden');
            setupModal('room-modal', 'btn-add-room', 'close-room-modal');
            // setupRoomCreation is already called inside initNavigation()
        }
    }



    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/frontend/sw.js').then(reg => {
                console.log('OurNote: SW Registered');
            }).catch(err => {
                console.error('OurNote: SW Registration Failed', err);
            });
        });
    }

    // PWA Install Logic
    let deferredPrompt;
    const installBtns = document.querySelectorAll('#pwa-install-btn, #pwa-install-btn-mobile');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtns.forEach(btn => btn.classList.remove('hidden'));
    });

    const triggerInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
        installBtns.forEach(btn => btn.classList.add('hidden'));
    };

    installBtns.forEach(btn => btn.addEventListener('click', triggerInstall));
});

async function loadComponents() {
    const components = [
        { id: 'modal-container', files: ['settings-modal.html', 'write-modal.html', 'master-modal.html', 'mobile-modal.html', 'system-modals.html', 'confirm-modal.html', 'post-detail-modal.html', 'comment-modal.html', 'qr-modal.html', 'feedback-modal.html', 'profile-modal.html'] },
        { id: 'security-container', files: ['security-layers.html', 'prank-layers.html'] }
    ];

    const loadTasks = components.flatMap(group => {
        const container = document.getElementById(group.id);
        if (!container) return [];

        return group.files.map(async (file) => {
            try {
                const response = await fetch(`/frontend/html/components/${file}`);
                const html = await response.text();
                // 순서를 유지하기 위해 각 그룹 내에서는 insertAdjacentHTML을 쓰되, 
                // 전체 로딩은 병렬로 진행함.
                container.insertAdjacentHTML('beforeend', html);
            } catch (err) {
                console.error(`Failed to load component: ${file}`, err);
            }
        });
    });

    await Promise.all(loadTasks);
}

// ---------------------------------------------------------
// Feedback System Logic
// ---------------------------------------------------------
function initFeedbackLogic() {
    // 1. Submit Feedback
    const submitBtn = document.getElementById('btn-submit-feedback');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const content = document.getElementById('feedback-content').value.trim();
            if (!content) {
                showToast('피드백 내용을 입력해주세요.', 'error');
                return;
            }

            try {
                // Determine user info
                const uid = state.currentUser ? state.currentUser.id : 'unknown';
                const name = state.currentUser ? state.currentUser.name : 'Unknown';
                const role = state.currentUser ? state.currentUser.role : 'student';

                const res = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        author: `${name} (#${uid})`,
                        role: role,
                        content: content
                    })
                });

                if (res.ok) {
                    showToast('피드백이 성공적으로 전송되었습니다!', 'success');
                    document.getElementById('feedback-content').value = '';
                    document.getElementById('close-feedback-modal').click();
                } else {
                    showToast('전송 실패. 다시 시도해주세요.', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('전송 중 오류가 발생했습니다.', 'error');
            }
        });
    } else {
        // If the modal isn't loaded yet, try again shortly
        setTimeout(initFeedbackLogic, 500);
        return;
    }

    // 2. Secret Corner Unlock (for Teacher/Admin)
    let cornerClicks = { tl: false, tr: false, br: false };
    
    // Define a function to show feedback list
    const showFeedbackAdmin = async () => {
        const listContainer = document.getElementById('feedback-list-view');
        const submitContainer = document.getElementById('feedback-submit-view');
        const title = document.querySelector('#feedback-modal h2');
        
        try {
            const res = await fetch('/api/feedback');
            const feedbacks = await res.json();
            
            // Transform UI
            if(title) title.textContent = "피드백 관리 (관리자 모드)";
            if(submitContainer) submitContainer.classList.add('hidden');
            if(listContainer) {
                listContainer.classList.remove('hidden');
                listContainer.classList.add('flex');
                
                if (feedbacks.length === 0) {
                    listContainer.innerHTML = '<p class="text-center text-text-secondary py-8">아직 등록된 피드백이 없습니다.</p>';
                } else {
                    listContainer.innerHTML = feedbacks.reverse().map(fb => `
                        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 px-5">
                            <div class="flex justify-between items-start mb-2">
                                <span class="font-bold text-primary">${fb.author}</span>
                                <span class="text-xs text-text-secondary">${fb.date}</span>
                            </div>
                            <p class="text-text-main text-sm leading-relaxed whitespace-pre-wrap">${fb.content}</p>
                        </div>
                    `).join('');
                }
            }
            
            // Open modal
            document.getElementById('feedback-modal').classList.remove('hidden');
            
        } catch (err) {
            console.error(err);
            showToast('피드백 데이터를 불러올 수 없습니다.', 'error');
        }
    };

    // Attach to DOM dynamically
    document.addEventListener('click', (e) => {
        // Check if QR corner was clicked
        if (['qr-corner-tl', 'qr-corner-tr', 'qr-corner-br'].includes(e.target.id)) {
            // Only active for Teachers
            if (!state.currentUser || state.currentUser.role !== 'teacher') {
                showToast('관리자 권한이 필요합니다.', 'error');
                return;
            }
            
            if (e.target.id === 'qr-corner-tl') { cornerClicks.tl = true; }
            if (e.target.id === 'qr-corner-tr') { cornerClicks.tr = true; }
            if (e.target.id === 'qr-corner-br') { cornerClicks.br = true; }

            // Check if all 3 clicked
            if (cornerClicks.tl && cornerClicks.tr && cornerClicks.br) {
                // Reset state
                cornerClicks = { tl: false, tr: false, br: false };
                
                // Trigger feedback admin mode
                showToast('피드백 관리자 모드를 활성화합니다.', 'success');
                
                // Close QR modal if open
                const closeBtn = document.getElementById('close-qr-modal');
                if(closeBtn) closeBtn.click();
                
                const closeMobileBtn = document.getElementById('close-mobile-modal');
                if(closeMobileBtn) closeMobileBtn.click();
                
                showFeedbackAdmin();
            }
        }
    });

    // Handle resetting the view when modal is closed
    const modalObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'feedback-modal' && mutation.target.classList.contains('hidden')) {
                // Reset view when closed
                const listContainer = document.getElementById('feedback-list-view');
                const submitContainer = document.getElementById('feedback-submit-view');
                const title = document.querySelector('#feedback-modal h2');
                
                if(title) title.textContent = "피드백";
                if(submitContainer) submitContainer.classList.remove('hidden');
                if(listContainer) {
                    listContainer.classList.add('hidden');
                    listContainer.classList.remove('flex');
                }
            }
        });
    });
    
    // We start observing after a slight delay to ensure it's in the DOM
    setTimeout(() => {
        const feedbackModal = document.getElementById('feedback-modal');
        if (feedbackModal) {
            modalObserver.observe(feedbackModal, { attributes: true, attributeFilter: ['class'] });
        }
    }, 2000);
    // Daily Alert Setup (Admin)
    const btnSaveAlert = document.getElementById('btn-save-alert');
    const btnClearAlert = document.getElementById('btn-clear-alert');
    if (btnSaveAlert && btnClearAlert) {
        btnSaveAlert.addEventListener('click', async () => {
            const input = document.getElementById('admin-alert-input').value.trim();
            if(!input) return showToast('공지 내용을 입력하세요.', 'error');
            try {
                await fetch('/api/alert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: input })
                });
                showToast('오늘의 공지가 설정되었습니다.', 'success');
                document.getElementById('admin-alert-input').value = '';
            } catch(e) { showToast('오류가 발생했습니다.', 'error'); }
        });
        
        btnClearAlert.addEventListener('click', async () => {
            try {
                await fetch('/api/alert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: "" })
                });
                showToast('공지가 삭제되었습니다.', 'success');
                document.getElementById('admin-alert-input').value = '';
            } catch(e) { showToast('오류가 발생했습니다.', 'error'); }
        });
    }

    // Daily Alert User Actions
    document.addEventListener('click', (e) => {
        if (e.target.id === 'btn-close-alert') {
            document.getElementById('daily-alert-modal').classList.add('hidden');
        } else if (e.target.id === 'btn-dismiss-alert-today') {
            localStorage.setItem('dismissed_alert_date', new Date().toLocaleDateString());
            document.getElementById('daily-alert-modal').classList.add('hidden');
            showToast('오늘 하루 동안 알림이 표시되지 않습니다.');
        }
    });

    // ─── EXTRA PREMIUM FEATURES ───

    // 1. Scroll Progress Bar
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        const bar = document.getElementById('ultra-bar');
        if (bar) bar.style.width = scrolled + "%";
    });

    // 2. Magnetic Buttons Interaction
    const initMagneticButtons = () => {
        const magnets = document.querySelectorAll('.liquid-btn, .nav-link, .post-cat-chip, #mobile-hamburger, .size-12.rounded-full');
        magnets.forEach(m => {
            m.addEventListener('mousemove', (e) => {
                const rect = m.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                m.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
                if (m.classList.contains('nav-link')) m.style.zIndex = "10";
            });
            m.addEventListener('mouseleave', () => {
                m.style.transform = '';
                m.style.zIndex = "";
            });
        });
    };
    initMagneticButtons();
}

function initProfileModal() {
    const randomBtn = document.getElementById('random-avatar-btn');
    const saveBtn = document.getElementById('save-avatar-btn');
    const seedInput = document.getElementById('avatar-seed-input');
    const logoutBtn = document.getElementById('profile-logout-btn');
    
    if (state.currentUser) {
        const modalName = document.getElementById('modal-user-name');
        const modalRole = document.getElementById('modal-user-role');
        if (modalName) modalName.textContent = state.currentUser.name;
        if (modalRole) modalRole.textContent = state.currentUser.role;
        if (seedInput) seedInput.value = state.currentUser.avatar_seed || state.currentUser.name;
    }

    randomBtn?.addEventListener('click', () => {
        const randomSeed = Math.random().toString(36).substring(7);
        if (seedInput) seedInput.value = randomSeed;
        state.currentUser.avatar_seed = randomSeed;
        if (window.updateUserAvatar) window.updateUserAvatar();
    });

    saveBtn?.addEventListener('click', () => {
        const newSeed = seedInput?.value.trim();
        if (newSeed) {
            state.currentUser.avatar_seed = newSeed;
            localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
            if (window.updateUserAvatar) window.updateUserAvatar();
            showToast('아바타 설정이 저장되었습니다!');
        }
    });

    logoutBtn?.addEventListener('click', () => {
        if (window.logout) window.logout();
    });
}

window.updateUserAvatar = () => {
    const user = state.currentUser;
    if (!user) return;
    const seed = user.avatar_seed || user.name || 'default';
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    
    const avatarElements = [
        document.getElementById('user-avatar'),
        document.getElementById('modal-user-avatar')
    ];
    
    avatarElements.forEach(el => {
        if (el) {
            el.style.backgroundImage = `url("${avatarUrl}")`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
        }
    });
};

window.openSettings = () => {
    const trigger = document.getElementById('header-settings-btn');
    if (trigger) trigger.click();
    else {
        // Fallback: manually open settings-modal if trigger not found
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                const content = modal.querySelector('.settings-fullscreen');
                if (content) {
                    content.classList.remove('translate-y-full', 'opacity-0');
                }
            }, 10);
        }
    }
};
