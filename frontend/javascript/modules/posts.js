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
        card.className = 'group ultra-card p-0 overflow-hidden flex flex-col hover:border-primary/30 transition-all cursor-default';
        card.style.transitionDelay = `${index * 0.1}s`;
        
        let displayAuthor = post.author || '익명 사용자';
        if (post.is_anonymous) {
            displayAuthor = state.currentUser?.role === 'teacher' ? `익명 (${post.author})` : '익명';
        }

        const likes = Array.isArray(post.likes) ? post.likes : [];
        const isLiked = likes.includes(String(state.currentUser?.id || state.currentUser?.name || ''));
        const commentCount = post.comments ? post.comments.length : 0;

        card.innerHTML = `
            <div class="p-6">
                <div class="flex items-center gap-3 mb-5">
                    <div class="size-10 rounded-full bg-slate-100 flex items-center justify-center text-primary shrink-0 border border-white/10">
                         <span class="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                             <span class="text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10 tracking-tight">${post.category}</span>
                             <span class="text-[10px] text-text-dim opacity-50">•</span>
                             <span class="text-[11px] text-text-dim">${post.date}</span>
                        </div>
                        <p class="text-[11px] font-bold text-white/70 truncate mt-0.5">${displayAuthor}</p>
                    </div>
                </div>

                <h3 class="text-lg font-bold text-white mb-3 leading-snug group-hover:text-primary transition-colors">${post.title}</h3>
                <p class="text-sm text-text-dim leading-relaxed mb-4 whitespace-pre-wrap">${post.content}</p>
                
                ${post.image_url ? `
                    <div class="mb-4 rounded-xl overflow-hidden border border-white/5">
                        <img src="${post.image_url}" class="w-full max-h-[400px] object-cover hover:scale-105 transition-transform duration-500">
                    </div>
                ` : ''}

                <div class="flex items-center justify-between pt-4 border-t border-white/5">
                    <div class="flex items-center gap-4">
                        <button onclick="window.toggleLikeV4(${post.id}, this)" class="flex items-center gap-1.5 ${isLiked ? 'text-red-400' : 'text-text-dim'} hover:scale-110 transition-all">
                            <span class="material-symbols-outlined text-[20px]">${isLiked ? 'favorite' : 'favorite_border'}</span>
                            <span class="text-xs font-bold">${Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)}</span>
                        </button>
                        <button onclick="window.toggleComments(${post.id})" class="flex items-center gap-1.5 text-text-dim hover:text-primary transition-all">
                            <span class="material-symbols-outlined text-[20px]">chat_bubble</span>
                            <span class="text-xs font-bold">${commentCount}</span>
                        </button>
                    </div>
                </div>

                <!-- Comment Section -->
                <div id="comments-${post.id}" class="hidden mt-6 pt-6 border-t border-white/5 space-y-4">
                    <div class="comments-list space-y-3">
                        ${(post.comments || []).map(c => `
                            <div class="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                                <div class="flex justify-between items-center mb-1.5">
                                    <span class="text-xs font-bold text-primary">${c.author}</span>
                                    <span class="text-[9px] text-text-dim uppercase tracking-tighter">${c.date}</span>
                                </div>
                                <p class="text-sm text-white/90 leading-relaxed">${c.content}</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="flex gap-2 mt-6">
                        <input type="text" placeholder="공감과 따뜻한 댓글을 한 마디..." class="comment-input flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary/50 outline-none transition-all placeholder:text-white/20">
                        <button onclick="window.submitComment(${post.id})" class="size-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                            <span class="material-symbols-outlined text-[18px]">send</span>
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
