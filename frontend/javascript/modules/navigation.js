/**
 * OURNOTE NAVIGATION MODULE
 */
import { state } from './common.js';
import { loadPosts } from './posts.js';

export function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const title = document.getElementById('current-category-title');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const cat = link.getAttribute('data-cat');
            if (!cat) return;

            // 1. Update State
            state.currentCategory = cat;
            
            // 2. Update UI
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            if (title) {
                const name = link.querySelector('span:last-child').textContent;
                title.textContent = name;
            }
            
            // 3. Load Data
            loadPosts();
        });
    });
    
    loadCategories();
}

export async function loadCategories() {
    const container = document.getElementById('dynamic-categories');
    if (!container) return;

    try {
        const res = await fetch('/api/categories');
        const cats = await res.json();
        
        container.innerHTML = '';
        cats.forEach(cat => {
            const isTeacher = state.currentUser?.role === 'teacher';
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'nav-link flex justify-between group';
            link.setAttribute('data-cat', cat.id);
            link.innerHTML = `
                <div class="flex items-center gap-3 w-full">
                    <span class="material-symbols-outlined">${cat.icon || 'forum'}</span>
                    <span class="truncate pr-4">${cat.name}</span>
                </div>
                ${isTeacher ? `<button class="delete-cat-btn hidden group-hover:block text-red-400 hover:text-red-500" data-id="${cat.id}"><span class="material-symbols-outlined text-[14px]">delete</span></button>` : ''}
            `;
            
            link.addEventListener('click', (e) => {
                if (e.target.closest('.delete-cat-btn')) {
                    e.preventDefault();
                    deleteCategory(cat.id);
                    return;
                }
                
                e.preventDefault();
                state.currentCategory = cat.id;
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                const title = document.getElementById('current-category-title');
                if (title) title.textContent = cat.name;
                import('./posts.js').then(p => p.loadPosts());
            });
            
            container.appendChild(link);
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
                const title = document.getElementById('current-category-title');
                if (title) title.textContent = '전체 메뉴';
                import('./posts.js').then(p => p.loadPosts());
            }
            loadCategories();
        } else {
            import('./common.js').then(c => c.showToast('삭제에 실패했습니다.', 'error'));
        }
    } catch (err) {
        import('./common.js').then(c => c.showToast('서버 오류가 발생했습니다.', 'error'));
    }
}
