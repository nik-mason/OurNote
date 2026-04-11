/**
 * OURNOTE NAVIGATION MODULE
 */
import { state } from './common.js';
import { loadPosts } from './posts.js';

export function initNavigation() {
    // Select all nav links including dynamic ones that might be added later
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');
        if (!link) return;
        
        const cat = link.getAttribute('data-cat');
        if (!cat) return;

        e.preventDefault();

        // 1. Update State
        state.currentCategory = cat;
        
        // 2. Update UI
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.remove('active', 'text-primary', 'bg-primary/5', 'font-bold');
            l.classList.add('text-text-secondary', 'font-medium');
        });
        
        link.classList.add('active', 'text-primary', 'bg-primary/5', 'font-bold');
        link.classList.remove('text-text-secondary', 'font-medium');
        
        // 3. Load Data
        loadPosts();
    });
    
    // Mobile Hamburger
    const hamburger = document.getElementById('mobile-hamburger');
    const mainNav = document.getElementById('main-nav');
    const hamIcon = hamburger?.querySelector('.material-symbols-outlined');

    if (hamburger && mainNav) {
        hamburger.addEventListener('click', () => {
            const isForced = mainNav.classList.contains('forced-open');
            if (!isForced) {
                mainNav.classList.add('forced-open');
                mainNav.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            } else {
                mainNav.classList.remove('forced-open');
                mainNav.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        });

        document.getElementById('close-mobile-menu')?.addEventListener('click', () => {
            mainNav.classList.remove('forced-open');
            mainNav.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
    }

    // Unified Logout Logic
    const logoutAction = () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    };

    document.getElementById('logout-btn')?.addEventListener('click', logoutAction);
    document.getElementById('logout-btn-mobile')?.addEventListener('click', logoutAction);

    loadCategories();
    setupRoomCreation();
}

export async function loadCategories() {
    const container = document.getElementById('dynamic-nav-container');
    if (!container) return;

    try {
        const res = await fetch('/api/categories');
        const cats = await res.json();
        
        container.innerHTML = '';
        const writeModalOptions = document.getElementById('custom-category-options');
        const dynamicWriteOptions = writeModalOptions ? Array.from(writeModalOptions.querySelectorAll('.dynamic-option')) : [];
        dynamicWriteOptions.forEach(opt => opt.remove());

        cats.forEach(cat => {
            const isTeacher = state.currentUser?.role === 'teacher';
            
            // Header Navigation (Dynamic)
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'nav-link px-3 py-2 text-text-secondary text-sm font-medium hover:text-primary transition-colors flex items-center justify-between group';
            link.setAttribute('data-cat', cat.id);
            link.innerHTML = `
                <span class="truncate">${cat.name}</span>
                ${isTeacher ? `<button class="delete-cat-btn hidden group-hover:block ml-2 text-red-500" data-id="${cat.id}"><span class="material-symbols-outlined text-[14px]">close</span></button>` : ''}
            `;
            
            container.appendChild(link);

            // Write Modal Categories
            if (writeModalOptions) {
                const opt = document.createElement('div');
                opt.className = 'custom-option dynamic-option p-4 hover:bg-primary transition-colors cursor-pointer border-b border-white/5';
                opt.setAttribute('data-value', cat.id);
                opt.innerHTML = `<span>💬 ${cat.name}</span>`;
                opt.addEventListener('click', () => {
                    document.getElementById('selected-category-text').textContent = `💬 ${cat.name}`;
                    document.getElementById('post-category').value = cat.id;
                    writeModalOptions.classList.add('hidden');
                });
                writeModalOptions.appendChild(opt);
            }
        });
    } catch (err) {
        console.error('Failed to load categories', err);
    }
}

export function setupRoomCreation() {
    const submitBtn = document.getElementById('submit-room');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async () => {
        const input = document.getElementById('room-name');
        const name = input?.value.trim();
        
        if (!name) {
            import('./common.js').then(c => c.showToast('게시판 이름을 입력해주세요.', 'error'));
            return;
        }

        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, icon: 'forum' })
            });

            if (res.ok) {
                import('./common.js').then(c => c.showToast('새 게시판이 생성되었습니다.'));
                const modal = document.getElementById('room-modal');
                if(modal) modal.classList.add('hidden');
                
                // Clear input
                if(input) input.value = '';
                
                // Refresh list
                loadCategories();
            } else {
                import('./common.js').then(c => c.showToast('생성에 실패했습니다.', 'error'));
            }
        } catch (err) {
            import('./common.js').then(c => c.showToast('서버 오류가 발생했습니다.', 'error'));
        }
    });
}

async function deleteCategory(id) {
    if (!confirm('정말 이 게시판을 삭제하시겠습니까?')) return;
    
    try {
        const res = await fetch(`/api/categories/${id}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            import('./common.js').then(c => c.showToast('게시판이 삭제되었습니다.'));
            if (state.currentCategory === id) {
                state.currentCategory = 'all';
                loadPosts();
            }
            loadCategories();
        } else {
            import('./common.js').then(c => c.showToast('삭제에 실패했습니다.', 'error'));
        }
    } catch (err) {
        import('./common.js').then(c => c.showToast('서버 오류가 발생했습니다.', 'error'));
    }
}
