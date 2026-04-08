/**
 * OURNOTE UI MODULE (Effects & Animations)
 */
export function initSplash() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        // Calmer, faster transition
        setTimeout(() => {
            splash.style.transition = 'opacity 1s ease-out, visibility 1s';
            splash.style.opacity = '0';
            splash.style.visibility = 'hidden';
            document.body.classList.add('ready');
            
            // Ensure it's removed from DOM after fade
            setTimeout(() => {
                if (splash.parentNode) splash.remove();
            }, 1000);
        }, 2000); // Wait for 2 seconds instead of 3.5
    } else {
        document.body.classList.add('ready');
    }
}

export function initCursor() {
    const cursor = document.getElementById('cursor-v4');
    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.transform = `translate3d(${e.clientX - 20}px, ${e.clientY - 20}px, 0)`;
            if (e.target.closest('button, a, .ultra-card, .nav-link')) {
                cursor.classList.add('active');
            } else {
                cursor.classList.remove('active');
            }
        });
    }
}

export function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    const particleCount = 80;

    function reset() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speedX: Math.random() * 0.4 - 0.2,
                speedY: Math.random() * 0.4 - 0.2,
                alpha: Math.random() * 0.2
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const isWhite = document.documentElement.getAttribute('data-theme') === 'white';
        const baseRGB = isWhite ? '0, 0, 0' : '255, 255, 255';
        
        particles.forEach(p => {
            p.x += p.speedX; p.y += p.speedY;
            if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
            if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
            ctx.fillStyle = `rgba(${baseRGB}, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }

    reset();
    animate();
    window.addEventListener('resize', reset);
}

export function setupModal(modalId, triggerId, closeId) {
    const modal = document.getElementById(modalId);
    const overlay = modal?.querySelector('.modal-overlay') || document.getElementById(`close-${modalId}-overlay`);
    const body = modal?.querySelector('.modal-v4');
    
    document.getElementById(triggerId)?.addEventListener('click', () => {
        modal.classList.remove('hidden');
        setTimeout(() => { if(overlay) overlay.style.opacity = '1'; if(body) body.classList.add('active'); }, 10);
    });
    
    const close = () => {
        if(body) body.classList.remove('active'); if(overlay) overlay.style.opacity = '0';
        setTimeout(() => modal.classList.add('hidden'), 500);
    };
    
    document.getElementById(closeId)?.addEventListener('click', close);
    overlay?.addEventListener('click', close);
}
