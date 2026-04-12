/**
 * OURNOTE ULTRA-ENGINE (V4 Modular)
 * Final integrated entry point.
 */
import { state, showToast } from './modules/common.js?v=4.0';
import { initSplash, initCursor, initParticles, setupModal, initSidebar } from './modules/ui.js?v=4.0';
import { loadPosts, initPostForm } from './modules/posts.js?v=4.0';
import { initAuth } from './modules/auth.js?v=4.0';
import { initNavigation, setupRoomCreation } from './modules/navigation.js?v=4.0';
import { initWriteModal } from './modules/popups/write-modal.js?v=4.0';
import { initPostDetailModal } from './modules/popups/post-detail-modal.js?v=4.0';

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
        initWriteModal();
        initPostDetailModal();
        initPostForm(); // Keep legacy for compatibility during transition if needed
        
        // Display user name
        const usernameDisplay = document.getElementById('display-username');
        if (usernameDisplay && state.currentUser) {
            usernameDisplay.textContent = state.currentUser.name;
        }

        // Teacher-only features
        if (state.currentUser?.role === 'teacher') {
            console.log("OurNote: Teacher role detected.");
            document.querySelectorAll('.hidden-by-role').forEach(el => el.classList.remove('hidden-by-role'));
            document.getElementById('btn-add-room')?.classList.remove('hidden');
            setupModal('room-modal', 'btn-add-room', 'close-room-modal');
            setupRoomCreation();
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
        { id: 'modal-container', files: ['write-modal.html', 'master-modal.html', 'mobile-modal.html', 'system-modals.html', 'confirm-modal.html', 'post-detail-modal.html', 'comment-modal.html', 'qr-modal.html'] },
        { id: 'security-container', files: ['security-layers.html', 'prank-layers.html'] }
    ];

    for (const group of components) {
        const container = document.getElementById(group.id);
        if (!container) continue;

        for (const file of group.files) {
            try {
                const response = await fetch(`/frontend/html/components/${file}`);
                const html = await response.text();
                container.insertAdjacentHTML('beforeend', html);
            } catch (err) {
                console.error(`Failed to load component: ${file}`, err);
            }
        }
    }
}
