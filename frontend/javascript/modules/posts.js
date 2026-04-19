/**
 * OURNOTE POSTS MODULE (Posts, Homework, Likes, Comments)
 */
import { state, showToast, showConfirm } from './common.js';

/* ╔═══════════════════════════════════════════════════════╗
   ║          ANIMATION UTILITIES (Global Effects)         ║
   ╚═══════════════════════════════════════════════════════╝ */

// ── 1. 좋아요 ❤️ 떠오르는 하트 애니메이션 ──
function spawnFloatingHearts(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
        const heart = document.createElement('div');
        heart.textContent = '❤️';
        heart.style.cssText = `
            position: fixed;
            left: ${x + (Math.random() - 0.5) * 40}px;
            top: ${y}px;
            font-size: ${14 + Math.random() * 18}px;
            pointer-events: none;
            z-index: 99999;
            user-select: none;
            animation: floatHeart ${0.8 + Math.random() * 0.8}s ease-out forwards;
            animation-delay: ${Math.random() * 0.3}s;
        `;
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 2000);
    }
}

// ── 2. 숙제 완료 폭죽 🎉 애니메이션 ──
function launchConfetti(originEl) {
    const rect = originEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ['#2b8cee','#f59e0b','#10b981','#ef4444','#8b5cf6','#f97316','#ec4899'];
    const emojis = ['🌟','✨','🎊','💫','⚡','🎉','🔥'];

    // Confetti particles
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        const angle = (Math.PI * 2 * i) / 30 + (Math.random() - 0.5) * 0.4;
        const speed = 80 + Math.random() * 120;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed - 60;
        p.style.cssText = `
            position: fixed;
            left: ${cx}px;
            top: ${cy}px;
            width: ${4 + Math.random() * 8}px;
            height: ${4 + Math.random() * 8}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            pointer-events: none;
            z-index: 99999;
            transform: translate(-50%, -50%);
            animation: confettiBurst 0.9s ease-out forwards;
            --dx: ${dx}px;
            --dy: ${dy}px;
        `;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1200);
    }

    // Emoji burst
    for (let i = 0; i < 6; i++) {
        const e = document.createElement('div');
        e.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        e.style.cssText = `
            position: fixed;
            left: ${cx + (Math.random() - 0.5) * 80}px;
            top: ${cy}px;
            font-size: ${20 + Math.random() * 20}px;
            pointer-events: none;
            z-index: 99999;
            animation: emojiBurst ${0.7 + Math.random() * 0.5}s ease-out forwards;
            animation-delay: ${Math.random() * 0.2}s;
            --dy: ${-(60 + Math.random() * 80)}px;
        `;
        document.body.appendChild(e);
        setTimeout(() => e.remove(), 1500);
    }

    // Screen flash
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed; inset: 0; z-index: 99998;
        background: radial-gradient(ellipse at ${cx}px ${cy}px, rgba(43,140,238,0.25) 0%, transparent 60%);
        pointer-events: none;
        animation: flashFade 0.5s ease-out forwards;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);
}

// ── 3. 종이 비행기 게시 애니메이션 ──
function playPaperPlaneAnimation(onComplete) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(255,255,255,0.15);
        backdrop-filter: blur(2px);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s;
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.style.opacity = '1', 10);

    const plane = document.createElement('div');
    plane.innerHTML = `
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M72 8L8 38l28 8 4 26 10-16 22 2-6-50z" fill="#2b8cee" opacity="0.95"/>
      <path d="M36 46L72 8" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
      <path d="M36 46l4 26 10-16" fill="#1a6bbd" opacity="0.8"/>
    </svg>`;
    plane.style.cssText = `
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) scale(1) rotate(0deg);
        z-index: 100000;
        pointer-events: none;
        filter: drop-shadow(0 8px 24px rgba(43,140,238,0.5));
        animation: planeFlying 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    `;
    document.body.appendChild(plane);

    // Trail particles
    const trailInterval = setInterval(() => {
        const t = document.createElement('div');
        t.style.cssText = `
            position: fixed;
            left: 50%; top: 50%;
            width: 6px; height: 6px;
            background: #2b8cee;
            border-radius: 50%;
            pointer-events: none;
            z-index: 99998;
            animation: trailFade 0.5s ease-out forwards;
        `;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 600);
    }, 60);

    setTimeout(() => {
        clearInterval(trailInterval);
        overlay.style.opacity = '0';
        setTimeout(() => {
            plane.remove();
            overlay.remove();
            if (onComplete) onComplete();
        }, 300);
    }, 1200);
}

