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
        const card = document.createElement('div');
        card.className = 'ultra-card post-card-v4';
        card.style.transitionDelay = `${index * 0.1}s`;
        
        let displayAuthor = post.author;
        if (post.is_anonymous) {
            displayAuthor = state.currentUser.role === 'teacher' ? `익명 (${post.author})` : '익명';
        }

        const likes = post.likes || [];
        const isLiked = likes.includes(String(state.currentUser.id || state.currentUser.name || ''));

        card.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <span class="px-4 py-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">${post.category}</span>
                <span class="text-xs text-text-dim">${post.date}</span>
            </div>
            <h3 class="post-title-v4 text-white">${post.title}</h3>
            <p class="post-body text-text-dim text-lg mb-4 line-clamp-4">${post.content.replace(/\n/g, '<br>')}</p>
            ${post.image_url ? `<img src="${post.image_url}" class="w-full max-h-60 object-contain rounded-xl mb-4" onerror="this.style.display='none'">` : ''}
            <div class="flex items-center gap-4 py-3 border-t border-white/5">
                <button onclick="window.toggleLikeV4(${post.id}, this)" class="flex items-center gap-2 ${isLiked ? 'text-red-400' : 'text-text-dim'}">
                    <span class="material-symbols-outlined">${isLiked ? 'favorite' : 'favorite_border'}</span>
                    <span>${likes.length}</span>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

export function renderHomework(hws) {
    // Homework rendering logic...
}

window.toggleLikeV4 = async (postId, btn) => {
    // Like logic...
};
