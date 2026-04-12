/**
 * OURNOTE: WRITE MODAL LOGIC
 * Handles story creation, category selection, and form submission.
 */
import { state, showToast } from '../common.js';

export function initWriteModal() {
    console.log("OurNote: Initializing Write Modal...");
    
    const form = document.querySelector('#write-modal');
    if (!form) return;

    // Category Chips Logic
    const categoryChips = document.querySelectorAll('.post-cat-chip');
    const categoryInput = document.getElementById('post-category');
    
    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            categoryChips.forEach(c => c.classList.remove('active', 'bg-primary', 'text-white'));
            categoryChips.forEach(c => c.classList.add('bg-slate-100', 'text-text-secondary'));
            
            chip.classList.add('active', 'bg-primary', 'text-white');
            chip.classList.remove('bg-slate-100', 'text-text-secondary');
            
            const val = chip.getAttribute('data-value');
            if (categoryInput) categoryInput.value = val;
            
            // Toggle homework section
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

    // Image Preview
    const imageInput = document.getElementById('post-image');
    imageInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('image-preview');
                if (preview) {
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Submit Logic
    const submitBtn = document.getElementById('submit-post');
    submitBtn?.addEventListener('click', async () => {
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;
        const category = categoryInput?.value || 'dashboard';
        const isAnonymous = document.getElementById('post-anonymous')?.checked;

        if (!title || !content) {
            showToast('제목과 내용을 입력해주세요!', 'error');
            return;
        }

        // Simulating post creation
        showToast('이야기가 성공적으로 등록되었습니다!', 'success');
        document.getElementById('write-modal').classList.add('hidden');
        
        // Reset form
        document.getElementById('post-title').value = '';
        document.getElementById('post-content').value = '';
        document.getElementById('image-preview').classList.add('hidden');
    });
}