// ── CSS Keyframes 주입 (한 번만) ──
(function injectAnimationCSS() {
    if (document.getElementById('ournote-anim-css')) return;
    const style = document.createElement('style');
    style.id = 'ournote-anim-css';
    style.textContent = `
        @keyframes floatHeart {
            0%   { transform: translateY(0) scale(1); opacity: 1; }
            60%  { transform: translateY(-80px) scale(1.2) rotate(10deg); opacity: 0.8; }
            100% { transform: translateY(-140px) scale(0.5) rotate(-10deg); opacity: 0; }
        }
        @keyframes confettiBurst {
            0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            80%  { opacity: 0.8; }
            100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0); opacity: 0; }
        }
        @keyframes emojiBurst {
            0%   { transform: translateY(0) scale(0.5); opacity: 1; }
            60%  { transform: translateY(var(--dy)) scale(1.3); opacity: 1; }
            100% { transform: translateY(calc(var(--dy) * 1.5)) scale(0.8); opacity: 0; }
        }
        @keyframes flashFade {
            0%   { opacity: 1; }
            100% { opacity: 0; }
        }
        @keyframes planeFlying {
            0%   { transform: translate(-50%, -50%) scale(0.5) rotate(-30deg); opacity: 0; }
            15%  { transform: translate(-50%, -50%) scale(1.1) rotate(-15deg); opacity: 1; }
            50%  { transform: translate(20vw, -30vh) scale(1) rotate(10deg); opacity: 1; }
            85%  { transform: translate(60vw, -60vh) scale(0.6) rotate(25deg); opacity: 0.6; }
            100% { transform: translate(100vw, -80vh) scale(0.2) rotate(40deg); opacity: 0; }
        }
        @keyframes trailFade {
            0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
            100% { transform: translate(-50%, -100px) scale(0); opacity: 0; }
        }
        @keyframes hwCheckPulse {
            0%   { box-shadow: 0 0 0 0 rgba(43,140,238,0.7); }
            50%  { box-shadow: 0 0 0 20px rgba(43,140,238,0); }
            100% { box-shadow: 0 0 0 0 rgba(43,140,238,0); }
        }
        }
    `;
    document.head.appendChild(style);
})();

window.currentReplyParentId = null;

window.prepareReply = (postId, commentId, author) => {
    window.currentReplyParentId = commentId;
    const input = document.getElementById('detail-comment-input');
    if (input) {
        input.value = `@${author} `;
        input.focus();
    }
};

window.toggleCommentLike = async (postId, commentId, btn) => {
    try {
        const res = await fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: state.currentUser?.id || state.currentUser?.name || 'anon' })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            btn.querySelector('span:last-child').textContent = data.likes;
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon.textContent === 'favorite_border') {
                icon.textContent = 'favorite';
                btn.classList.add('text-red-500');
                btn.classList.remove('text-slate-400', 'text-text-dim');
            } else {
                icon.textContent = 'favorite_border';
                btn.classList.remove('text-red-500');
                btn.classList.add('text-slate-400');
            }
            btn.style.transform = 'scale(1.2)';
            setTimeout(() => btn.style.transform = '', 200);
        }
    } catch (err) {}
};

