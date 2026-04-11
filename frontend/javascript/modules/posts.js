/**
 * OURNOTE POSTS MODULE (Posts, Homework, Likes, Comments)
 */
import { state, showToast } from './common.js';

export async function loadPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;
    container.innerHTML = '<div class="ultra-card h-[300px] skeleton col-span-full"></div>';
    
    if (state.currentCategory === 'homework') {
        const res = await fetch('/api/homework');
        const hws = await res.json();
        renderHomework(hws);
    } else {
        const res = await fetch('/api/posts');
        const posts = await res.json();
        renderPosts(posts);
    }
}

export function renderPosts(posts) {
    const container = document.getElementById('posts-container');
    if (!container) return;
    container.innerHTML = '';
    
    const filtered = state.currentCategory === 'all' ? posts : posts.filter(p => p.category === state.currentCategory);
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="col-span-full py-20 text-center text-text-dim text-xl font-bold">작성된 이야기가 없습니다.</div>';
        return;
    }

    filtered.forEach((post, index) => {
        const card = document.createElement('article');
        card.className = 'group bg-surface-light dark:bg-surface-dark p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-slate-200/50 cursor-pointer';
        card.style.transitionDelay = `${index * 0.1}s`;
        
        let displayAuthor = post.author || '익명 사용자';
        if (post.is_anonymous) {
            displayAuthor = state.currentUser?.role === 'teacher' ? `익명 (${post.author})` : '익명';
        }

        const likes = Array.isArray(post.likes) ? post.likes : [];
        const isLiked = likes.includes(String(state.currentUser?.id || state.currentUser?.name || ''));
        const commentCount = post.comments ? post.comments.length : 0;

        card.innerHTML = `
            <div class="flex items-start gap-4" onclick="window.toggleComments(${post.id})">
                <div class="shrink-0">
                    <div class="size-12 rounded-full bg-slate-100 flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined">person</span>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-bold text-primary">${post.category}</span>
                        <span class="text-[10px] text-text-secondary">•</span>
                        <span class="text-xs text-text-secondary">${post.date}</span>
                    </div>
                    <h3 class="text-lg font-bold text-text-main dark:text-text-main-dark mb-1 truncate group-hover:text-primary transition-colors">${post.title}</h3>
                    <p class="text-sm text-text-secondary dark:text-text-secondary-dark line-clamp-2 mb-3">${post.content}</p>
                    
                    ${post.image_url ? `
                        <div class="mb-3 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                            <img src="${post.image_url}" class="w-full max-h-48 object-cover">
                        </div>
                    ` : ''}

                    <div class="flex items-center justify-between text-text-secondary text-xs">
                        <span class="font-medium">${displayAuthor}</span>
                        <div class="flex items-center gap-4">
                            <button onclick="event.stopPropagation(); window.toggleLikeV4(${post.id}, this)" class="flex items-center gap-1 ${isLiked ? 'text-red-500' : ''}">
                                <span class="material-symbols-outlined text-[16px]">${isLiked ? 'favorite' : 'favorite_border'}</span>
                                <span>${Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)}</span>
                            </button>
                            <span class="flex items-center gap-1">
                                <span class="material-symbols-outlined text-[16px]">chat_bubble</span>
                                <span>${commentCount}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Comment Section (Expanded below the article) -->
            <div id="comments-${post.id}" class="hidden mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div class="comments-list space-y-2">
                    ${(post.comments || []).map(c => `
                        <div class="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-xs font-bold text-primary">${c.author}</span>
                                <span class="text-[10px] text-text-secondary">${c.date}</span>
                            </div>
                            <p class="text-sm text-text-main dark:text-text-main-dark">${c.content}</p>
                        </div>
                    `).join('')}
                </div>
                <div class="flex gap-2 mt-4" onclick="event.stopPropagation()">
                    <input type="text" placeholder="댓글을 입력하세요..." class="comment-input flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all">
                    <button onclick="window.submitComment(${post.id})" class="size-9 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary-dark transition-all">
                        <span class="material-symbols-outlined text-[18px]">send</span>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

export function renderHomework(hws) {
    // Homework rendering logic...
}

window.toggleComments = (postId) => {
    const el = document.getElementById(`comments-${postId}`);
    if (el) el.classList.toggle('hidden');
};

window.submitComment = async (postId) => {
    const container = document.getElementById(`comments-${postId}`);
    const input = container?.querySelector('.comment-input');
    const content = input?.value.trim();
    
    if (!content) return;
    
    try {
        const res = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                author: state.currentUser?.name || 'Anonymous',
                content: content
            })
        });
        
        if (res.ok) {
            input.value = '';
            loadPosts(); // Refresh to show new comment
            // Re-open comments after refresh
            setTimeout(() => {
                const newEl = document.getElementById(`comments-${postId}`);
                if (newEl) newEl.classList.remove('hidden');
            }, 500);
        }
    } catch (err) {
        showToast('댓글 등록에 실패했습니다.', 'error');
    }
};

window.toggleLikeV4 = async (postId, btn) => {
    try {
        const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            const span = btn.querySelector('span:last-child');
            if (span) span.textContent = data.likes;
            btn.classList.add('text-red-400');
            btn.classList.remove('text-text-dim');
            btn.querySelector('.material-symbols-outlined').textContent = 'favorite';
        }
    } catch (err) {
        showToast('좋아요 처리에 실패했습니다.', 'error');
    }
};

export function initPostForm() {
    const submitBtn = document.getElementById('submit-post');
    if (!submitBtn) return;

    // Toggle Category specific fields
    const catTrigger = document.getElementById('custom-category-trigger');
    const catOptions = document.getElementById('custom-category-options');
    const catInput = document.getElementById('post-category');
    
    if (catTrigger && catOptions) {
        catTrigger.addEventListener('click', () => catOptions.classList.toggle('hidden'));
        catOptions.querySelectorAll('.custom-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const val = opt.getAttribute('data-value');
                const text = opt.textContent;
                document.getElementById('selected-category-text').textContent = text;
                catInput.value = val;
                catOptions.classList.add('hidden');
                
                // Show/Hide homework target container
                const hwTarget = document.getElementById('homework-target-container');
                const hwTasks = document.getElementById('homework-tasks-container');
                if (val === 'homework') {
                    hwTarget?.classList.remove('hidden');
                    hwTasks?.classList.remove('hidden');
                } else {
                    hwTarget?.classList.add('hidden');
                    hwTasks?.classList.add('hidden');
                }
            });
        });
    }

    // Modal click-outside
    document.addEventListener('click', (e) => {
        if (!catTrigger?.contains(e.target)) catOptions?.classList.add('hidden');
    });

    // Image Preview
    const imageInput = document.getElementById('post-image');
    imageInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById('image-preview');
        if (file && preview) {
            const reader = new FileReader();
            reader.onload = (re) => {
                preview.src = re.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    submitBtn.addEventListener('click', async () => {
        const title = document.getElementById('post-title')?.value.trim();
        const content = document.getElementById('post-content')?.value.trim();
        const category = catInput.value;
        const isAnonymous = document.getElementById('post-anonymous')?.checked;
        const imageFile = imageInput?.files[0];

        if (!title || !content) {
            showToast('제목과 내용을 모두 입력해주세요.', 'error');
            return;
        }

        // Security Guard: Prevent students from posting in restricted categories
        if (state.currentUser?.role === 'student' && ['notice', 'event', 'homework'].includes(category)) {
            showToast('학생은 이 카테고리에 게시할 수 없습니다.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span>';

        try {
            let imageUrl = '';
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                const uploadData = await uploadRes.json();
                if (uploadData.success) imageUrl = uploadData.url;
            }

            const endpoint = category === 'homework' ? '/api/homework' : '/api/posts';
            const payload = {
                title, content, category, 
                author: state.currentUser.name,
                is_anonymous: isAnonymous,
                image_url: imageUrl,
                student_id: state.currentUser.id
            };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast('이야기가 등록되었습니다! ✨');
                // Reset form
                document.getElementById('post-title').value = '';
                document.getElementById('post-content').value = '';
                document.getElementById('image-preview').classList.add('hidden');
                imageInput.value = '';
                // Close modal
                const modal = document.getElementById('write-modal');
                if(modal) modal.classList.add('hidden');
                loadPosts();
            } else {
                showToast('게시물 등록에 실패했습니다.', 'error');
            }
        } catch (err) {
            showToast('서버 오류가 발생했습니다.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '게시물 등록하기';
        }
    });
}
