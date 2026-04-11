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
        card.className = 'group w-full ultra-card bg-white border border-slate-100 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden';
        card.style.transitionDelay = `${index * 0.05}s`;
        
        let displayAuthor = post.author || '익명 사용자';
        if (post.is_anonymous) {
            displayAuthor = state.currentUser?.role === 'teacher' ? `익명 (${post.author})` : '익명';
        }

        const likes = Array.isArray(post.likes) ? post.likes : [];
        const isLiked = likes.includes(String(state.currentUser?.id || state.currentUser?.name || ''));
        const commentCount = post.comments ? post.comments.length : 0;

        card.innerHTML = `
            <!-- Post Header -->
            <div class="px-8 pt-8 pb-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="size-11 rounded-1.5xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary shadow-sm">
                        <span class="material-symbols-outlined text-2xl">person</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-[13px] font-black text-text-main tracking-tight">${displayAuthor}</span>
                            <span class="size-1 rounded-full bg-slate-200"></span>
                            <span class="text-[11px] font-bold text-primary uppercase tracking-wider">${post.category}</span>
                        </div>
                        <p class="text-[11px] font-medium text-text-secondary mt-0.5">${post.date}</p>
                    </div>
                </div>
                <button class="size-10 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center text-text-secondary">
                    <span class="material-symbols-outlined text-xl">more_horiz</span>
                </button>
            </div>

            <!-- Post Content -->
            <div class="px-8 pb-4 cursor-pointer" onclick="window.toggleComments(${post.id})">
                <h3 class="text-xl font-black text-text-main tracking-tighter mb-2 group-hover:text-primary transition-colors duration-300">${post.title}</h3>
                <p class="text-[15px] leading-relaxed text-text-secondary line-clamp-3 whitespace-pre-wrap">${post.content}</p>
            </div>

            <!-- Post Image -->
            ${post.image_url ? `
                <div class="px-8 pb-6 cursor-pointer" onclick="window.toggleComments(${post.id})">
                    <div class="rounded-3xl overflow-hidden border border-slate-100 shadow-sm relative group/img">
                        <img src="${post.image_url}" class="w-full h-auto max-h-[500px] object-cover transition-transform duration-700 group-hover/img:scale-105" loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300"></div>
                    </div>
                </div>
            ` : ''}

            <!-- Post Footer/Actions -->
            <div class="px-8 py-5 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                <div class="flex items-center gap-6">
                    <button onclick="event.stopPropagation(); window.toggleLikeV4(${post.id}, this)" 
                            class="flex items-center gap-2 transition-all active:scale-95 ${isLiked ? 'text-red-500' : 'text-text-secondary hover:text-red-400'}">
                        <span class="material-symbols-outlined text-2xl font-light">${isLiked ? 'favorite' : 'favorite_border'}</span>
                        <span class="text-xs font-black tracking-tighter">${likes.length}</span>
                    </button>
                    <button onclick="window.toggleComments(${post.id})" class="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                        <span class="material-symbols-outlined text-2xl font-light">chat_bubble</span>
                        <span class="text-xs font-black tracking-tighter">${commentCount}</span>
                    </button>
                </div>
                <div class="flex items-center gap-2 text-text-secondary/40">
                    <span class="material-symbols-outlined text-lg">share</span>
                </div>
            </div>

            <!-- Comment Section -->
            <div id="comments-${post.id}" class="hidden bg-white border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
                <div class="p-8 space-y-4">
                    <div class="comments-list space-y-4 max-h-[300px] overflow-y-auto pr-2 scroll-slim">
                        ${(post.comments || []).length > 0 ? (post.comments || []).map(c => `
                            <div class="flex gap-3 items-start">
                                <div class="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-primary/40 shrink-0">
                                    <span class="material-symbols-outlined text-sm">person</span>
                                </div>
                                <div class="flex-1 bg-slate-50 rounded-2xl p-4">
                                    <div class="flex justify-between items-center mb-1">
                                        <span class="text-xs font-black text-text-main">${c.author}</span>
                                        <span class="text-[10px] font-bold text-text-secondary uppercase">${c.date}</span>
                                    </div>
                                    <p class="text-xs text-text-secondary leading-normal">${c.content}</p>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="text-center py-4 text-text-secondary/50 text-xs font-bold uppercase tracking-widest">No comments yet</div>
                        `}
                    </div>
                    
                    <div class="flex gap-3 pt-4 border-t border-slate-50" onclick="event.stopPropagation()">
                        <input type="text" placeholder="Add a comment..." 
                               class="comment-input flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 text-xs font-bold text-text-main focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-text-secondary/40 placeholder:uppercase placeholder:letter-spacing-widest">
                        <button onclick="window.submitComment(${post.id})" class="px-6 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95">
                            Post
                        </button>
                    </div>
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
