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
