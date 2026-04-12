/**
 * OURNOTE NAVIGATION MODULE
 */
import { state, showConfirm } from './common.js';
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
        
        const chipContainer = document.getElementById('category-chips');
        if (chipContainer) {
            chipContainer.innerHTML = '';
            // 1. Static Core Categories
            const core = [
                { id: 'dashboard', name: '✨ 대시보드' },
                { id: 'notice', name: '📢 공지사항', teacherOnly: true },
                { id: 'event', name: '🎉 이벤트', teacherOnly: true },
                { id: 'homework', name: '📝 숙제', teacherOnly: true }
            ];

            core.concat(cats).forEach(cat => {
                const isTeacher = state.currentUser?.role === 'teacher';
                if (cat.teacherOnly && !isTeacher) return;

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `post-cat-chip px-4 py-2 rounded-2xl font-bold transition-all ${cat.id === 'dashboard' ? 'active bg-primary text-white' : 'bg-slate-100 text-slate-500'}`;
                btn.setAttribute('data-value', cat.id);
                btn.innerHTML = `<span>${cat.name}</span>`;
                chipContainer.appendChild(btn);
            });
        }

        // Header Navigation (Dynamic)
        container.innerHTML = '';
        cats.forEach(cat => {
            const isTeacher = state.currentUser?.role === 'teacher';
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'nav-link px-3 py-2 text-text-secondary text-sm font-medium hover:text-primary transition-colors flex items-center justify-between group';
            link.setAttribute('data-cat', cat.id);
            link.innerHTML = `
                <span class="truncate">${cat.name}</span>
                ${isTeacher ? `<button class="delete-cat-btn opacity-40 hover:opacity-100 ml-2 text-slate-400 hover:text-red-500 transition-all p-1 rounded-md hover:bg-red-50" data-id="${cat.id}"><span class="material-symbols-outlined text-[16px]">close</span></button>` : ''}
            `;
            
            container.appendChild(link);

            // Add listener for delete button
            const deleteBtn = link.querySelector('.delete-cat-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Don't trigger navigation
                    deleteCategory(cat.id);
                });
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
    const ok = await showConfirm('정말 이 게시판을 삭제하시겠습니까? 게시글이 모두 사라집니다.', '게시판 삭제');
    if (!ok) return;
    
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
