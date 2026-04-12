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
        window.currentPosts = posts; // Cache for detail view
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
        // Clean White Card Style
        card.className = 'group relative w-full ultra-card bg-white border border-slate-100 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-700 overflow-hidden cursor-pointer flex flex-col p-8';
        card.style.transitionDelay = `${index * 0.03}s`;
        
        let displayAuthor = post.author || '익명 사용자';
        if (post.is_anonymous) {
            displayAuthor = state.currentUser?.role === 'teacher' ? `익명 (${post.author})` : '익명';
        }

        const likes = Array.isArray(post.likes) ? post.likes : [];
        const isLiked = likes.includes(String(state.currentUser?.id || state.currentUser?.name || ''));
        const commentCount = post.comments ? post.comments.length : 0;
        const isTeacher = state.currentUser?.role === 'teacher';

        card.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 bg-primary/10 rounded-lg text-[10px] font-black text-primary uppercase tracking-widest">${post.category}</span>
                    <span class="text-[10px] font-bold text-slate-400 italic">${post.date}</span>
                </div>
                ${isTeacher ? `
                    <button onclick="event.stopPropagation(); window.deletePost(${post.id})" class="size-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100">
                        <span class="material-symbols-outlined text-[18px]">delete_forever</span>
                    </button>
                ` : ''}
            </div>

            <div onclick="window.openPostDetail(${post.id})" class="flex-1 flex flex-col min-h-0">
                <h3 class="text-4xl font-black text-text-main tracking-tighter mb-4 line-clamp-2 leading-none group-hover:text-primary transition-colors break-words">${post.title}</h3>
                
                <div class="relative mb-6 flex-1 flex flex-col">
                    <p id="content-short-${post.id}" class="text-base text-slate-500 font-medium leading-relaxed whitespace-pre-wrap break-words ${post.image_url ? 'line-clamp-[6]' : 'line-clamp-[15]'}">${post.content}</p>
                    <p id="content-full-${post.id}" class="hidden text-base text-slate-500 font-medium leading-relaxed whitespace-pre-wrap break-words">${post.content}</p>
                    
                    ${(post.image_url ? post.content.split('\n').length > 6 || post.content.length > 150 : post.content.split('\n').length > 15 || post.content.length > 400) ? `
                        <button onclick="event.stopPropagation(); window.toggleCardExpand(${post.id})" id="expand-btn-${post.id}" class="mt-2 text-primary font-black text-sm hover:underline flex items-center gap-1 w-fit">
                            더보기 <span class="material-symbols-outlined text-sm">expand_more</span>
                        </button>
                    ` : ''}
                </div>
                
                ${post.image_url ? `
                    <div id="image-container-${post.id}" class="w-full aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 mt-auto mb-6 flex items-center justify-center p-4">
                        <img src="${post.image_url}" class="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-105" loading="lazy">
                    </div>
                ` : ''}
            </div>
            
            <div class="flex items-center justify-between pt-6 border-t border-slate-50">
                <div class="flex items-center gap-2">
                    <div class="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary uppercase font-black text-[12px]">
                        ${displayAuthor.substring(0, 1)}
                    </div>
                    <span class="text-[12px] font-bold text-text-main">${displayAuthor}</span>
                </div>
                <div class="flex items-center gap-4">
                    <button onclick="event.stopPropagation(); window.toggleLikeV4(${post.id}, this)" class="flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'} transition-all">
                        <span class="material-symbols-outlined text-[20px]">${isLiked ? 'favorite' : 'favorite_border'}</span>
                        <span class="text-[12px] font-black">${likes.length}</span>
                    </button>
                    <div class="flex items-center gap-1.5 text-slate-400">
                        <span class="material-symbols-outlined text-[20px]">chat_bubble_outline</span>
                        <span class="text-[12px] font-black">${commentCount}</span>
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

window.toggleCardExpand = (postId) => {
    const short = document.getElementById(`content-short-${postId}`);
    const full = document.getElementById(`content-full-${postId}`);
    const btn = document.getElementById(`expand-btn-${postId}`);
    const img = document.getElementById(`image-container-${postId}`);
    
    if (short && full) {
        if (full.classList.contains('hidden')) {
            short.classList.add('hidden');
            full.classList.remove('hidden');
            if(img) img.classList.add('mt-6'); // Add margin if image exists
            if(btn) btn.innerHTML = '접기 <span class="material-symbols-outlined text-sm">expand_less</span>';
        } else {
            short.classList.remove('hidden');
            full.classList.add('hidden');
            if(img) img.classList.remove('mt-6');
            if(btn) btn.innerHTML = '더보기 <span class="material-symbols-outlined text-sm">expand_more</span>';
        }
    }
};

window.deletePost = async (postId) => {
    const ok = await showConfirm('정말 이 게시물을 삭제하시겠습니까?', '게시물 삭제');
    if (!ok) return;

    try {
        const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('이야기가 삭제되었습니다.');
            loadPosts();
        } else {
            showToast('삭제에 실패했습니다.', 'error');
        }
    } catch (err) {
        showToast('서버 오류가 발생했습니다.', 'error');
    }
};

