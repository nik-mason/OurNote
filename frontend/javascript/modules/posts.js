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
        // Square Grid Card Style
        card.className = 'group relative w-full aspect-square ultra-card bg-white border border-slate-100 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-700 overflow-hidden cursor-pointer';
        card.style.transitionDelay = `${index * 0.03}s`;
        
        let displayAuthor = post.author || '익명 사용자';
        if (post.is_anonymous) {
            displayAuthor = state.currentUser?.role === 'teacher' ? `익명 (${post.author})` : '익명';
        }

        const likes = Array.isArray(post.likes) ? post.likes : [];
        const isLiked = likes.includes(String(state.currentUser?.id || state.currentUser?.name || ''));
        const commentCount = post.comments ? post.comments.length : 0;

        // Content for Square Card
        card.innerHTML = `
            <!-- Background Image (Square) -->
            <div class="absolute inset-0 z-0">
                ${post.image_url ? `
                    <div class="size-full overflow-hidden">
                        <img src="${post.image_url}" class="size-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy">
                    </div>
                ` : `
                    <div class="size-full bg-gradient-to-br from-primary/10 to-slate-100 flex items-center justify-center">
                        <span class="material-symbols-outlined text-6xl text-primary/10">description</span>
                    </div>
                `}
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
            </div>

            <!-- Content Overlay -->
            <div class="absolute inset-0 z-10 p-5 flex flex-col justify-end" onclick="window.toggleComments(${post.id})">
                <div class="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
                    <div class="flex items-center gap-2 mb-1.5">
                        <span class="px-1.5 py-0.5 bg-primary/20 backdrop-blur-md rounded-md text-[8px] font-black text-white uppercase tracking-widest border border-white/10">${post.category}</span>
                        <span class="text-[8px] font-bold text-white/40">${post.date}</span>
                    </div>
                    <h3 class="text-base font-bold text-white tracking-tighter mb-1 line-clamp-2">${post.title}</h3>
                    <p class="text-[10px] text-white/60 line-clamp-2 font-medium leading-tight mb-3 group-hover:text-white/80 transition-colors">${post.content}</p>
                    
                    <div class="flex items-center justify-between pt-3 border-t border-white/10">
                        <div class="flex items-center gap-2">
                            <div class="size-6 rounded-lg bg-white/10 flex items-center justify-center text-white/40 ring-1 ring-white/10 uppercase font-black text-[7px] tracking-widest">
                                ${displayAuthor.substring(0, 1)}
                            </div>
                            <span class="text-[9px] font-bold text-white/80">${displayAuthor}</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <button onclick="event.stopPropagation(); window.toggleLikeV4(${post.id}, this)" class="flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-white/40 hover:text-red-400'}">
                                <span class="material-symbols-outlined text-[14px]">${isLiked ? 'favorite' : 'favorite_border'}</span>
                                <span class="text-[9px] font-black">${likes.length}</span>
                            </button>
                            <div class="flex items-center gap-1 text-white/40">
                                <span class="material-symbols-outlined text-[14px]">chat_bubble</span>
                                <span class="text-[9px] font-black">${commentCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Comment Modal (Partial in Square) -->
            <div id="comments-${post.id}" class="hidden absolute inset-0 z-20 bg-white/95 backdrop-blur-3xl animate-in fade-in duration-300">
                <div class="h-full flex flex-col p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-xs font-black text-text-main uppercase tracking-widest">Comments</h4>
                        <button onclick="window.toggleComments(${post.id})" class="size-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <span class="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                    <div class="flex-1 overflow-y-auto space-y-3 pr-2 scroll-slim text-xs">
                        ${(post.comments || []).length > 0 ? (post.comments || []).map(c => `
                            <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="font-bold text-primary">${c.author}</span>
                                    <span class="text-[8px] text-text-secondary">${c.date}</span>
                                </div>
                                <p class="text-text-secondary leading-tight line-clamp-2">${c.content}</p>
                            </div>
                        `).join('') : `
                            <p class="text-center text-text-secondary/40 py-10 font-black uppercase text-[10px] tracking-widest">Quiet place...</p>
                        `}
                    </div>
                    <div class="pt-4 flex gap-2" onclick="event.stopPropagation()">
                        <input type="text" placeholder="..." class="comment-input flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary/40">
                        <button onclick="window.submitComment(${post.id})" class="size-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                            <span class="material-symbols-outlined text-sm">send</span>
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

    const setupDropdown = (triggerId, optionsId, inputId, textId, onSelect = null) => {
        const trigger = document.getElementById(triggerId);
        const options = document.getElementById(optionsId);
        const input = document.getElementById(inputId);
        const textDisplay = document.getElementById(textId);

        if (!trigger || !options) return;

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other open dropdowns first
            document.querySelectorAll('.custom-options').forEach(el => {
                if(el.id !== optionsId) el.classList.add('hidden');
            });
            options.classList.toggle('hidden');
        });

        options.addEventListener('click', (e) => {
            const opt = e.target.closest('.custom-option');
            if (!opt) return;
            
            const val = opt.getAttribute('data-value');
            const txt = opt.textContent;
            
            if(input) input.value = val;
            if(textDisplay) textDisplay.textContent = txt;
            options.classList.add('hidden');
            
            if (onSelect) onSelect(val, txt);
        });
    };

    // Initialize Category Dropdown
    setupDropdown('custom-category-trigger', 'custom-category-options', 'post-category', 'selected-category-text', (val) => {
        const hwTarget = document.getElementById('homework-target-container');
        const hwTasks = document.getElementById('homework-tasks-container');
        if (val === 'homework') {
            hwTarget?.classList.remove('hidden');
            hwTasks?.classList.remove('hidden');
            initStudentSelection(); // Load students when homework is selected
        } else {
            hwTarget?.classList.add('hidden');
            hwTasks?.classList.add('hidden');
        }
    });

    // Initialize Student Selection Dropdown (For Homework)
    const initStudentSelection = async () => {
        const list = document.getElementById('student-options-list');
        if (!list) return;

        try {
            const res = await fetch('/api/students');
            const students = await res.json();
            
            // Keep "All" option
            list.innerHTML = '<div class="custom-option p-4 hover:bg-primary/10 transition-colors cursor-pointer border-b border-slate-100" data-value="all">🌍 전체 공개</div>';
            
            students.forEach(s => {
                const opt = document.createElement('div');
                opt.className = 'custom-option p-4 hover:bg-primary/10 transition-colors cursor-pointer border-b border-slate-100';
                opt.setAttribute('data-value', s.id);
                opt.innerHTML = `<span class="font-bold">${s.name}</span> <span class="text-[10px] opacity-40 ml-2">#${s.id}</span>`;
                list.appendChild(opt);
            });
        } catch (err) {
            console.error('Failed to load students', err);
        }
    };

    setupDropdown('student-select-trigger', 'custom-student-options', 'homework-target-student-val', 'selected-student-name');

    // Global Click-to-Close for all dropdowns
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-options').forEach(el => el.classList.add('hidden'));
    });

    // Image Preview logic...
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
