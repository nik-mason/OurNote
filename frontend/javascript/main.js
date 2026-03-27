/**
 * OURNOTE ULTRA-ENGINE (V4)
 */
document.addEventListener('DOMContentLoaded', () => {
    let savedGlobalTheme = localStorage.getItem('ournote-theme');
    if (!savedGlobalTheme) {
        savedGlobalTheme = 'dark';
        localStorage.setItem('ournote-theme', 'dark');
    }
    document.documentElement.setAttribute('data-theme', savedGlobalTheme);

    const isDashboard = window.location.pathname.includes('/dashboard');
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let currentCategory = 'all';

    // UI Elements
    const ultraBar = document.getElementById('ultra-bar');
    const toastContainer = document.getElementById('toast-container');
    const splash = document.getElementById('splash-screen');

    // --- 0. SPLASH & INITIALIZE ---
    if (splash) {
        initFlyingElements();
        setTimeout(() => {
            splash.classList.add('fade-out');
            document.body.classList.add('ready');
            setTimeout(() => splash.remove(), 1200);
        }, 3500);
    } else {
        document.body.classList.add('ready');
    }

    function initFlyingElements() {
        const container = document.getElementById('flying-particles');
        if (!container) return;

        // Balanced counts for extreme visual but 0 lag
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 40; i++) {
            const feather = document.createElement('div');
            feather.className = 'feather';
            const startX = Math.random() * 100 + 'vw';
            feather.style.setProperty('--startX', startX);
            feather.style.setProperty('--endX', (Math.random() * 100 - 50) + 'vw');
            feather.style.setProperty('--duration', (Math.random() * 2 + 1.5) + 's');
            feather.style.animationDelay = Math.random() * 3 + 's';
            fragment.appendChild(feather);
        }

        for (let i = 0; i < 15; i++) {
            const streak = document.createElement('div');
            streak.className = 'light-streak';
            const top = Math.random() * 100 + 'vh';
            streak.style.setProperty('--top', top);
            streak.style.setProperty('--midTop', (parseFloat(top) + (Math.random() * 20 - 10)) + 'vh');
            streak.style.setProperty('--endTop', (parseFloat(top) + (Math.random() * 40 - 20)) + 'vh');
            streak.style.setProperty('--angle', (Math.random() * 30 - 15) + 'deg');
            streak.style.setProperty('--duration', (Math.random() * 0.6 + 0.4) + 's');
            streak.style.animationDelay = Math.random() * 3 + 's';
            fragment.appendChild(streak);
        }
        container.appendChild(fragment);
    }

    // --- 1. CUSTOM CURSOR ENGINE ---
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

    // --- 2. PARTICLE BACKGROUND ENGINE ---
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const particleCount = 80;

        function initParticles() {
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
                    color: `rgba(255, 255, 255, ${Math.random() * 0.2})`
                });
            }
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.speedX; p.y += p.speedY;
                if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
                if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            requestAnimationFrame(animateParticles);
        }
        initParticles();
        animateParticles();
        window.addEventListener('resize', initParticles);
    }

    // --- 3. TOAST SYSTEM ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `ultra-glass p-6 rounded-2xl flex items-center gap-4 border-l-4 ${type === 'error' ? 'border-accent' : 'border-primary'}`;
        toast.style.cssText = 'position: relative; animation: slideIn 0.5s ease forwards;';
        toast.innerHTML = `
            <span class="material-symbols-outlined ${type === 'error' ? 'text-accent' : 'text-primary'}">
                ${type === 'error' ? 'error' : 'auto_awesome'}
            </span>
            <span class="font-bold text-white">${message}</span>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            toast.style.transition = 'all 0.5s ease';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // --- 4. PAGE LOGIC: LOGIN ---
    if (!isDashboard) {
        const studentBtn = document.getElementById('radio-student-btn');
        const teacherBtn = document.getElementById('radio-teacher-btn');
        const studentFields = document.getElementById('student-fields');
        const teacherFields = document.getElementById('teacher-fields');
        const modeInput = document.getElementById('login-mode');
        const loginBtn = document.getElementById('login-btn');
        const loginCard = document.querySelector('.ultra-card');

        const switchTab = (mode) => {
            loginCard.style.transform = 'perspective(1000px) rotateY(15deg) scale(0.95)';
            setTimeout(() => {
                modeInput.value = mode;
                if (mode === 'student') {
                    studentFields.classList.remove('hidden');
                    teacherFields.classList.add('hidden');
                    studentBtn.classList.add('bg-primary', 'text-white');
                    teacherBtn.classList.remove('bg-primary', 'text-white');
                } else {
                    teacherFields.classList.remove('hidden');
                    studentFields.classList.add('hidden');
                    teacherBtn.classList.add('bg-primary', 'text-white');
                    studentBtn.classList.remove('bg-primary', 'text-white');
                }
                loginCard.style.transform = 'perspective(1000px) rotateY(0deg) scale(1)';
            }, 200);
        };

        studentBtn?.addEventListener('click', () => switchTab('student'));
        teacherBtn?.addEventListener('click', () => switchTab('teacher'));

        loginBtn?.addEventListener('click', async () => {
            const mode = modeInput.value;
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span class="animate-spin material-symbols-outlined">sync</span> 인증 중...';

            try {
                if (mode === 'student') {
                    const id = document.getElementById('student-id').value.trim();
                    const name = document.getElementById('student-name').value.trim();
                    if (!id || !name) throw new Error('정보를 모두 입력해주세요.');
                    const res = await fetch('/api/students');
                    const students = await res.json();
                    const student = students.find(s => s.id === id && s.name === name);
                    if (student) handleLoginSuccess({ name: student.name, role: 'student' });
                    else throw new Error('학생 정보를 찾을 수 없습니다.');
                } else {
                    const id = document.getElementById('teacher-id').value.trim();
                    const pw = document.getElementById('teacher-pw').value.trim();
                    if (!id || !pw) throw new Error('정보를 모두 입력해주세요.');
                    const res = await fetch('/api/teacher');
                    const teacher = await res.json();
                    if (teacher.username === id && teacher.password === pw) {
                        handleLoginSuccess({ name: '선생님', role: 'teacher' });
                    } else throw new Error('일치하는 정보가 없습니다.');
                }
            } catch (err) {
                showToast(err.message, 'error');
                loginBtn.classList.add('error-shake');
                setTimeout(() => loginBtn.classList.remove('error-shake'), 600);
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = '입장하기';
            }
        });

        function handleLoginSuccess(user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            showToast(`${user.name}님, 환영합니다!`);
            loginCard.style.transform = 'perspective(1000px) translate3D(0, 0, 100px) scale(1.1)';
            loginCard.style.opacity = '0';
            setTimeout(() => window.location.href = '/dashboard', 800);
        }
    }

    // --- 5. PAGE LOGIC: DASHBOARD ---
    if (isDashboard) {
        if (!currentUser) {
            window.location.href = '/';
            return;
        }
        const usernameDisplay = document.getElementById('display-username');
        if (usernameDisplay) usernameDisplay.textContent = currentUser.name;
        if (currentUser.role === 'teacher') {
            document.querySelectorAll('.hidden-by-role').forEach(el => el.classList.remove('hidden-by-role'));
        }

        // Sidebar Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (link.id === 'nav-mobile') return;

                const mainArea = document.querySelector('.content-area');
                mainArea.classList.add('page-transition-active');

                setTimeout(() => {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    const cat = link.id.replace('nav-', '');
                    currentCategory = cat;
                    document.getElementById('current-category-title').textContent = link.querySelector('span:last-child').textContent;
                    loadPosts();
                    setTimeout(() => mainArea.classList.remove('page-transition-active'), 600);
                }, 400);
            });
        });

        // Modals
        const setupModal = (modalId, triggerId, closeId) => {
            const modal = document.getElementById(modalId);
            const overlay = modal?.querySelector('.modal-overlay');
            const body = modal?.querySelector('.modal-v4');
            document.getElementById(triggerId)?.addEventListener('click', () => {
                modal.classList.remove('hidden');
                setTimeout(() => { overlay.style.opacity = '1'; body.classList.add('active'); }, 10);
            });
            document.getElementById(closeId)?.addEventListener('click', () => {
                body.classList.remove('active'); overlay.style.opacity = '0';
                setTimeout(() => modal.classList.add('hidden'), 500);
            });
        };
        setupModal('mobile-modal', 'nav-mobile', 'close-mobile-modal');
        setupModal('settings-modal', 'open-settings-modal', 'close-settings-modal');
        setupModal('write-modal', 'open-write-modal', 'close-write-modal');

        // Custom Select Dropdown Logic
        const categoryTrigger = document.getElementById('custom-category-trigger');
        const categoryOptions = document.getElementById('custom-category-options');
        const categoryInput = document.getElementById('post-category');
        const selectedText = document.getElementById('selected-category-text');

        if (categoryTrigger && categoryOptions) {
            categoryTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                categoryOptions.classList.toggle('active');
            });
            
            document.querySelectorAll('.custom-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    categoryInput.value = opt.getAttribute('data-value');
                    selectedText.textContent = opt.textContent;
                    categoryOptions.classList.remove('active');
                });
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.custom-select-container')) {
                    categoryOptions.classList.remove('active');
                }
            });
        }

        document.getElementById('nav-mobile')?.addEventListener('click', () => {
            const localIP = "192.168.45.94";
            document.getElementById('qr-code-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`http://${localIP}:6273`)}`;
        });

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = '/';
        });

        // Post Submission
        document.getElementById('submit-post')?.addEventListener('click', async () => {
            const title = document.getElementById('post-title').value.trim();
            const content = document.getElementById('post-content').value.trim();
            const category = document.getElementById('post-category').value;
            if (!title || !content) return showToast('내용을 모두 채워주세요!', 'error');
            try {
                const res = await fetch('/api/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content, category, author: currentUser.name, role: currentUser.role, date: new Date().toLocaleDateString() })
                });
                if (res.ok) {
                    showToast('성공적으로 게시되었습니다! ✨');
                    document.getElementById('close-write-modal').click();
                    loadPosts();
                    triggerConfetti();
                }
            } catch (e) { showToast('게시물 등록 실패', 'error'); }
        });

        // Settings Tabs Logic
        const settingsTabs = document.querySelectorAll('.settings-tab');
        const settingsPanes = document.querySelectorAll('.settings-pane');

        settingsTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-tab');
                settingsTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                settingsPanes.forEach(pane => {
                    if (pane.id === `tab-${target}`) {
                        pane.classList.remove('hidden');
                    } else {
                        pane.classList.add('hidden');
                    }
                });
            });
        });

        // Theme Management
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                const theme = opt.getAttribute('data-theme');
                themeOptions.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');

                // Apply Theme
                document.documentElement.setAttribute('data-theme', theme);

                localStorage.setItem('ournote-theme', theme);
                showToast(`${theme.charAt(0).toUpperCase() + theme.slice(1)} 테마가 적용되었습니다.`);
            });
        });

        // Load Persisted Theme (Checkbox Update only)
        const savedTheme = localStorage.getItem('ournote-theme');
        if (savedTheme) {
            const targetOpt = document.querySelector(`.theme-option[data-theme="${savedTheme}"]`);
            if (targetOpt) {
                document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
                targetOpt.classList.add('active');
            }
        }

        document.getElementById('save-password')?.addEventListener('click', async () => {
            const newPw = document.getElementById('new-password').value;
            if (!newPw) return showToast('새 비밀번호를 입력하세요.', 'error');
            try {
                const res = await fetch('/api/teacher/password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: newPw })
                });
                if (res.ok) {
                    showToast('보안 설정이 업데이트되었습니다. ✨');
                }
            } catch (e) {
                showToast('비밀번호 변경 실패', 'error');
            }
        });

        // Detail Design Tweaks Logic
        const radiusSelect = document.getElementById('setting-radius');
        if (radiusSelect) {
            radiusSelect.addEventListener('change', (e) => {
                document.documentElement.style.setProperty('--card-radius', e.target.value);
                showToast('곡률 세팅이 저장되었습니다.');
            });
        }

        const glowSlider = document.getElementById('setting-glow');
        if (glowSlider) {
            glowSlider.addEventListener('input', (e) => {
                const alpha = e.target.value;
                const theme = document.documentElement.getAttribute('data-theme') || 'dark';
                const themeColors = {
                    'dark': `43, 140, 238, ${alpha}`,
                    'white': `59, 130, 246, ${alpha}`,
                    'blue': `14, 165, 233, ${alpha}`,
                    'aurora': `16, 185, 129, ${alpha}`,
                    'moonlight': `139, 92, 246, ${alpha}`
                };
                if (themeColors[theme]) {
                    document.documentElement.style.setProperty('--primary-glow', `rgba(${themeColors[theme]})`);
                }
            });
            glowSlider.addEventListener('change', () => showToast('글로우 감도가 저장되었습니다.'));
        }

        loadPosts();
        initScrollProgress();
    }

    // --- 6. SHARED FUNCTIONS ---
    async function loadPosts() {
        const container = document.getElementById('posts-container');
        if (!container) return;
        container.innerHTML = '<div class="ultra-card h-[300px] skeleton col-span-full"></div>';
        const res = await fetch('/api/posts');
        const posts = await res.json();
        renderPosts(posts);
    }

    function renderPosts(posts) {
        const container = document.getElementById('posts-container');
        if (!container) return;
        container.innerHTML = '';
        const filtered = currentCategory === 'all' ? posts : posts.filter(p => p.category === currentCategory);
        if (filtered.length === 0) {
            container.innerHTML = '<div class="col-span-full py-20 text-center text-text-dim text-xl font-bold">작성된 이야기가 없습니다.</div>';
            return;
        }
        filtered.forEach((post, index) => {
            const card = document.createElement('div');
            card.className = 'ultra-card post-card-v4';
            card.style.transitionDelay = `${index * 0.1}s`;
            card.innerHTML = `
                <div class="flex justify-between items-start mb-6">
                    <span class="px-4 py-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">${post.category}</span>
                    <span class="text-xs text-text-dim">${post.date}</span>
                </div>
                <h3 class="post-title-v4 text-white">${post.title}</h3>
                <p class="text-text-dim line-clamp-4 mb-8">${post.content}</p>
                <div class="flex items-center gap-3 mt-auto pt-6 border-t border-white/5">
                    <div class="size-8 rounded-full bg-white/10 flex items-center justify-center"><span class="material-symbols-outlined text-sm">person</span></div>
                    <div class="flex flex-col"><span class="text-xs font-bold">${post.author}</span><span class="text-[9px] text-text-dim uppercase tracking-widest">${post.role}</span></div>
                    ${currentUser.role === 'teacher' ? `<button onclick="deletePostV4(${post.id}, this)" class="ml-auto text-text-dim hover:text-accent"><span class="material-symbols-outlined text-[20px]">delete</span></button>` : ''}
                </div>`;
            container.appendChild(card);
            requestAnimationFrame(() => setTimeout(() => card.classList.add('reveal'), 50));
        });
    }

    window.deletePostV4 = async (id, btn) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const card = btn.closest('.ultra-card');
        card.style.transform = 'perspective(1000px) rotateX(-90deg) scale(0.5)';
        card.style.opacity = '0';
        setTimeout(async () => {
            const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
            if (res.ok) { showToast('삭제되었습니다.'); loadPosts(); }
        }, 600);
    };

    function initScrollProgress() {
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const scrolled = (winScroll / (document.documentElement.scrollHeight - document.documentElement.clientHeight)) * 100;
            if (ultraBar) ultraBar.style.width = scrolled + "%";
        });
    }

    function triggerConfetti() {
        const colors = ['#2b8cee', '#f43f5e', '#fbbf24', '#10b981'];
        for (let i = 0; i < 60; i++) {
            const p = document.createElement('div');
            p.className = 'fixed pointer-events-none z-[300]';
            p.style.cssText = `width:${Math.random() * 10 + 5}px; height:${Math.random() * 10 + 5}px; background:${colors[Math.floor(Math.random() * colors.length)]}; left:50%; top:50%; border-radius:2px;`;
            document.body.appendChild(p);
            p.animate([{ transform: 'translate(0, 0)', opacity: 1 }, { transform: `translate(${(Math.random() - 0.5) * 1000}px, ${(Math.random() - 0.5) * 1000 - 200}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 1500 + Math.random() * 1000, easing: 'cubic-bezier(0, .9, .57, 1)' }).onfinish = () => p.remove();
        }
    }
});
