/**
 * OURNOTE: POST DETAIL MODAL LOGIC
 * Handles viewing individual post details and comments.
 */
import { state, showToast } from '../common.js';

export function initPostDetailModal() {
    console.log("OurNote: Post Detail Modal ready.");
}

window.openPostDetail = async (postId) => {
    const modal = document.getElementById('post-detail-modal');
    if (!modal) return;

    // In a real app, fetch from API or cache
    const post = window.currentPosts?.find(p => p.id === postId);
    if (!post) return;

    // Render logic
    document.getElementById('detail-title').textContent = post.title;
    document.getElementById('detail-content').textContent = post.content;
    
    const imgContainer = modal.querySelector('.detail-image-container');
    if (post.image_url) {
        imgContainer.innerHTML = `<img src="${post.image_url}" class="w-full h-full object-contain">`;
        imgContainer.classList.remove('hidden');
    } else {
        imgContainer.classList.add('hidden');
    }

    modal.classList.remove('hidden');
    modal.querySelector('.modal-v4').classList.add('active');
};
