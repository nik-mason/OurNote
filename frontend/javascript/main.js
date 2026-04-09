/**
 * OURNOTE ULTRA-ENGINE (V4 Modular)
 * Final integrated entry point.
 */
import { state, showToast } from './modules/common.js';
import { initSplash, initCursor, initParticles, setupModal, initSidebar } from './modules/ui.js';
import { loadPosts } from './modules/posts.js';
import { initAuth } from './modules/auth.js';
import { initNavigation, setupRoomCreation } from './modules/navigation.js';

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
    // 1. Initialize UI Elements
    initSplash();
    initCursor();
    initParticles();
    initAuth();
    initSidebar();
    initNavigation();

    // 2. Setup Modals
    if (state.isDashboard) {
        setupModal('mobile-modal', 'nav-mobile', 'close-mobile-modal');
        setupModal('settings-modal', 'open-settings-modal', 'close-settings-modal');
        setupModal('write-modal', 'open-write-modal', 'close-write-modal');
        setupModal('write-modal', 'open-write-modal-sidebar', 'close-write-modal');
        
        // Load initial data
        loadPosts();
        
        // Display user name
        const usernameDisplay = document.getElementById('display-username');
        if (usernameDisplay && state.currentUser) {
            usernameDisplay.textContent = state.currentUser.name;
        }

        // Teacher-only features
        if (state.currentUser?.role === 'teacher') {
            document.querySelectorAll('.hidden-by-role').forEach(el => el.classList.remove('hidden-by-role'));
            document.getElementById('btn-add-room')?.classList.remove('hidden');
            setupModal('room-modal', 'btn-add-room', 'close-room-modal');
            setupRoomCreation();
        }
    }

    // 3. Global Logout Logic
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    });
    
    // Additional logic can be imported as needed...
});
