/**
 * OURNOTE NAVIGATION MODULE
 */
import { state } from './common.js';
import { loadPosts } from './posts.js';

export function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const title = document.getElementById('current-category-title');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const cat = link.getAttribute('data-cat');
            if (!cat) return;

            // 1. Update State
            state.currentCategory = cat;
            
            // 2. Update UI
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            if (title) {
                const name = link.querySelector('span:last-child').textContent;
                title.textContent = name;
            }
            
            // 3. Load Data
            loadPosts();
        });
    });
    
    loadCategories();
}

export async function loadCategories() {
    const container = document.getElementById('dynamic-categories');
    if (!container) return;

    try {
        const res = await fetch('/api/categories');
        const cats = await res.json();
        
        container.innerHTML = '';
        cats.forEach(cat => {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'nav-link';
            link.setAttribute('data-cat', cat.id);
            link.innerHTML = `
                <span class="material-symbols-outlined">${cat.icon || 'forum'}</span>
                <span>${cat.name}</span>
            `;
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                state.currentCategory = cat.id;
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                const title = document.getElementById('current-category-title');
                if (title) title.textContent = cat.name;
                loadPosts();
            });
            
            container.appendChild(link);
        });
    } catch (err) {
        console.error('Failed to load categories', err);
    }
}