export async function loadPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;

    // Show Skeletons immediately
    container.innerHTML = Array(6).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-shimmer"></div>
            <div class="flex items-center gap-2 mb-4">
                <div class="skeleton-box w-16 h-4"></div>
                <div class="skeleton-box w-20 h-4"></div>
            </div>
            <div class="skeleton-box w-full h-12 mb-4"></div>
            <div class="skeleton-box w-3/4 h-8 mb-6"></div>
            <div class="mt-auto pt-6 border-t border-slate-100/10 flex justify-between">
                <div class="skeleton-box w-24 h-6"></div>
                <div class="skeleton-box w-12 h-6"></div>
            </div>
        </div>
    `).join('');

    // 학생 이름 캐시 (선생님 숙제 진행도 뷰용)
    if (!window.cachedStudents || window.cachedStudents.length === 0) {
        try {
            const sRes = await fetch('/api/students');
            window.cachedStudents = await sRes.json();
        } catch (e) { window.cachedStudents = []; }
    }

    try {
        // Render Roadmap first
        renderRoadmap();

        const category = window.location.hash.replace('#', '') || state.currentCategory || 'dashboard';
        
        if (category === 'homework') {
            const res = await fetch('/api/homework');
            if (!res.ok) throw new Error('서버 응답 오류 (HW)');
            let hws = await res.json();
            
            if (!Array.isArray(hws)) {
                console.warn('API/HOMEWORK returned non-array:', hws);
                hws = [];
            }
            
            window.currentHomework = hws;
            renderHomework(hws.slice().reverse());
        } else {
            const res = await fetch('/api/posts');
            if (!res.ok) throw new Error('서버 응답 오류 (POSTS)');
            let posts = await res.json();
            
            // Safety Check: Ensure posts is an array
            if (!Array.isArray(posts)) {
                console.warn('API/POSTS returned non-array:', posts);
                posts = [];
            }
            
            // Apply category filtering if hash exists
            if (category !== 'dashboard') {
                posts = posts.filter(p => p && p.category === category);
            }
            
            window.currentPosts = posts;
            renderPosts(posts.slice().reverse());
        }
    } catch (err) {
        console.error('Data Load Error:', err);
        container.innerHTML = `
            <div class="col-span-full py-20 text-center space-y-4">
                <div class="size-20 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-500 mb-4">
                    <span class="material-symbols-outlined text-4xl">database_off</span>
                </div>
                <p class="text-text-main text-xl font-black">데이터를 불러오는 데 실패했습니다.</p>
                <p class="text-text-secondary text-sm font-bold">네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요.<br>(${err.message})</p>
                <button onclick="location.reload()" class="px-6 py-2 rounded-xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/20">새로고침</button>
            </div>
        `;
    }
}

// Listen for shortcut-driven hash changes
window.addEventListener('hashchange', () => {
    loadPosts();
});

export function renderRoadmap() {
    const parent = document.getElementById('posts-container')?.parentElement;
    if (!parent || state.currentCategory !== 'dashboard') {
        document.getElementById('roadmap-ui')?.remove();
        return;
    }

    if (document.getElementById('roadmap-ui')) return;

    const roadmap = document.createElement('div');
    roadmap.id = 'roadmap-ui';
    roadmap.className = 'stagger-item transition-all duration-500';
    
    // Calculate stats (Real stats would need synced data, using cached for now)
    const postCount = window.currentPosts?.length || 0;
    const hwCount = window.currentHomework?.length || 0;
    const completedHw = window.currentHomework?.filter(h => {
        const myId = state.currentUser?.id || 'all';
        return h.progress?.[myId]?.every(t => t);
    }).length || 0;

    roadmap.innerHTML = `
        <div class="roadmap-container mb-12">
            <div class="stat-item">
                <span class="text-[10px] font-black uppercase tracking-widest text-text-dim">Our Story</span>
                <div class="stat-value">${postCount}</div>
                <p class="text-[10px] font-bold text-slate-400">함께 만든 이야기</p>
            </div>
            <div class="stat-item border-l border-slate-100 pl-8">
                <span class="text-[10px] font-black uppercase tracking-widest text-text-dim">My Growth</span>
                <div class="stat-value">${completedHw}<span class="text-lg opacity-30">/${hwCount}</span></div>
                <p class="text-[10px] font-bold text-slate-400">완료한 숙제 지수</p>
            </div>
            <div class="stat-item border-l border-slate-100 pl-8 flex justify-center">
                <div class="size-20 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
                    <svg class="absolute inset-0 rotate-[-90deg]" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--primary)" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="${283 - (283 * (completedHw / (hwCount || 1)))}" stroke-linecap="round"></circle>
                    </svg>
                    <span class="text-xs font-black text-primary">${Math.round((completedHw / (hwCount || 1)) * 100)}%</span>
                </div>
            </div>
        </div>
    `;
    const container = document.getElementById('posts-container');
    container.parentNode.insertBefore(roadmap, container);
}

export function renderPosts(posts) {
    const container = document.getElementById('posts-container');
    if (!container) return;
    container.innerHTML = '';
    
    const filtered = state.currentCategory === 'all' ? posts : posts.filter(p => p.category === state.currentCategory);
    
    if (filtered.length === 0) {
        const illustrations = {
            'dashboard': { emoji: '✨', msg: '아직 등록된 이야기가 없어요. 첫 번째 주인공이 되어보세요!' },
            'notice': { emoji: '📢', msg: '중요한 소식이 들어오면 여기에 나타날 거예요.' },
            'event': { emoji: '🎉', msg: '즐거운 소식을 준비 중입니다!' },
            'all': { emoji: '📖', msg: '모든 이야기가 여기에 모입니다.' }
        };
        const config = illustrations[state.currentCategory] || { emoji: '🔍', msg: '검색된 결과가 없어요.' };
        
        container.innerHTML = `
            <div class="col-span-full empty-state-v4">
                <div class="empty-illustration">${config.emoji}</div>
                <h3 class="text-2xl font-black text-text-main mb-2">${config.msg}</h3>
                <p class="text-sm text-text-dim font-bold">새로운 소식을 기다리는 중...</p>
            </div>
        `;
        return;
    }

    filtered.forEach((post, index) => {
        const card = document.createElement('article');
        // Clean White Card Style + Staggered Animation
        card.className = 'group relative w-full ultra-card stagger-item bg-white border border-slate-100 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-700 overflow-hidden cursor-pointer flex flex-col p-8';
        card.style.animationDelay = `${index * 0.08}s`;
        
        let displayAuthor = post.author || '익명 사용자';
        if (post.is_anonymous) {
            displayAuthor = state.currentUser?.role === 'teacher' ? `익명 (${post.author})` : '익명';
        }

        const likes = Array.isArray(post.likes) ? post.likes : [];
        const isLiked = likes.includes(String(state.currentUser?.id || state.currentUser?.name || ''));
        const commentCount = post.comments ? post.comments.length : 0;
        const isTeacher = state.currentUser?.role === 'teacher';
        
        // 본인 확인: author 필드에서 ID 추출 (형식: "이름 (#ID)")
        const authorInfo = post.author || '';
        // 작성자 ID 추출 (예: "홍길동 (#12)" -> "12")
        const authorId = authorInfo.includes('(#') ? authorInfo.split('(#').pop().split(')')[0].trim() : authorInfo;
        const isOwner = state.currentUser && (String(state.currentUser.id) === String(authorId) || state.currentUser.name === authorId);

        card.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 bg-primary/10 rounded-lg text-[10px] font-black text-primary uppercase tracking-widest">${post.category}</span>
                    <span class="text-[10px] font-bold text-slate-400 italic">${post.date}</span>
                </div>
                ${(isTeacher || isOwner) ? `
                    <button onclick="event.stopPropagation(); window.deletePost('${post.id}')" class="size-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100">
                        <span class="material-symbols-outlined text-[18px]">delete_forever</span>
                    </button>
                ` : ''}
            </div>

            <div onclick="window.openPostDetail('${post.id}')" class="flex-1 flex flex-col min-h-0">
                <h3 class="text-4xl font-black text-text-main tracking-tighter mb-4 line-clamp-2 leading-none group-hover:text-primary transition-colors break-words">${post.title}</h3>
                
                <div class="relative mb-6 flex-1 flex flex-col">
                    <p id="content-short-${post.id}" class="text-base text-slate-500 font-medium leading-relaxed whitespace-pre-wrap break-words ${post.image_url ? 'line-clamp-[6]' : 'line-clamp-[15]'}">${post.content}</p>
                    <p id="content-full-${post.id}" class="hidden text-base text-slate-500 font-medium leading-relaxed whitespace-pre-wrap break-words">${post.content}</p>
                    
                    ${(post.image_url ? post.content.split('\n').length > 6 || post.content.length > 150 : post.content.split('\n').length > 15 || post.content.length > 400) ? `
                        <button onclick="event.stopPropagation(); window.toggleCardExpand('${post.id}')" id="expand-btn-${post.id}" class="mt-2 text-primary font-black text-sm hover:underline flex items-center gap-1 w-fit">
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
                    <button onclick="event.stopPropagation(); window.toggleLikeV4('${post.id}', this, event)" class="flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'} transition-all">
                        <span class="material-symbols-outlined text-[20px]">${isLiked ? 'favorite' : 'favorite_border'}</span>
                        <span class="text-[12px] font-black">${likes.length}</span>
                    </button>
                    <button onclick="event.stopPropagation(); window.openCommentModal('${post.id}')" class="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors">
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
        container.innerHTML = `
            <div class="col-span-full empty-state-v4">
                <div class="empty-illustration">📝</div>
                <h3 class="text-2xl font-black text-text-main mb-2">등록된 숙제가 없습니다.</h3>
                <p class="text-sm text-text-dim font-bold">지금은 자유 시간! 멋진 하루를 보내세요. ✨</p>
            </div>
        `;
        return;
    }

    hws.forEach((hw, index) => {
        const card = document.createElement('article');
        card.className = 'group relative w-full ultra-card stagger-item bg-white border border-slate-100 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-700 overflow-hidden cursor-pointer flex flex-col p-8';
        card.style.animationDelay = `${index * 0.08}s`;
        
        // Add explicit click handler to the card for better desktop UX
        card.onclick = () => window.openPostDetail(hw.id, true);

        const tasks = Array.isArray(hw.tasks) ? hw.tasks : [];
        const isTeacher = state.currentUser?.role === 'teacher';
        
        let displayProgress = 0;
        let progressText = "Tasks";

        if (isTeacher) {
            const studentIds = Object.keys(hw.progress || {});
            if (studentIds.length > 0) {
                let totalTasks = studentIds.length * tasks.length;
                let doneTasks = studentIds.reduce((acc, sid) => acc + (hw.progress[sid]?.filter(t => t).length || 0), 0);
                displayProgress = (doneTasks / (totalTasks || 1)) * 100;
                progressText = `Class: ${doneTasks}/${totalTasks}`;
            }
        } else {
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
                <div class="size-8 rounded-xl ${displayProgress === 100 ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'} flex items-center justify-center border border-slate-100 transition-all">
                    <span class="material-symbols-outlined text-[18px]">${displayProgress === 100 ? 'verified' : 'assignment'}</span>
                </div>
            </div>

            <div class="flex-1 flex flex-col min-h-0">
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
                    <div class="flex items-center gap-1.5 text-primary">
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
        const res = await fetch(`/api/posts/${postId}`, { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: state.currentUser?.id,
                user_role: state.currentUser?.role
            })
        });
        if (res.ok) {
            showToast('이야기가 삭제되었습니다.');
            loadPosts();
        } else {
            const data = await res.json();
            showToast(data.error || '삭제에 실패했습니다.', 'error');
        }
    } catch (err) {
        showToast('서버 오류가 발생했습니다.', 'error');
    }
};

