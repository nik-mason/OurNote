/**
 * OURNOTE ULTRA-ENGINE (V4 Modular)
 * Final integrated entry point.
 */
import { state, showToast } from './modules/common.js?v=4.0';
import { initSplash, initCursor, initParticles, setupModal, initSidebar } from './modules/ui.js?v=4.0';
import { loadPosts, initPostForm } from './modules/posts.js?v=4.0';
import { initAuth } from './modules/auth.js?v=4.0';
import { initNavigation, setupRoomCreation } from './modules/navigation.js?v=4.0';

// GLOBAL FAILSAFE: Ensure splash disappears even if script fails
setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 500);
        document.body.classList.add('ready');
    }
}, 3000);

document.addEventListener('DOMContentLoaded', () => {
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
        
        setupModal('mobile-modal', 'nav-mobile', 'close-mobile-modal');
        setupModal('settings-modal', 'open-settings-modal', 'close-settings-modal');
        setupModal('write-modal', 'open-write-modal', 'close-write-modal');
        setupModal('write-modal', 'open-write-modal-sidebar', 'close-write-modal');
        
        // Load initial data
        loadPosts();
        initPostForm();
        
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

    // Global Logout Logic
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    });

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
