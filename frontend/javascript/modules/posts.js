/**
 * OURNOTE POSTS MODULE (Posts, Homework, Likes, Comments)
 */
import { state, showToast, showConfirm } from './common.js';

export async function loadPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;
    container.innerHTML = '<div class="ultra-card h-[300px] skeleton col-span-full"></div>';
    
    if (state.currentCategory === 'homework') {
        const res = await fetch('/api/homework');
        const hws = await res.json();
        window.currentHomework = hws; // Cache homework
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
                    <button onclick="event.stopPropagation(); window.openCommentModal(${post.id})" class="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors">
                        <span class="material-symbols-outlined text-[20px]">chat_bubble_outline</span>
                        <span class="text-[12px] font-black">${commentCount}</span>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

export function renderHomework(hws) {
    const container = document.getElementById('posts-container');
    if (!container) return;
    container.innerHTML = '';
    
    if (hws.length === 0) {
        container.innerHTML = '<div class="col-span-full py-20 text-center text-text-dim text-xl font-bold">등록된 숙제가 없습니다. ✨</div>';
        return;
    }

    hws.forEach((hw, index) => {
        const card = document.createElement('article');
        card.className = 'group relative w-full ultra-card bg-white border border-slate-100 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-700 overflow-hidden cursor-pointer flex flex-col p-8';
        card.style.transitionDelay = `${index * 0.03}s`;
        
        const tasks = Array.isArray(hw.tasks) ? hw.tasks : [];
        const isTeacher = state.currentUser?.role === 'teacher';
        
        let displayProgress = 0;
        let progressText = "Tasks";

        if (isTeacher) {
            // Teacher sees total classroom completion rate
            const studentIds = Object.keys(hw.progress || {});
            if (studentIds.length > 0) {
                let totalTasks = studentIds.length * tasks.length;
                let doneTasks = studentIds.reduce((acc, sid) => acc + (hw.progress[sid]?.filter(t => t).length || 0), 0);
                displayProgress = (doneTasks / (totalTasks || 1)) * 100;
                progressText = `Class: ${doneTasks}/${totalTasks}`;
            }
        } else {
            // Student sees their own progress
            const myId = state.currentUser?.id || 'all';
            const myProgress = (hw.progress && hw.progress[myId]) || (hw.progress && hw.progress['all']) || [];
            const doneCount = myProgress.filter(t => t).length;
            displayProgress = (doneCount / (tasks.length || 1)) * 100;
            progressText = `Me: ${doneCount}/${tasks.length}`;
        }

        card.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 bg-accent/10 rounded-lg text-[10px] font-black text-accent uppercase tracking-widest">HOMEWORK</span>
                    <span class="text-[10px] font-bold text-slate-400 italic">${hw.date}</span>
                </div>
                <div class="size-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                    <span class="material-symbols-outlined text-[18px]">assignment</span>
                </div>
            </div>

            <div onclick="window.openPostDetail(${hw.id}, true)" class="flex-1 flex flex-col min-h-0">
                <h3 class="text-3xl font-black text-text-main tracking-tighter mb-4 line-clamp-2 leading-none group-hover:text-primary transition-colors">${hw.title}</h3>
                
                <div class="space-y-4 mb-6">
                    <div class="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-secondary">
                        <span>Progress</span>
                        <span>${progressText}</span>
                    </div>
                    <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-primary transition-all duration-1000" style="width: ${displayProgress}%"></div>
                    </div>
                </div>

                <p class="text-sm text-slate-500 font-medium leading-relaxed line-clamp-3 mb-6">${hw.content}</p>
            </div>
            
            <div class="flex items-center justify-between pt-6 border-t border-slate-50">
                <div class="flex items-center gap-2">
                    <div class="size-8 rounded-xl bg-accent text-white flex items-center justify-center font-black text-[12px]">T</div>
                    <span class="text-[12px] font-bold text-text-main">Teacher</span>
                </div>
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-1.5 text-slate-400">
                        <span class="material-symbols-outlined text-[18px]">checklist</span>
                        <span class="text-[10px] font-black">${tasks.length} Tasks</span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
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

window.openPostDetail = (postId, isHomework = false) => {
    // Find post in current state or local array
    const post = isHomework 
        ? (window.currentHomework || []).find(h => h.id === postId)
        : (window.currentPosts || []).find(p => p.id === postId);
        
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

    // Comments or Homework Tasks
    const list = document.getElementById('detail-comments-list');
    const commentSection = modal.querySelector('.pt-10.border-t');
    const isTeacher = state.currentUser?.role === 'teacher';
    const isHomeworkType = isHomework || post.category === 'homework';

    if (isHomeworkType) {
        document.getElementById('detail-comment-count').textContent = 'Homework';
        commentSection.querySelector('h4').innerHTML = `
            <span class="material-symbols-outlined text-accent">assignment</span>
            ${isTeacher ? 'Classroom Progress' : 'My Checklist'}
        `;

        if (isTeacher) {
            // Teacher View: Progress of all assigned students
            const studentIds = Object.keys(post.progress || {});
            list.innerHTML = `
                <div class="overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-100 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                            <tr>
                                <th class="px-6 py-4">Student</th>
                                <th class="px-6 py-4 text-center">Progress</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${studentIds.length > 0 ? studentIds.map(sid => {
                                const prog = post.progress[sid] || [];
                                const done = prog.filter(t => t).length;
                                const tasks = post.tasks || [];
                                return `
                                    <tr class="hover:bg-white transition-colors">
                                        <td class="px-6 py-4 font-bold text-text-main">${sid}</td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-3">
                                                <div class="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                    <div class="h-full bg-accent" style="width: ${(done / (tasks.length || 1)) * 100}%"></div>
                                                </div>
                                                <span class="font-black text-[10px]">${done}/${tasks.length}</span>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('') : '<tr><td colspan="2" class="p-8 text-center opacity-40">No students assigned.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;
            modal.querySelector('.sticky.bottom-0').classList.add('hidden'); // Hide comment input
        } else {
            // Student View: Checkable list
            const myId = state.currentUser?.id || 'all';
            const myProgress = (post.progress && post.progress[myId]) || (post.progress && post.progress['all']) || [];
            const tasks = post.tasks || [];

            list.innerHTML = tasks.length > 0 ? `
                <div class="space-y-4">
                    ${tasks.map((t, idx) => `
                        <button onclick="window.toggleHomeworkTask(${post.id}, ${idx}, this)" 
                                class="w-full flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 border ${myProgress[idx] ? 'border-primary bg-primary/5' : 'border-slate-100'} hover:border-primary/50 transition-all text-left">
                            <div class="flex items-center gap-4">
                                <div class="size-8 rounded-xl ${myProgress[idx] ? 'bg-primary text-white' : 'bg-white text-slate-300'} border border-slate-100 flex items-center justify-center transition-all">
                                    <span class="material-symbols-outlined text-xl">${myProgress[idx] ? 'check' : 'radio_button_unchecked'}</span>
                                </div>
                                <span class="text-lg font-bold ${myProgress[idx] ? 'text-primary line-through opacity-60' : 'text-text-main'}">${t.text}</span>
                            </div>
                        </button>
                    `).join('')}
                </div>
            ` : '<p class="text-center py-10 opacity-30 font-bold">No tasks required for this homework.</p>';
            modal.querySelector('.sticky.bottom-0').classList.add('hidden');
        }
    } else {
        // Normal Comments View
        document.getElementById('detail-comment-count').textContent = post.comments?.length || 0;
        commentSection.querySelector('h4').innerHTML = `
            <span class="material-symbols-outlined text-primary">chat_bubble</span>
            댓글 리스트 (${post.comments?.length || 0})
        `;
        list.innerHTML = (post.comments || []).map(c => `
            <div class="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col gap-2">
                <div class="flex justify-between items-center">
                    <span class="font-black text-primary text-sm">${c.author}</span>
                    <span class="text-[10px] text-text-secondary font-bold">${c.date}</span>
                </div>
                <p class="text-text-main text-lg font-medium">${c.content}</p>
            </div>
        `).join('') || '<p class="text-center py-10 opacity-30 font-bold">첫 댓글을 남겨보세요! ✨</p>';
        modal.querySelector('.sticky.bottom-0').classList.remove('hidden');
    }

window.toggleHomeworkTask = async (hwId, taskIdx, btn) => {
    const isCompleted = !btn.querySelector('.material-symbols-outlined').textContent.includes('radio_button_unchecked');
    const newState = !isCompleted;
    
    // Optimistic UI
    const icon = btn.querySelector('.material-symbols-outlined');
    const label = btn.querySelector('span:last-child');
    const box = icon.parentElement;
    
    if (newState) {
        icon.textContent = 'check';
        box.classList.replace('bg-white', 'bg-primary');
        box.classList.replace('text-slate-300', 'text-white');
        label.classList.add('line-through', 'opacity-60', 'text-primary');
        btn.classList.replace('border-slate-100', 'border-primary');
        btn.classList.add('bg-primary/5');
    } else {
        icon.textContent = 'radio_button_unchecked';
        box.classList.replace('bg-primary', 'bg-white');
        box.classList.replace('text-white', 'text-slate-300');
        label.classList.remove('line-through', 'opacity-60', 'text-primary');
        btn.classList.replace('border-primary', 'border-slate-100');
        btn.classList.remove('bg-primary/5');
    }

    try {
        const res = await fetch(`/api/homework/${hwId}/task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: state.currentUser?.id || 'all',
                task_index: taskIdx,
                completed: newState
            })
        });
        
        if (res.ok) {
            // Refresh cache and lists
            const hwRes = await fetch('/api/homework');
            window.currentHomework = await hwRes.json();
            // Don't call loadPosts full refresh to avoid modal flickering, 
            // but the background list will update next time it's rendered.
        }
    } catch (err) {
        showToast('상태 변경에 실패했습니다.', 'error');
    }
};

    // Show modal directly without setupModal overhead
    modal.classList.remove('hidden');
    const overlay = document.getElementById('close-post-detail-overlay');
    const closeBtn = document.getElementById('close-post-detail-modal');
    
    // Smooth fade in
    setTimeout(() => {
        if(overlay) overlay.style.opacity = '1';
        modal.querySelector('.modal-v4')?.classList.add('active');
    }, 10);

    const closeHandler = () => {
        modal.querySelector('.modal-v4')?.classList.remove('active');
        if(overlay) overlay.style.opacity = '0';
        setTimeout(() => modal.classList.add('hidden'), 400);
        // Remove listeners
        overlay?.removeEventListener('click', closeHandler);
        closeBtn?.removeEventListener('click', closeHandler);
    };
    overlay?.addEventListener('click', closeHandler);
    closeBtn?.addEventListener('click', closeHandler);
    
    // Setup comment submission
    const submitBtn = document.getElementById('detail-submit-comment');
    const input = document.getElementById('detail-comment-input');
    
    submitBtn.onclick = async () => {
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
                await loadPosts();
                window.openPostDetail(postId);
            }
        } catch (err) {}
    };
};

window.openCommentModal = (postId) => {
    const post = (window.currentPosts || []).find(p => p.id === postId);
    if (!post) return;

    const modal = document.getElementById('comment-modal');
    if (!modal) return;

    document.getElementById('comment-target-title').textContent = post.title;
    document.getElementById('comment-text').value = '';
    
    modal.classList.remove('hidden');
    modal.querySelector('.modal-v4')?.classList.add('active');

    // Setup submit
    const btn = document.getElementById('submit-comment-btn');
    btn.onclick = async () => {
        const txt = document.getElementById('comment-text').value.trim();
        if (!txt) return;
        
        await window.submitComment(postId, txt);
        modal.classList.add('hidden');
    };

    // Close logic
    const closeBtn = document.getElementById('close-comment-modal');
    const overlay = document.getElementById('close-comment-modal-overlay');
    const closeHandler = () => {
        modal.classList.add('hidden');
        closeBtn.removeEventListener('click', closeHandler);
        overlay.removeEventListener('click', closeHandler);
    };
    closeBtn.addEventListener('click', closeHandler);
    overlay.addEventListener('click', closeHandler);
};

window.toggleComments = (postId) => {
    // Legacy support or fallback
    window.openPostDetail(postId);
};

window.submitComment = async (postId, modalContent = null) => {
    const container = document.getElementById(`comments-${postId}`);
    const input = container?.querySelector('.comment-input');
    const content = modalContent || input?.value.trim();
    
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

    // NEW: Chip-based selection system (Replacing broken dropdowns)
    document.addEventListener('click', (e) => {
        // Category Chips
        const catChip = e.target.closest('.post-cat-chip');
        if (catChip) {
            document.querySelectorAll('.post-cat-chip').forEach(c => {
                c.classList.remove('active', 'bg-primary', 'text-white');
                c.classList.add('bg-slate-100', 'text-slate-500');
            });
            catChip.classList.add('active', 'bg-primary', 'text-white');
            catChip.classList.remove('bg-slate-100', 'text-slate-500');
            
            const val = catChip.getAttribute('data-value');
            document.getElementById('post-category').value = val;
            
            // Homework toggle
            const hwTarget = document.getElementById('homework-target-container');
            const hwTasks = document.getElementById('homework-tasks-container');
            if (val === 'homework') {
                hwTarget?.classList.remove('hidden');
                hwTasks?.classList.remove('hidden');
                initStudentSelection();
            } else {
                hwTarget?.classList.add('hidden');
                hwTasks?.classList.add('hidden');
            }
            return;
        }

        // Student Chips (Multi-selection for teacher assigning homework)
        const stuChip = e.target.closest('.stu-chip');
        if (stuChip) {
            const val = stuChip.getAttribute('data-value');
            const isAll = val === 'all';
            const category = document.getElementById('post-category').value;
            
            // If homework, allow multi-select
            if (category === 'homework') {
                if (isAll) {
                    document.querySelectorAll('.stu-chip').forEach(c => c.classList.remove('active', 'bg-primary', 'text-white'));
                    document.querySelectorAll('.stu-chip').forEach(c => c.classList.add('bg-slate-100', 'text-slate-500'));
                    stuChip.classList.add('active', 'bg-primary', 'text-white');
                    stuChip.classList.remove('bg-slate-100', 'text-slate-500');
                } else {
                    // Unselect "All" if it was selected
                    const allChip = document.querySelector('.stu-chip[data-value="all"]');
                    allChip?.classList.remove('active', 'bg-primary', 'text-white');
                    allChip?.classList.add('bg-slate-100', 'text-slate-500');
                    
                    stuChip.classList.toggle('active');
                    stuChip.classList.toggle('bg-primary');
                    stuChip.classList.toggle('text-white');
                    stuChip.classList.toggle('bg-slate-100');
                    stuChip.classList.toggle('text-slate-500');
                }
            } else {
                // Single select for other categories if ever used
                document.querySelectorAll('.stu-chip').forEach(c => {
                    c.classList.remove('active', 'bg-primary', 'text-white');
                    c.classList.add('bg-slate-100', 'text-slate-500');
                });
                stuChip.classList.add('active', 'bg-primary', 'text-white');
                stuChip.classList.remove('bg-slate-100', 'text-slate-500');
                document.getElementById('homework-target-student-val').value = val;
            }
            return;
        }

        // Keep old delegated dropdown close for other parts if any
        document.querySelectorAll('.custom-options').forEach(el => el.classList.add('hidden'));
    });

    // Initialize Student Selection Chips (For Homework)
    const initStudentSelection = async () => {
        const container = document.getElementById('student-chips');
        if (!container) return;

        try {
            const res = await fetch('/api/students');
            const students = await res.json();
            
            // Clear existing but keep "All"
            container.innerHTML = '<button type="button" class="stu-chip active px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs" data-value="all">🌍 전체 공개</button>';
            
            students.forEach(s => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'stu-chip px-4 py-2 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs transition-all';
                btn.setAttribute('data-value', s.id);
                btn.textContent = s.name;
                container.appendChild(btn);
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

    // Homework Task Management
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('tasks-input-list');
    
    addTaskBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        const taskRow = document.createElement('div');
        taskRow.className = 'flex gap-3 items-center group animate-slide-up';
        taskRow.innerHTML = `
            <div class="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-4 flex items-center gap-3">
                <span class="material-symbols-outlined text-primary/40">radio_button_unchecked</span>
                <input type="text" class="hw-task-input flex-1 bg-transparent border-none text-sm font-bold text-text-main focus:ring-0 placeholder:text-slate-300" placeholder="해야 할 일을 입력하세요">
            </div>
            <button type="button" class="remove-task-btn size-10 rounded-xl bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <span class="material-symbols-outlined text-lg">delete</span>
            </button>
        `;
        taskList.appendChild(taskRow);
        
        taskRow.querySelector('.remove-task-btn').onclick = () => taskRow.remove();
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

            // Collect Tasks
            const taskInputs = document.querySelectorAll('.hw-task-input');
            const tasks = Array.from(taskInputs).map(inp => ({
                text: inp.value.trim(),
                completed: false
            })).filter(t => t.text !== '');

            // Collect Assigned Students
            let assigned_students = [];
            if (category === 'homework') {
                const activeChips = document.querySelectorAll('.stu-chip.active');
                assigned_students = Array.from(activeChips).map(c => c.getAttribute('data-value'));
                if (assigned_students.length === 0) assigned_students = ['all'];
            }

            const endpoint = category === 'homework' ? '/api/homework' : '/api/posts';
            const payload = {
                title, content, category, 
                author: state.currentUser?.name || 'Anonymous',
                is_anonymous: isAnonymous,
                image_url: imageUrl,
                student_id: state.currentUser?.id || 'anon',
                assigned_students: assigned_students, // Multi-student support
                tasks: tasks
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