window.openPostDetail = (postId, isHomework = false) => {
    window.currentOpenPostId = postId;
    window.currentOpenIsHomework = isHomework;
    
    // Find post in current state or local array
    const post = isHomework 
        ? (window.currentHomework || []).find(h => h.id === postId)
        : (window.currentPosts || []).find(p => p.id === postId);
        
    if (!post) { console.warn('[OurNote] openPostDetail: post not found', postId, isHomework); return; }

    // Silently fill content
    updateDetailContent(post, isHomework);

    const modal = document.getElementById('post-detail-modal');
    if (!modal) { console.warn('[OurNote] post-detail-modal not found'); return; }

    modal.classList.remove('hidden');
    const overlay = document.getElementById('close-post-detail-overlay');
    const closeBtn = document.getElementById('close-post-detail-modal');
    setTimeout(() => {
        if(overlay) overlay.style.opacity = '1';
        modal.querySelector('.modal-v4')?.classList.add('active');
    }, 10);

    const closeHandler = () => {
        window.currentOpenPostId = null;
        modal.querySelector('.modal-v4')?.classList.remove('active');
        if(overlay) overlay.style.opacity = '0';
        setTimeout(() => modal.classList.add('hidden'), 400);
        overlay?.removeEventListener('click', closeHandler);
        closeBtn?.removeEventListener('click', closeHandler);
    };
    overlay?.addEventListener('click', closeHandler);
    closeBtn?.addEventListener('click', closeHandler);
};

