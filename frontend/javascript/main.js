/**
 * OURNOTE ULTRA-ENGINE (V4 Modular)
 * Final integrated entry point.
 */
import { state, showToast } from './modules/common.js';
import { initSplash, initCursor, initParticles, setupModal } from './modules/ui.js';
import { loadPosts } from './modules/posts.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize UI Elements
    initSplash();
    initCursor();
    initParticles();

    // 2. Setup Modals
    if (state.isDashboard) {
        setupModal('mobile-modal', 'nav-mobile', 'close-mobile-modal');
        setupModal('settings-modal', 'open-settings-modal', 'close-settings-modal');
        setupModal('write-modal', 'open-write-modal', 'close-write-modal');
        
        // Load initial data
        loadPosts();
        
        // Display user name
        const usernameDisplay = document.getElementById('display-username');
        if (usernameDisplay && state.currentUser) {
            usernameDisplay.textContent = state.currentUser.name;
        }
    }

    // 3. Global Logout Logic
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    });
    
    // Additional logic can be imported as needed...
});