window.openPostDetail = (postId) => {
    // Find post in current state or local array
    // Since we don't have a single post fetch yet, we find it in the current list
    const post = (window.currentPosts || []).find(p => p.id === postId);
    if (!post) return;

    const modal = document.getElementById('post-detail-modal');
    if (!modal) return;

    // Fill data
    document.getElementById('detail-title').textContent = post.title;
    document.getElementById('detail-meta').textContent = `${post.category.toUpperCase()} | ${post.date}`;
    document.getElementById('detail-content').textContent = post.content;
    
    let displayAuthor = post.author || '익명 사용자';
    if (post.is_anonymous) {
        displayAuthor = state.currentUser?.role === 'teacher' ? `익명 (${post.author})` : '익명';
    }
    document.getElementById('detail-author-name').textContent = displayAuthor;
    document.getElementById('detail-author-avatar').textContent = displayAuthor.substring(0, 1);

    const imgContainer = document.getElementById('detail-image-container');
    const img = document.getElementById('detail-image');
    if (post.image_url) {
        img.src = post.image_url;
        imgContainer.classList.remove('hidden');
    } else {
        imgContainer.classList.add('hidden');
    }

    // Comments
    const list = document.getElementById('detail-comments-list');
    document.getElementById('detail-comment-count').textContent = post.comments?.length || 0;
    list.innerHTML = (post.comments || []).map(c => `
        <div class="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col gap-2">
            <div class="flex justify-between items-center">
                <span class="font-black text-primary text-sm">${c.author}</span>
                <span class="text-[10px] text-text-secondary font-bold">${c.date}</span>
            </div>
            <p class="text-text-main text-lg font-medium">${c.content}</p>
        </div>
    `).join('') || '<p class="text-center py-10 opacity-30 font-bold">첫 댓글을 남겨보세요! ✨</p>';

    // Show modal
    modal.classList.remove('hidden');
    import('./ui.js').then(m => m.setupModal('post-detail-modal', null, 'close-post-detail-modal'));
    
    // Setup comment submission in detail view
    const submitBtn = document.getElementById('detail-submit-comment');
    const input = document.getElementById('detail-comment-input');
    
    // Clear old listener
    const newSubmitBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    
    newSubmitBtn.onclick = async () => {
        const txt = input.value.trim();
        if (!txt) return;
        
        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    author: state.currentUser.name,
                    content: txt
                })
            });
            if (res.ok) {
                input.value = '';
                // Refresh detail view (simplest way is to reload posts and re-open or just fetch single)
                await loadPosts();
                window.openPostDetail(postId);
            }
        } catch (err) {}
    };
};

window.toggleComments = (postId) => {
    // Legacy support or fallback
    window.openPostDetail(postId);
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

    // NEW: Fully Delegated Dropdown System (Resilient to dynamic content)
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[id$="-trigger"]');
        if (trigger) {
            e.preventDefault();
            e.stopPropagation();
            
            const optionsId = trigger.id.replace('trigger', 'options');
            const options = document.getElementById(optionsId);
            
            if (options) {
                // Close others
                document.querySelectorAll('.custom-options').forEach(el => {
                    if (el !== options) el.classList.add('hidden');
                });
                options.classList.toggle('hidden');
            }
            return;
        }

        const option = e.target.closest('.custom-option');
        if (option) {
            const container = option.closest('.custom-options');
            const triggerId = container.id.replace('options', 'trigger');
            const inputId = container.id.replace('custom-', 'post-').replace('-options', '');
            const textId = container.id.replace('custom-', 'selected-').replace('-options', '-text');

            // Find related elements
            const input = document.getElementById(inputId) || document.getElementById('post-category'); // Fallback
            const textDisplay = document.getElementById(textId);
            
            if (input) input.value = option.getAttribute('data-value');
            if (textDisplay) textDisplay.textContent = option.textContent;
            
            container.classList.add('hidden');

            // Special logic for Category
            if (container.id === 'custom-category-options') {
                const val = option.getAttribute('data-value');
                const hwTarget = document.getElementById('homework-target-container');
                const hwTasks = document.getElementById('homework-tasks-container');
                if (val === 'homework') {
                    hwTarget?.classList.remove('hidden');
                    hwTasks?.classList.remove('hidden');
                    // Explicitly call student loader
                    const studentsList = document.getElementById('student-options-list');
                    if (studentsList && studentsList.children.length <= 1) {
                         initStudentSelection();
                    }
                } else {
                    hwTarget?.classList.add('hidden');
                    hwTasks?.classList.add('hidden');
                }
            }
        } else {
            // Global close when clicking anything else
            document.querySelectorAll('.custom-options').forEach(el => el.classList.add('hidden'));
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
        const category = document.getElementById('post-category')?.value || 'dashboard';
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