window.updateDetailContent = (post, isHomework = false) => {
    const modal = document.getElementById('post-detail-modal');
    if (!modal) return;

    // Fill data
    document.getElementById('detail-title').textContent = post.title;
    const catLabel = (post.category || (isHomework ? 'HOMEWORK' : 'POST')).toUpperCase();
    document.getElementById('detail-meta').textContent = `${catLabel} | ${post.date}`;
    document.getElementById('detail-content').textContent = post.content;
    
    let displayAuthor = post.author || '익명 사용자';
    if (post.is_anonymous) {
        displayAuthor = state.currentUser?.role === 'teacher' ? `익명 (${post.author})` : '익명';
    }
    document.getElementById('detail-author-name').textContent = displayAuthor;
    document.getElementById('detail-author-avatar').textContent = displayAuthor.substring(0, 1);

    let deleteBtnContainer = document.getElementById('detail-footer-actions');
    if (!deleteBtnContainer) {
        deleteBtnContainer = document.createElement('div');
        deleteBtnContainer.id = 'detail-footer-actions';
        deleteBtnContainer.className = 'flex items-center gap-2 mt-4 pt-4 border-t border-slate-100';
        const contentArea = modal.querySelector('.p-8.space-y-10') || modal.querySelector('.p-8');
        if (contentArea) contentArea.appendChild(deleteBtnContainer);
    }
    deleteBtnContainer.innerHTML = '';
    
    if (state.currentUser?.role === 'teacher') {
        const delBtn = document.createElement('button');
        delBtn.className = 'px-6 py-3 rounded-2xl bg-red-50 text-red-500 font-black text-sm hover:bg-red-500 hover:text-white transition-all flex items-center gap-2';
        delBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">delete</span> 삭제하기';
        delBtn.onclick = async () => {
            if (await showConfirm('이 항목을 영구적으로 삭제하시겠습니까?')) {
                const endpoint = isHomework ? `/api/homework/${post.id}` : `/api/posts/${post.id}`;
                const res = await fetch(endpoint, { 
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: state.currentUser?.id,
                        user_role: state.currentUser?.role
                    })
                });
                if (res.ok) {
                    showToast('삭제되었습니다.');
                    modal.classList.add('hidden');
                    loadPosts();
                }
            }
        };
        deleteBtnContainer.appendChild(delBtn);
    }

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
            // assigned_students 배열 기준으로 표시 (progress 객체와 합쳐서)
            const assignedSids = post.assigned_students || Object.keys(post.progress || {});
            const studentsMap = {};
            // 학생 이름 캐시 사용
            (window.cachedStudents || []).forEach(s => { studentsMap[String(s.id)] = s.name; });

            // assigned_students가 있으면 그것 기준, 아니면 progress 키 기준
            const displaySids = assignedSids.length > 0 ? assignedSids : Object.keys(post.progress || {});

            list.innerHTML = `
                <div class="overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-100 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                            <tr>
                                <th class="px-6 py-4">학생</th>
                                <th class="px-4 py-4 text-center">진행도</th>
                                <th class="px-4 py-4 text-center">완료</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${displaySids.length > 0 ? displaySids.map(sid => {
                                const prog = (post.progress && post.progress[sid]) || [];
                                const tasks = post.tasks || [];
                                const done = prog.filter(t => t).length;
                                const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
                                const studentName = studentsMap[String(sid)] || sid;
                                const isDone = done === tasks.length && tasks.length > 0;
                                return `
                                    <tr class="hover:bg-white transition-colors">
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-2">
                                                <div class="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">${sid}</div>
                                                <span class="font-bold text-text-main">${studentName}</span>
                                            </div>
                                        </td>
                                        <td class="px-4 py-4">
                                            <div class="flex items-center gap-2">
                                                <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div class="h-full ${isDone ? 'bg-primary' : 'bg-accent'} transition-all duration-700" style="width: ${pct}%"></div>
                                                </div>
                                                <span class="font-black text-[10px] w-10 text-right">${done}/${tasks.length}</span>
                                            </div>
                                        </td>
                                        <td class="px-4 py-4 text-center">
                                            ${isDone ? '<span class="material-symbols-outlined text-primary text-xl">verified</span>' : '<span class="material-symbols-outlined text-slate-300 text-xl">radio_button_unchecked</span>'}
                                        </td>
                                    </tr>
                                `;
                            }).join('') : '<tr><td colspan="3" class="p-8 text-center opacity-40">배정된 학생이 없습니다.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;
            modal.querySelector('.sticky.bottom-0').classList.add('hidden');
        } else {
            // Student View: Checkable list
            const myId = state.currentUser?.id || 'all';
            const myProgress = (post.progress && post.progress[myId]) || (post.progress && post.progress['all']) || [];
            const tasks = post.tasks || [];

            list.innerHTML = tasks.length > 0 ? `
                <div class="space-y-4">
                    ${tasks.map((t, idx) => `
                        <button onclick="window.toggleHomeworkTask('${post.id}', ${idx}, this)" 
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
        window.currentReplyParentId = null;
        document.getElementById('detail-comment-count').textContent = post.comments?.length || 0;
        
        const renderCommentHTML = (c, isReply = false) => {
            const userId = String(state.currentUser?.id || state.currentUser?.name || '');
            const clikes = Array.isArray(c.likes) ? c.likes : [];
            const cLiked = clikes.includes(userId);
            const replies = Array.isArray(c.replies) ? c.replies : [];
            
            return `
            <div class="${isReply ? 'ml-8 mt-3 relative' : 'bg-slate-50 p-5 rounded-2xl border border-slate-100'} flex flex-col gap-2">
                ${isReply ? '<div class="absolute -left-6 top-3 w-4 h-[2px] bg-slate-200"></div>' : ''}
                <div class="flex justify-between items-center">
                    <span class="font-black text-primary text-sm">${c.author}</span>
                    <span class="text-[10px] text-text-secondary font-bold">${c.date}</span>
                </div>
                <p class="text-text-main text-sm font-medium whitespace-pre-wrap leading-relaxed">${c.content}</p>
                <div class="flex gap-4 mt-1 items-center">
                    <button onclick="window.toggleCommentLike('${post.id}', '${c.id}', this)" class="flex items-center gap-1 ${cLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'} transition-colors">
                        <span class="material-symbols-outlined text-[14px]">${cLiked ? 'favorite' : 'favorite_border'}</span>
                        <span class="text-[10px] font-black">${clikes.length}</span>
                    </button>
                    ${!isReply ? `
                    <button onclick="window.prepareReply('${post.id}', '${c.id}', '${c.author}')" class="flex items-center gap-1 text-slate-400 hover:text-primary transition-colors">
                        <span class="material-symbols-outlined text-[14px]">reply</span>
                        <span class="text-[10px] font-black">답글쓰기</span>
                    </button>
                    ` : ''}
                    ${(isTeacher || (state.currentUser && String(c.author).includes(`#${state.currentUser.id}`))) ? `
                    <button onclick="window.deleteComment('${post.id}', '${c.id}')" class="flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors ml-auto">
                        <span class="material-symbols-outlined text-[14px]">delete</span>
                        <span class="text-[10px] font-black">삭제</span>
                    </button>
                    ` : ''}
                </div>
                ${!isReply && replies.length > 0 ? `
                    <div class="mt-3 space-y-3 border-l-2 border-slate-200">
                        ${replies.map(r => renderCommentHTML(r, true)).join('')}
                    </div>
                ` : ''}
            </div>`;
        };

        const renderCommentsList = (commentsArray) => {
            return (commentsArray || []).map(c => renderCommentHTML(c)).join('') || '<p class="text-center py-6 opacity-30 font-bold text-sm">첫 댓글을 남겨보세요! ✨</p>';
        };

        list.innerHTML = renderCommentsList(post.comments);

        // Setup comment submission
        const submitBtn = document.getElementById('detail-submit-comment');
        if (submitBtn) {
            // Using a named function to avoid cloning issues or duplication
            submitBtn.onclick = async () => {
                if (submitBtn.disabled) return;
                
                const input = document.getElementById('detail-comment-input');
                let txt = input?.value.trim();
                if (!txt) return;
                
                if (window.currentReplyParentId && !txt.startsWith('@')) {
                    window.currentReplyParentId = null;
                }

                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">sync</span>';
                try {
                    const payload = { 
                        author: state.currentUser?.name || 'Anonymous', 
                        content: txt 
                    };
                    if (window.currentReplyParentId) payload.parent_id = window.currentReplyParentId;

                    const res = await fetch(`/api/posts/${post.id}/comments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    if (res.ok) {
                        input.value = '';
                        window.currentReplyParentId = null;
                        showToast(payload.parent_id ? '답글이 등록되었습니다! 💬' : '댓글이 등록되었습니다! 💬');
                        
                        // Silent refresh data
                        const postsRes = await fetch('/api/posts');
                        window.currentPosts = await postsRes.json();
                        const updatedPost = window.currentPosts.find(p => p.id === post.id);
                        if (updatedPost) {
                            updateDetailContent(updatedPost, isHomework);
                            setTimeout(() => {
                                const list = document.getElementById('detail-comments-list');
                                list?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                            }, 50);
                        }
                    } else {
                        let errMsg = '댓글 등록에 실패했습니다.';
                        try {
                            const errData = await res.json();
                            console.error('[OurNote] Comment failed:', res.status, errData);
                            if (errData.error) errMsg = `댓글 등록 실패: ${errData.error}`;
                        } catch(_) {
                            console.error('[OurNote] Comment failed:', res.status, res.statusText);
                        }
                        showToast(errMsg, 'error');
                    }
                } catch (err) {
                    showToast('서버 오류가 발생했습니다.', 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">send</span>';
                }
            };
        }
    }
};

