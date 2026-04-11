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

    // 3. Global Logout Logic
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    });
    
    // Additional logic can be imported as needed...
});