window.toggleHomeworkTask = async (hwId, taskIdx, btn) => {
    const icon = btn.querySelector('.material-symbols-outlined');
    const newState = icon.textContent.trim() !== 'check';
    const label = btn.querySelector('span:last-child');
    const box = icon.parentElement;
    
    if (newState) {
        icon.textContent = 'check';
        box.classList.replace('bg-white', 'bg-primary');
        box.classList.replace('text-slate-300', 'text-white');
        label.classList.add('line-through', 'opacity-60', 'text-primary');
        btn.classList.replace('border-slate-100', 'border-primary');
        btn.classList.add('bg-primary/5');
        btn.style.animation = 'hwCheckPulse 0.6s ease-out';
        setTimeout(() => btn.style.animation = '', 700);

        // 🎉 화려한 폭죽 애니메이션!
        launchConfetti(btn);
        showToast('✅ 완료! 잘 했어요! 🎉', 'success');
    } else {
        icon.textContent = 'radio_button_unchecked';
        box.classList.replace('bg-primary', 'bg-white');
        box.classList.replace('text-white', 'text-slate-300');
        label.classList.remove('line-through', 'opacity-60', 'text-primary');
        btn.classList.replace('border-primary', 'border-slate-100');
        btn.classList.remove('bg-primary/5');
    }

    try {
        await fetch(`/api/homework/${hwId}/task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: state.currentUser?.id || 'all', task_index: taskIdx, completed: newState })
        });
        const hwRes = await fetch('/api/homework');
        window.currentHomework = await hwRes.json();
        // Do not re-render homework list entirely to avoid scrolling/refreshing issues

    } catch (err) {
        showToast('상태 변경에 실패했습니다.', 'error');
    }
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
            // Refresh to show new comment but avoid losing context
            const postsRes = await fetch('/api/posts');
            window.currentPosts = await postsRes.json();
            const el = document.getElementById(`comments-${postId}`);
            if (el) {
                // Re-render the specific comment list here or just notify
                showToast('댓글이 등록되었습니다! 💬', 'success');
            }
        }
    } catch (err) {
        showToast('댓글 등록에 실패했습니다.', 'error');
    }
};

window.prepareReply = (postId, commentId, author) => {
    const input = document.getElementById('detail-comment-input');
    if (input) {
        window.currentReplyParentId = commentId;
        const pureName = author.split(' (#')[0];
        input.value = `@${pureName} `;
        input.focus();
        showToast(`${pureName}님에게 답글을 작성합니다.`);
    }
};

window.deleteComment = async (postId, commentId) => {
    if (!await showConfirm('댓글을 정말 삭제할까요?')) return;
    try {
        const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: state.currentUser?.id,
                user_role: state.currentUser?.role
            })
        });
        if (res.ok) {
            showToast('댓글이 삭제되었습니다.');
            loadPosts();
            // If in detail, silent update
            if (window.currentOpenPostId === postId) {
                const postsRes = await fetch('/api/posts');
                window.currentPosts = await postsRes.json();
                const updatedPost = window.currentPosts.find(p => p.id === postId);
                if (updatedPost) updateDetailContent(updatedPost, window.currentOpenIsHomework);
            }
        }
    } catch (e) {
        showToast('삭제에 실패했습니다.', 'error');
    }
};

window.toggleLikeV4 = async (postId, btn, event) => {
    // ❤️ 하트 떠오르는 애니메이션
    const x = event ? event.clientX : btn.getBoundingClientRect().left + 16;
    const y = event ? event.clientY : btn.getBoundingClientRect().top;
    spawnFloatingHearts(x, y, 8);

    // 버튼 펄스 효과
    btn.style.transform = 'scale(1.4)';
    btn.style.transition = 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)';
    setTimeout(() => { btn.style.transform = ''; }, 300);

    try {
        const res = await fetch(`/api/posts/${postId}/like`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: state.currentUser?.id || state.currentUser?.name || 'anon' })
        });
        const data = await res.json();
        if (data.success) {
            const span = btn.querySelector('span:last-child');
            if (span) span.textContent = data.likes;
            btn.classList.add('text-red-500');
            btn.classList.remove('text-slate-400', 'text-text-dim');
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) icon.textContent = 'favorite';
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
                assigned_students: assigned_students,
                tasks: tasks
            };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Reset form
                document.getElementById('post-title').value = '';
                document.getElementById('post-content').value = '';
                document.getElementById('image-preview').classList.add('hidden');
                imageInput.value = '';

                // ✈️ 종이 비행기 애니메이션 후 모달 닫기
                const writeModal = document.getElementById('write-modal');
                playPaperPlaneAnimation(() => {
                    if (writeModal) writeModal.classList.add('hidden');
                    showToast('이야기가 등록되었습니다! ✈️✨');
                    loadPosts();
                });
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

// -------------------------------------------------------------------------------- //
// SILENT POLLING (Real-time updates)
// -------------------------------------------------------------------------------- //
setInterval(async () => {
    if (!state.currentUser) return;
    
    // Optimization: Only poll if window is focused
    if (!document.hasFocus()) return;

    // Skip if typing
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

    try {
        if (state.currentCategory === 'homework') {
            const res = await fetch('/api/homework');
            const hws = await res.json();
            if (JSON.stringify(hws) !== JSON.stringify(window.currentHomework)) {
                window.currentHomework = hws;
                renderHomework(hws.slice().reverse());
                if (window.currentOpenPostId && window.currentOpenIsHomework) {
                    const post = hws.find(h => h.id === window.currentOpenPostId);
                    if (post) updateDetailContent(post, true);
                }
            }
        } else {
            const res = await fetch('/api/posts');
            const posts = await res.json();
            if (JSON.stringify(posts) !== JSON.stringify(window.currentPosts)) {
                window.currentPosts = posts;
                renderPosts(posts.slice().reverse());
                if (window.currentOpenPostId && !window.currentOpenIsHomework) {
                    const post = posts.find(p => p.id === window.currentOpenPostId);
                    if (post) updateDetailContent(post, false);
                }
            }
        }
    } catch (e) {}
}, 15000); // Optimized to 15s
