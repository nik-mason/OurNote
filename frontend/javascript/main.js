/**
 * OURNOTE ULTRA-ENGINE (V4)
 */
document.addEventListener('DOMContentLoaded', () => {
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let savedGlobalTheme = localStorage.getItem('ournote-theme');

    if (currentUser && currentUser.settings) {
        if (currentUser.settings.theme) savedGlobalTheme = currentUser.settings.theme;
        if (currentUser.settings.radius) document.documentElement.style.setProperty('--card-radius', currentUser.settings.radius);
        if (currentUser.settings.glow) {
            const glowTheme = savedGlobalTheme || 'dark';
            const tc = {
                'dark': `43, 140, 238, ${currentUser.settings.glow}`,
                'white': `59, 130, 246, ${currentUser.settings.glow}`,
                'blue': `14, 165, 233, ${currentUser.settings.glow}`,
                'aurora': `16, 185, 129, ${currentUser.settings.glow}`,
                'moonlight': `139, 92, 246, ${currentUser.settings.glow}`
            };
            document.documentElement.style.setProperty('--primary-glow', `rgba(${tc[glowTheme] || tc['dark']})`);
        }
    }

    if (!savedGlobalTheme) {
        savedGlobalTheme = 'dark';
        localStorage.setItem('ournote-theme', 'dark');
    }
    document.documentElement.setAttribute('data-theme', savedGlobalTheme);

    const isDashboard = window.location.pathname.includes('/dashboard');
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
                    alpha: Math.random() * 0.2
                });
            }
        }

        function animateParticles() {
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
                    
                    // Resilient Matching Logic: Handles IDs like '12' vs '012', and trims names
                    const student = students.find(s => 
                        (String(s.id).padStart(2, '0') === id.padStart(2, '0')) && 
                        (s.name.trim() === name)
                    );
                    
                    if (student) handleLoginSuccess({ name: student.name, role: 'student', id: student.id, settings: student.settings || null });
                    else throw new Error('학생 정보를 찾을 수 없습니다.');
                } else {
                    const id = document.getElementById('teacher-id').value.trim();
                    const pw = document.getElementById('teacher-pw').value.trim();
                    if (!id || !pw) throw new Error('정보를 모두 입력해주세요.');
                    const res = await fetch('/api/teacher');
                    const teacher = await res.json();
                    if (teacher.username === id && teacher.password === pw) {
                        handleLoginSuccess({ name: '선생님', role: 'teacher', settings: teacher.settings || null });
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
        
        async function saveSettings(updateObj) {
            currentUser.settings = { ...(currentUser.settings || {}), ...updateObj };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            try {
                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: currentUser.role, id: currentUser.id, settings: currentUser.settings })
                });
            } catch(e) { console.error('Settings save failed', e); }
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

        // Password Change (Teacher)
        document.getElementById('save-password')?.addEventListener('click', async () => {
            const newPw = document.getElementById('new-password').value.trim();
            if (!newPw) return showToast('새 비밀번호를 입력해주세요!', 'error');
            try {
                const res = await fetch('/api/teacher/password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: newPw })
                });
                if (res.ok) {
                    showToast('비밀번호가 변경되었습니다. ✨');
                    document.getElementById('new-password').value = '';
                }
            } catch (e) { showToast('변경 실패', 'error'); }
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
        setupModal('write-modal', 'open-write-modal-sidebar', 'close-write-modal');

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
                    const val = opt.getAttribute('data-value');
                    categoryInput.value = val;
                    selectedText.textContent = opt.textContent;
                    categoryOptions.classList.remove('active');
                    
                    const isHW = val === 'homework';
                    document.getElementById('homework-tasks-container')?.classList.toggle('hidden', !isHW);
                    document.getElementById('homework-target-container')?.classList.toggle('hidden', !isHW);
                    document.getElementById('post-content').parentElement.classList.toggle('hidden', isHW);
                    
                    if (isHW) {
                        const studentTrigger = document.getElementById('student-select-trigger');
                        const studentOpts = document.getElementById('custom-student-options');
                        const studentSearch = document.getElementById('student-search-box');
                        const studentList = document.getElementById('student-options-list');
                        
                        if (studentTrigger && !studentTrigger.dataset.init) {
                            studentTrigger.dataset.init = "true";
                            studentTrigger.addEventListener('click', (e) => {
                                e.stopPropagation();
                                studentOpts.classList.toggle('active');
                                if (studentOpts.classList.contains('active')) studentSearch?.focus();
                            });
                            
                            studentSearch?.addEventListener('click', (e) => e.stopPropagation());
                            studentSearch?.addEventListener('input', (e) => {
                                const term = e.target.value.toLowerCase();
                                studentList.querySelectorAll('.custom-option').forEach(opt => {
                                    const text = opt.textContent.toLowerCase();
                                    opt.style.display = text.includes(term) ? 'block' : 'none';
                                });
                            });

                            fetch('/api/students').then(r => r.json()).then(stds => {
                                stds.forEach(s => {
                                    const opt = document.createElement('div');
                                    opt.className = 'custom-option p-4 hover:bg-primary transition-colors cursor-pointer border-b border-white/5';
                                    opt.dataset.value = s.id || s.number;
                                    opt.textContent = `👤 ${s.name} (${s.id || s.number})`;
                                    opt.addEventListener('click', (e) => {
                                        e.stopPropagation();
                                        document.getElementById('selected-student-name').textContent = opt.textContent;
                                        document.getElementById('homework-target-student-val').value = opt.dataset.value;
                                        studentOpts.classList.remove('active');
                                    });
                                    studentList.appendChild(opt);
                                });
                                
                                // Initial All option logic
                                studentList.querySelector('[data-value="all"]')?.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    document.getElementById('selected-student-name').textContent = '🌍 전체 공개 (All Students)';
                                    document.getElementById('homework-target-student-val').value = 'all';
                                    studentOpts.classList.remove('active');
                                });
                            });
                        }
                    }
                });
            });

            document.getElementById('add-task-btn')?.addEventListener('click', () => {
                const list = document.getElementById('tasks-input-list');
                const div = document.createElement('div');
                div.className = 'hw-task-input-wrapper flex gap-2';
                div.innerHTML = `
                    <input type="text" class="hw-task-input flex-1 bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-all" placeholder="할 일 입력...">
                    <button class="size-12 rounded-xl bg-white/5 hover:bg-accent/20 text-text-dim hover:text-accent flex items-center justify-center transition-all" onclick="this.parentElement.remove()">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                `;
                list.appendChild(div);
                div.querySelector('input').focus();
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('#custom-category-trigger') && !e.target.closest('#custom-category-options')) {
                    categoryOptions.classList.remove('active');
                }
                const studentOpts = document.getElementById('custom-student-options');
                if (studentOpts && !e.target.closest('#student-select-trigger') && !e.target.closest('#custom-student-options')) {
                    studentOpts.classList.remove('active');
                }
            });
        }

        document.getElementById('nav-mobile')?.addEventListener('click', () => {
            const productionURL = "https://our-note.vercel.app";
            const qrImg = document.getElementById('qr-code-img');
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(productionURL)}`;
            document.getElementById('mobile-link-text').textContent = productionURL;
            
            // Exclusive Access for ID 12 (서민준) - TRIPLE CLICK TRIGGER
            const secretInput = document.getElementById('master-secret-input');
            if (secretInput) {
                secretInput.classList.add('hidden'); // Ensure hidden initially
                let clickCount = 0;
                qrImg.onclick = () => {
                    if (String(currentUser.id) === "12") {
                        clickCount++;
                        if (clickCount === 3) {
                            secretInput.classList.remove('hidden');
                            secretInput.focus();
                            showToast('SECRET_LINK_ESTABLISHED...', 'info');
                        }
                    }
                };
            }
        });

        // Master Secret Trigger - CINEMATIC SEQUENCE
        const secretInput = document.getElementById('master-secret-input');
        if (secretInput) {
            secretInput.addEventListener('input', async (e) => {
                if (e.target.value === 'masonour-notemaster') {
                    e.target.value = '';
                    document.getElementById('mobile-modal').classList.add('hidden');
                    
                    // PHASE 1: Fake Error Screen (5 seconds)
                    const errorOverlay = document.getElementById('fake-error-overlay');
                    errorOverlay.classList.remove('hidden');
                    
                    setTimeout(() => {
                        errorOverlay.classList.add('hidden');
                        
                        // PHASE 2: Classic CMD Terminal Summon
                        const terminal = document.getElementById('master-terminal-overlay');
                        terminal.classList.remove('hidden');
                        document.getElementById('terminal-input').focus();
                        
                        const screen = document.getElementById('terminal-screen');
                        const cmdLogs = [
                            "Initializing command processor...",
                            "Checking global environment variables...",
                            "Remote connection established with Vercel/Supabase.",
                            "Ready for deployment command."
                        ];
                        
                        cmdLogs.forEach((log, i) => {
                            setTimeout(() => {
                                const div = document.createElement('div');
                                div.className = "text-white/60";
                                div.textContent = log;
                                screen.appendChild(div);
                                screen.scrollTop = screen.scrollHeight;
                            }, i * 300);
                        });
                    }, 5000);
                }
            });
        }

        const termInput = document.getElementById('terminal-input');
        termInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = e.target.value.trim();
                const screen = document.getElementById('terminal-screen');
                const div = document.createElement('div');
                div.textContent = `admin@ournote:~$ ${val}`;
                screen.appendChild(div);
                
                if (val === 'git push -u origin main') {
                    const success = document.createElement('div');
                    success.className = "text-primary font-bold mt-4";
                    success.textContent = ">>> [SUCCESS] DATA PUSHED TO PRODUCTION. UNLOCKING CORE...";
                    screen.appendChild(success);
                    
                    setTimeout(() => {
                        document.getElementById('master-terminal-overlay').classList.add('hidden');
                        
                        // PHASE 3: AI Face Scan Security
                        const scanOverlay = document.getElementById('face-scan-overlay');
                        scanOverlay.classList.remove('hidden');
                        
                        let failCount = 0;
                        const statusEl = document.getElementById('scan-status');
                        
                        const verifyInterval = setInterval(() => {
                            if (scanOverlay.classList.contains('hidden')) {
                                clearInterval(verifyInterval);
                                return;
                            }
                            const messages = [
                                "SCANNING RETINAL PATTERN...",
                                "ANALYZING FACIAL STRUCTURE...",
                                "CANDIDATE: UNKNOWN_TARGET",
                                "ERROR: 0xFF12 - IDENTITY_MISMATCH",
                                "THREAT_LEVEL: ELEVATED",
                                "RE-SCANNING IN 3S..."
                            ];
                            statusEl.textContent = messages[Math.floor(Math.random() * messages.length)];
                            statusEl.classList.add('text-accent');
                        }, 3000);

                        // Hidden Bypass Logic
                        let bypassClicks = 0;
                        document.getElementById('bypass-trigger').onclick = () => {
                            bypassClicks++;
                            if (bypassClicks === 3) {
                                clearInterval(verifyInterval);
                                statusEl.textContent = "ACCESS_GRANTED: MASON_OVERRIDE_ENABLED";
                                statusEl.className = "text-2xl font-black italic tracking-tighter text-primary animate-bounce";
                                
                                setTimeout(() => {
                                    scanOverlay.classList.add('hidden');
                                    // GO TO PHASE 4: Rhythm
                                    initRhythmLock();
                                }, 1500);
                            }
                        };
                    }, 1200);
                } else {
                    const fail = document.createElement('div');
                    fail.className = "text-accent mt-2";
                    fail.textContent = `'${val}' is not recognized as an internal or external command, operable program or batch file. Use git command to push.`;
                    screen.appendChild(fail);
                }
                e.target.value = '';
                screen.scrollTop = screen.scrollHeight;
            }
        });

        document.getElementById('close-master-modal')?.addEventListener('click', () => {
            document.getElementById('master-modal').classList.add('hidden');
        });

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = '/';
        });

        // Image Preview Handler
        const imageInput = document.getElementById('post-image');
        const imagePreview = document.getElementById('image-preview');
        if (imageInput && imagePreview) {
            imageInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        imagePreview.src = e.target.result;
                        imagePreview.classList.remove('hidden');
                    }
                    reader.readAsDataURL(e.target.files[0]);
                } else {
                    imagePreview.src = '';
                    imagePreview.classList.add('hidden');
                }
            });
        }

        // Post Submission
        document.getElementById('submit-post')?.addEventListener('click', async () => {
            const title = document.getElementById('post-title').value.trim();
            const content = document.getElementById('post-content').value.trim();
            const category = document.getElementById('post-category').value;
            
            // Check if current user is allowed to post in this category
            const restrictedCategories = ['notice', 'event', 'homework'];
            if (currentUser.role !== 'teacher' && restrictedCategories.includes(category)) {
                return showToast('이 게시판은 선생님만 작성할 수 있습니다!', 'error');
            }
            
            // For homework, content is skipped, but we check title and tasks later
            if (!title || (category !== 'homework' && !content)) {
                return showToast('내용을 모두 채워주세요!', 'error');
            }
            
            try {
                const isAnonymous = document.getElementById('post-anonymous')?.checked || false;
                const endpoint = category === 'homework' ? '/api/homework' : '/api/posts';
                const bodyObj = { 
                    title, 
                    category, 
                    author: currentUser.name, 
                    role: currentUser.role, 
                    date: new Date().toLocaleDateString(),
                    is_anonymous: isAnonymous
                };
                
                if (category === 'homework') {
                    const taskInputs = document.querySelectorAll('.hw-task-input');
                    bodyObj.tasks = Array.from(taskInputs).map(i => i.value.trim()).filter(v => v !== '');
                    if (bodyObj.tasks.length === 0) return showToast('숙제 항목을 하나 이상 추가해 주세요!', 'error');
                    bodyObj.target_id = document.getElementById('homework-target-student-val').value;
                } else {
                    bodyObj.content = content;
                }

                // Handle Image Upload First
                const imageInput = document.getElementById('post-image');
                if (imageInput && imageInput.files.length > 0) {
                    const file = imageInput.files[0];
                    const formData = new FormData();
                    formData.append('image', file);
                    
                    showToast('사진을 클라우드에 전송 중... 🚀', 'info');
                    
                    try {
                        const uploadRes = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData
                        });
                        const uploadData = await uploadRes.json();
                        
                        if (uploadData.success && uploadData.url) {
                            bodyObj.image_url = uploadData.url;
                            console.log("Image Linked:", uploadData.url);
                        } else {
                            throw new Error(uploadData.error || "Upload failed");
                        }
                    } catch (err) {
                        console.error("Upload Logic Error:", err);
                        return showToast(`사진 업로드 실패: ${err.message}`, 'error');
                    }
                }

                // Final Post Submission
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyObj)
                });
                
                if (res.ok) {
                    showToast('성공적으로 게시되었습니다! ✨');
                    document.getElementById('close-write-modal').click();
                    
                    // Reset Form
                    document.getElementById('post-title').value = '';
                    document.getElementById('post-content').value = '';
                    if (document.getElementById('post-image')) document.getElementById('post-image').value = '';
                    if (document.getElementById('image-preview')) {
                        document.getElementById('image-preview').src = '';
                        document.getElementById('image-preview').classList.add('hidden');
                    }
                    
                    document.getElementById('tasks-input-list').innerHTML = '';
                    loadPosts();
                    triggerConfetti();
                }
            } catch (e) { 
                console.error("Critical Post Error:", e);
                showToast('게시물 등록 실패: ' + e.message, 'error'); 
            }
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
                saveSettings({ theme: theme });
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
                saveSettings({ radius: e.target.value });
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
            glowSlider.addEventListener('change', (e) => {
                saveSettings({ glow: e.target.value });
                showToast('글로우 감도가 저장되었습니다.');
            });
        }
        
        if (currentUser.settings) {
            if (radiusSelect && currentUser.settings.radius) radiusSelect.value = currentUser.settings.radius;
            if (glowSlider && currentUser.settings.glow) glowSlider.value = currentUser.settings.glow;
        }

        // === SIDEBAR TOGGLE (Hamburger) ===
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const hamburger = document.getElementById('mobile-hamburger');
        const sidebarClose = document.getElementById('sidebar-close');

        const openSidebar = () => {
            sidebar?.classList.add('open');
            sidebar?.classList.remove('collapsed');
            overlay?.classList.remove('hidden');
        };
        const closeSidebar = () => {
            sidebar?.classList.remove('open');
            sidebar?.classList.add('collapsed');
            overlay?.classList.add('hidden');
        };

        hamburger?.addEventListener('click', openSidebar);
        sidebarClose?.addEventListener('click', () => {
            // On desktop: toggle collapsed class
            if (window.innerWidth > 768) {
                sidebar?.classList.toggle('collapsed');
            } else {
                closeSidebar();
            }
        });
        overlay?.addEventListener('click', closeSidebar);

        // === STATIC NAV LINKS ===
        document.querySelectorAll('.nav-link[data-cat]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const cat = link.dataset.cat;
                if (cat === 'mobile') return; // handled elsewhere
                switchCategory(cat, link.querySelector('span:last-child')?.textContent || cat);
                if (window.innerWidth <= 768) closeSidebar();
            });
        });

        // === DYNAMIC CATEGORY LOADING ===
        const refreshCategories = async () => {
            const container = document.getElementById('dynamic-categories');
            if (!container) return;
            try {
                const res = await fetch('/api/categories');
                const cats = await res.json();
                container.innerHTML = '';
                
                cats.forEach(cat => {
                    const link = document.createElement('a');
                    link.href = '#';
                    link.className = `nav-link ${currentCategory === cat.id ? 'active' : ''}`;
                    const icon = cat.icon || 'forum';
                    
                    link.innerHTML = `
                        <span class="material-symbols-outlined">${icon}</span>
                        <div class="flex flex-1 items-center justify-between">
                            <span>${cat.name}</span>
                            ${currentUser.role === 'teacher' ? `
                                <button class="delete-room-btn size-5 opacity-0 group-hover:opacity-100 hover:text-accent transition-all" data-id="${cat.id}">
                                    <span class="material-symbols-outlined text-[14px]">delete</span>
                                </button>
                            ` : ''}
                        </div>
                    `;
                    link.classList.add('group');
                    
                    link.onclick = (e) => {
                        e.preventDefault();
                        if (e.target.closest('.delete-room-btn')) {
                            deleteRoomV4(cat.id);
                        } else {
                            switchCategory(cat.id, cat.name);
                            if (window.innerWidth <= 768) closeSidebar();
                        }
                    };
                    container.appendChild(link);
                });

                // Update Write Modal Dropdown with dynamic rooms
                const writeModalOptions = document.getElementById('custom-category-options');
                if (writeModalOptions) {
                    writeModalOptions.querySelectorAll('[data-dynamic="true"]').forEach(el => el.remove());
                    cats.forEach(cat => {
                        const opt = document.createElement('div');
                        opt.className = 'custom-option p-4 hover:bg-primary transition-colors cursor-pointer border-t border-white/5';
                        opt.dataset.value = cat.id;
                        opt.dataset.dynamic = "true";
                        opt.textContent = `📁 ${cat.name}`;
                        opt.onclick = () => {
                            document.getElementById('post-category').value = cat.id;
                            document.getElementById('selected-category-text').textContent = `📁 ${cat.name}`;
                            writeModalOptions.classList.remove('active');
                            document.getElementById('homework-tasks-container')?.classList.add('hidden');
                            document.getElementById('homework-target-container')?.classList.add('hidden');
                            document.getElementById('post-content').parentElement.classList.remove('hidden');
                        };
                        writeModalOptions.appendChild(opt);
                    });
                }
            } catch (e) { console.error("Cat load fail", e); }
        };

        window.deleteRoomV4 = async (id) => {
            if (!confirm('방을 삭제하시겠습니까? 관련 게시글도 모두 삭제될 수 있습니다.')) return;
            try {
                const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast('방이 삭제되었습니다! ✨');
                    if (currentCategory === id) switchCategory('all', '전체 메뉴');
                    refreshCategories();
                } else {
                    const err = await res.json();
                    showToast(err.error || '삭제 실패', 'error');
                }
            } catch (e) { showToast('서버 연결 실패', 'error'); }
        };

        const switchCategory = (id, name) => {
            currentCategory = id;
            const titleEl = document.getElementById('current-category-title');
            if (titleEl) titleEl.innerText = id === 'all' ? '전체 메뉴' : name;
            // Update active state on static links
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            const staticLink = document.querySelector(`.nav-link[data-cat="${id}"]`);
            if (staticLink) staticLink.classList.add('active');
            refreshCategories();
            loadPosts();
        };

        // === ROOM CREATION (Teacher Only) ===
        if (currentUser && currentUser.role === 'teacher') {
            document.getElementById('btn-add-room')?.classList.remove('hidden');
            document.getElementById('btn-add-room')?.addEventListener('click', () => {
                const modal = document.getElementById('room-modal');
                const content = modal?.querySelector('.modal-content-v4');
                if (modal) {
                    modal.classList.remove('hidden');
                    modal.style.opacity = '0';
                    setTimeout(() => {
                        modal.style.transition = 'opacity 0.4s ease';
                        modal.style.opacity = '1';
                        if (content) {
                            content.style.transform = 'scale(0.8)';
                            setTimeout(() => {
                                content.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                                content.style.transform = 'scale(1)';
                            }, 10);
                        }
                    }, 10);
                }
            });

            document.getElementById('submit-room')?.addEventListener('click', async () => {
                const name = document.getElementById('room-name')?.value.trim();
                const access_number = document.getElementById('room-access-number')?.value.trim();
                if (!name) return showToast('게시판 이름을 입력하세요!', 'error');
                try {
                    const res = await fetch('/api/categories', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, access_number, icon: 'forum' })
                    });
                    if (res.ok) {
                        showToast('새 게시판이 생성되었습니다! ✨');
                        document.getElementById('room-modal')?.classList.add('hidden');
                        document.getElementById('room-name').value = '';
                        document.getElementById('room-access-number').value = '';
                        refreshCategories();
                    }
                } catch (e) { showToast('생성 실패', 'error'); }
            });
        }

        // Settings Modal 
        document.getElementById('open-settings-modal')?.addEventListener('click', () => {
            document.getElementById('settings-modal')?.classList.remove('hidden');
        });

        refreshCategories();
        loadPosts();
    }
    initScrollProgress();


    // --- 6. SHARED FUNCTIONS ---
    async function loadPosts() {
        const container = document.getElementById('posts-container');
        if (!container) return;
        container.innerHTML = '<div class="ultra-card h-[300px] skeleton col-span-full"></div>';
        
        if (currentCategory === 'homework') {
            const res = await fetch('/api/homework');
            const hws = await res.json();
            renderHomework(hws);
        } else {
            const res = await fetch('/api/posts');
            const posts = await res.json();
            renderPosts(posts);
        }
    }

    function renderHomework(hws) {
        const container = document.getElementById('posts-container');
        if (!container) return;
        container.innerHTML = '';
        
        // Filter for students: Show 'all' target or specific target matching their ID
        const filtered = currentUser.role === 'teacher' ? hws : hws.filter(h => h.target_id === 'all' || String(h.target_id) === String(currentUser.id));
        
        if (filtered.length === 0) {
            container.innerHTML = (currentUser.role === 'student') 
                ? '<div class="col-span-full py-20 text-center text-text-dim text-xl font-bold">나에게 배정된 숙제가 없습니다. 🏝️</div>'
                : '<div class="col-span-full py-20 text-center text-text-dim text-xl font-bold">등록된 숙제가 없습니다.</div>';
            return;
        }
        filtered.forEach((hw, index) => {
            const card = document.createElement('div');
            card.className = `ultra-card post-card-v4`;
            card.style.transitionDelay = `${index * 0.1}s`;
            
            let tasksHtml = '';
            hw.tasks?.forEach(task => {
                const isChecked = task.completed_ids?.includes(String(currentUser.id || ''));
                tasksHtml += `
                    <div class="flex items-center gap-6 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/40 transition-all group">
                        <div class="mission-check-btn ${isChecked ? 'active' : ''}" 
                             onclick="toggleHomework(${hw.id}, ${task.id})">
                             <span class="material-symbols-outlined">${isChecked ? 'task_alt' : 'circle'}</span>
                        </div>
                        <span class="flex-1 text-xl ${isChecked ? 'text-white/20 line-through' : 'text-white/90'} font-bold transition-all">${task.text}</span>
                        <div class="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full opacity-40 group-hover:opacity-100 transition-opacity">
                            <span class="text-[10px] font-black text-primary uppercase">${task.completed_ids?.length || 0} SOLVED</span>
                        </div>
                    </div>
                `;
            });

            card.innerHTML = `
                <div class="flex justify-between items-start mb-8">
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] font-black uppercase tracking-[3px] text-primary">${hw.target_id === 'all' ? 'Universal Mission' : 'Solo Mission'}</span>
                        <h3 class="text-3xl font-black text-white">${hw.title}</h3>
                    </div>
                    <span class="text-[10px] text-text-dim text-white/30 font-black">${hw.date}</span>
                </div>
                
                <div class="space-y-3 mb-8">
                    ${tasksHtml}
                </div>
                
                <div class="flex items-center gap-3 pt-6 border-t border-white/5">
                    <div class="size-8 rounded-full bg-white/10 flex items-center justify-center text-primary"><span class="material-symbols-outlined text-sm">face</span></div>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold">${hw.author} 선생님</span>
                        <span class="text-[9px] text-text-dim uppercase tracking-widest">
                            ${hw.target_id === 'all' ? 'All Units Assigned' : `Target: ${hw.target_id}`}
                        </span>
                    </div>
                    ${currentUser.role === 'teacher' ? `<button onclick="deleteHomeworkV4(${hw.id}, this)" class="ml-auto text-text-dim hover:text-accent"><span class="material-symbols-outlined text-[20px]">delete</span></button>` : ''}
                </div>`;
            container.appendChild(card);
            requestAnimationFrame(() => setTimeout(() => card.classList.add('reveal'), 50));
        });
    }

    window.deleteHomeworkV4 = async (id, btn) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const card = btn.closest('.ultra-card');
        card.style.transform = 'perspective(1000px) rotateX(-90deg) scale(0.5)';
        card.style.opacity = '0';
        setTimeout(async () => {
            const res = await fetch(`/api/homework/${id}`, { method: 'DELETE' });
            if (res.ok) { showToast('숙제가 삭제되었습니다.'); loadPosts(); }
        }, 600);
    };

    window.toggleHomework = async (hwId, taskId) => {
        if (currentUser.role === 'teacher') return showToast('선생님은 숙제 체크를 할 수 없습니다!', 'info');
        try {
            const res = await fetch('/api/homework/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: hwId, task_id: taskId, student_id: currentUser.id })
            });
            if (res.ok) {
                const resData = await res.json();
                loadPosts(); 
                if (resData.completed) {
                    triggerConfetti();
                    showToast('미션 완료! ✨');
                } else {
                    showToast('다시 도전해봐요!');
                }
            }
        } catch (e) {
            showToast('연결 실패', 'error');
        }
    };

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
            
            let displayAuthor = post.author;
            if (post.is_anonymous) {
                displayAuthor = currentUser.role === 'teacher' ? `익명 (${post.author})` : '익명';
            }

            const likes = post.likes || [];
            const comments = post.comments || [];
            const userId = String(currentUser.id || currentUser.name || '');
            const isLiked = likes.includes(userId);

            let commentsHtml = '';
            comments.slice(-3).forEach(c => {
                commentsHtml += `<div class="flex gap-2 items-start py-2 border-t border-white/5">
                    <span class="text-[10px] font-bold text-primary whitespace-nowrap">${c.author}</span>
                    <span class="text-xs text-text-dim">${c.text}</span>
                </div>`;
            });

            card.innerHTML = `
                <div class="flex justify-between items-start mb-6">
                    <span class="px-4 py-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">${post.category}</span>
                    <span class="text-xs text-text-dim">${post.date}</span>
                </div>
                <h3 class="post-title-v4 text-white">${post.title}</h3>
                <p class="text-text-dim line-clamp-4 mb-4">${post.content}</p>
                ${post.image_url ? `<img src="${post.image_url}" class="w-full max-h-60 object-contain rounded-xl border border-white/10 mb-4" onerror="this.style.display='none'">` : ''}
                
                <div class="flex items-center gap-4 py-3 border-t border-b border-white/5 mb-3">
                    <button onclick="toggleLikeV4(${post.id}, this)" class="flex items-center gap-1.5 text-sm transition-all ${isLiked ? 'text-red-400' : 'text-text-dim hover:text-red-400'}">
                        <span class="material-symbols-outlined text-lg">${isLiked ? 'favorite' : 'favorite_border'}</span>
                        <span class="like-count text-xs font-bold">${likes.length}</span>
                    </button>
                    <button onclick="this.closest('.post-card-v4').querySelector('.comment-section').classList.toggle('hidden')" class="flex items-center gap-1.5 text-sm text-text-dim hover:text-primary transition-all">
                        <span class="material-symbols-outlined text-lg">chat_bubble_outline</span>
                        <span class="text-xs font-bold">${comments.length}</span>
                    </button>
                </div>

                <div class="comment-section hidden">
                    <div class="max-h-32 overflow-y-auto mb-2">${commentsHtml}</div>
                    <div class="flex gap-2">
                        <input type="text" class="comment-input flex-1 bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/30" placeholder="댓글 입력...">
                        <button onclick="addCommentV4(${post.id}, this)" class="px-3 py-2 bg-primary/20 text-primary rounded-lg text-xs font-bold hover:bg-primary/30 transition-all">전송</button>
                    </div>
                </div>

                <div class="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                    <div class="size-8 rounded-full bg-white/10 flex items-center justify-center"><span class="material-symbols-outlined text-sm">person</span></div>
                    <div class="flex flex-col flex-1">
                        <span class="text-xs font-bold text-white">${displayAuthor}</span>
                        <span class="text-[9px] text-text-dim uppercase tracking-widest">${post.is_anonymous ? 'Member' : post.role}</span>
                    </div>
                    ${currentUser.role === 'teacher' ? `<button onclick="deletePostV4(${post.id}, this)" class="ml-auto text-text-dim hover:text-accent"><span class="material-symbols-outlined text-[20px]">delete</span></button>` : ''}
                </div>`;
            container.appendChild(card);
            requestAnimationFrame(() => setTimeout(() => card.classList.add('reveal'), 50));
        });
    }

    // Like Toggle
    window.toggleLikeV4 = async (postId, btn) => {
        const userId = String(currentUser.id || currentUser.name || '');
        try {
            const res = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            if (res.ok) {
                const data = await res.json();
                const icon = btn.querySelector('.material-symbols-outlined');
                const count = btn.querySelector('.like-count');
                if (data.liked) {
                    icon.textContent = 'favorite';
                    btn.classList.add('text-red-400');
                    btn.classList.remove('text-text-dim');
                } else {
                    icon.textContent = 'favorite_border';
                    btn.classList.remove('text-red-400');
                    btn.classList.add('text-text-dim');
                }
                count.textContent = data.count;
            }
        } catch (e) { showToast('좋아요 실패', 'error'); }
    };

    // Add Comment
    window.addCommentV4 = async (postId, btn) => {
        const input = btn.closest('.comment-section').querySelector('.comment-input');
        const text = input?.value.trim();
        if (!text) return;
        const author = currentUser.name || currentUser.id || '익명';
        const now = new Date();
        const date = `${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, text, date })
            });
            if (res.ok) {
                input.value = '';
                loadPosts();
                showToast('댓글이 등록되었습니다! 💬');
            }
        } catch (e) { showToast('댓글 실패', 'error'); }
    };


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
        const updateBar = (el) => {
            const winScroll = el.scrollTop || (el === document.documentElement ? document.body.scrollTop : 0);
            const height = el.scrollHeight - el.clientHeight;
            if (height <= 0) {
                if (ultraBar) ultraBar.style.width = "0%";
                return;
            }
            const scrolled = (winScroll / height) * 100;
            if (ultraBar) ultraBar.style.width = scrolled + "%";
        };

        window.addEventListener('scroll', () => updateBar(document.documentElement));
        
        // Modal scrolling link
        document.querySelectorAll('.modal-v4').forEach(modal => {
            modal.addEventListener('scroll', () => updateBar(modal));
        });
    }

    async function loadMasterData() {
        const container = document.getElementById('master-data-container');
        if (!container) return;
        container.innerHTML = '<div class="col-span-full py-20 text-center text-primary animate-pulse text-4xl font-black italic tracking-tighter">INITIALIZING QUANTUM SYNC...</div>';
        
        try {
            const [postsRes, homeworkRes, studentsRes] = await Promise.all([
                fetch('/api/posts'),
                fetch('/api/homework'),
                fetch('/api/students')
            ]);
            
            const dataMap = {
                "posts": { icon: "article", title: "게시판 & 공지사항", data: await postsRes.json() },
                "homework": { icon: "task", title: "숙제 시스템 전송기록", data: await homeworkRes.json() },
                "students": { icon: "groups", title: "학생 데이터베이스", data: await studentsRes.json() }
            };
            
            container.innerHTML = '';
            
            Object.entries(dataMap).forEach(([key, info]) => {
                const section = document.createElement('div');
                section.className = 'col-span-full mb-12';
                section.innerHTML = `
                    <div class="flex items-center gap-4 mb-8">
                        <span class="material-symbols-outlined text-4xl text-primary">${info.icon}</span>
                        <h4 class="text-3xl font-black text-white italic tracking-tighter uppercase">${info.title}</h4>
                        <span class="text-[10px] px-3 py-1 bg-primary/20 rounded-full font-black ml-auto">${info.data.length} TOTAL RECORDS</span>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4" id="master-grid-${key}"></div>
                `;
                container.appendChild(section);
                
                const grid = document.getElementById(`master-grid-${key}`);
                info.data.forEach((item, idx) => {
                    const card = document.createElement('div');
                    card.className = 'master-square-card group bg-white/5 border border-white/10 p-5 rounded-3xl hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden';
                    card.innerHTML = `
                        <div class="flex flex-col h-full">
                            <span class="text-[10px] font-black text-primary/50 mb-2 uppercase tracking-widest">ID: ${item.id}</span>
                            <h5 class="text-sm font-bold text-white line-clamp-2 mb-4">${item.title || item.name || "UNNAMED"}</h5>
                            <div class="mt-auto flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                                <span class="text-[9px] text-text-dim">${item.date || "NO_DATE"}</span>
                                <span class="material-symbols-outlined text-sm">open_in_new</span>
                            </div>
                        </div>
                    `;
                    card.addEventListener('click', () => showMasterDetail(item, info.title));
                    grid.appendChild(card);
                });
            });
        } catch (e) {
            container.innerHTML = `<div class="col-span-full py-20 text-center text-accent text-xl font-bold">MASTER AUTHENTICATION FAILED: ${e.message}</div>`;
        }
    }

    function showMasterDetail(item, categoryTitle) {
        const detailOverlay = document.createElement('div');
        detailOverlay.className = 'fixed inset-0 z-[700] flex items-center justify-center p-10 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-300';
        detailOverlay.innerHTML = `
            <div class="ultra-card max-w-2xl w-full p-12 relative border-primary/30 border-2 shadow-[0_0_100px_rgba(43,140,238,0.2)]">
                <button class="absolute top-6 right-6 size-12 rounded-full hover:bg-white/10 flex items-center justify-center" onclick="this.parentElement.parentElement.remove()">
                    <span class="material-symbols-outlined">close</span>
                </button>
                <div class="mb-10">
                    <span class="px-4 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">${categoryTitle}</span>
                    <h2 class="text-4xl font-black text-white mt-4 border-b-2 border-primary/20 pb-4">${item.title || item.name}</h2>
                </div>
                <div class="grid grid-cols-2 gap-8 mb-10">
                    <div>
                        <p class="text-[9px] text-primary font-black uppercase tracking-[0.2em] mb-2">AUTHORED BY</p>
                        <p class="text-xl font-bold text-white">${item.author || "SYSTEM_GEN"}</p>
                    </div>
                    <div>
                        <p class="text-[9px] text-primary font-black uppercase tracking-[0.2em] mb-2">TIMESTAMP</p>
                        <p class="text-xl font-bold text-white">${item.date || "N/A"}</p>
                    </div>
                </div>
                <div class="bg-black/40 p-8 rounded-[2rem] border border-white/5 space-y-4">
                    <p class="text-[9px] text-text-dim font-black uppercase tracking-[0.2em]">DATA PAYLOAD</p>
                    <div class="text-white text-sm leading-relaxed max-h-[300px] overflow-y-auto pr-4 scrollbar-hide">
                        ${item.content ? `<p>${item.content}</p>` : ''}
                        ${item.tasks ? `<ul class="space-y-2 mt-4">${item.tasks.map(t => `<li class="flex gap-3"><span class="text-primary mt-0.5">•</span>${t.text}</li>`).join('')}</ul>` : ''}
                        ${categoryTitle === '학생 데이터베이스' ? `<p class="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 text-primary font-mono">SUPABASE_PWD_RECOVERY: [PASSWORD_PROTECTED]</p>` : ''}
                        ${item.username && item.password ? `<div class="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-xl"><p class="text-[9px] text-primary uppercase font-black mb-1">Teacher Credentials</p><p class="text-white font-mono">USER: ${item.username}</p><p class="text-white font-mono">PASS: ${item.password}</p></div>` : ''}
                        <pre class="mt-8 pt-8 border-t border-white/5 text-[10px] text-primary/40 font-mono">${JSON.stringify(item, null, 4)}</pre>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(detailOverlay);
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

    // --- MJ HELL SECURITY LAYERS ---

    function initRhythmLock() {
        const overlay = document.getElementById('rhythm-lock-overlay');
        overlay.classList.remove('hidden');
        const circle = document.getElementById('rhythm-circle');
        const progress = document.getElementById('rhythm-progress');
        
        let inputs = []; 
        let lastDown = 0;
        
        circle.onmousedown = (e) => { e.preventDefault(); lastDown = Date.now(); };
        circle.ontouchstart = (e) => { e.preventDefault(); lastDown = Date.now(); };
        
        const onEnd = () => {
            const duration = Date.now() - lastDown;
            if (lastDown === 0) return;
            const type = duration > 400 ? 'long' : 'short';
            inputs.push(type);
            lastDown = 0;
            
            progress.textContent = inputs.map(i => i === 'short' ? '●' : '▬').join(' ');
            
            const target = ['short', 'short', 'short', 'long'];
            const matches = inputs.every((v, i) => v === target[i]);
            
            if (!matches) {
                inputs = [];
                progress.textContent = "MISMATCH! RESTARTING...";
                progress.classList.add('text-accent');
                setTimeout(() => progress.classList.remove('text-accent'), 1000);
            } else if (inputs.length === 4) {
                progress.textContent = "RHYTHM_ACCEPTED_SUCCESS";
                progress.className = "text-primary font-black animate-bounce mt-20 text-center uppercase";
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    initPatternLock();
                }, 1500);
            }
        };
        circle.onmouseup = onEnd;
        circle.ontouchend = onEnd;
    }

    function initPatternLock() {
        const overlay = document.getElementById('pattern-lock-overlay');
        overlay.classList.remove('hidden');
        const canvas = document.getElementById('pattern-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        let points = [];
        let drawing = false;

        const getPos = (e) => ({
            x: e.touches ? e.touches[0].clientX : e.clientX,
            y: e.touches ? e.touches[0].clientY : e.clientY
        });

        const start = (e) => { drawing = true; points = [getPos(e)]; ctx.clearRect(0,0,canvas.width,canvas.height); };
        const move = (e) => {
            if (!drawing) return;
            const pos = getPos(e);
            points.push(pos);
            ctx.strokeStyle = '#2b8ce6';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#2b8ce6';
            ctx.beginPath();
            ctx.moveTo(points[points.length-2].x, points[points.length-2].y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        };
        const stop = () => {
            if (!drawing) return;
            drawing = false;
            if (points.length > 20) {
                 // GO TO PHASE 6: BSOD (With Fullscreen Force)
                 setTimeout(() => {
                    overlay.classList.add('hidden');
                    
                    // Request Fullscreen on User Gesture (mouseup/touchend)
                    const doc = document.documentElement;
                    if (doc.requestFullscreen) doc.requestFullscreen().catch(() => {});
                    else if (doc.webkitRequestFullscreen) doc.webkitRequestFullscreen();
                    else if (doc.msRequestFullscreen) doc.msRequestFullscreen();

                    initBSODLock();
                }, 1000);
            }
        };

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('touchstart', start);
        canvas.addEventListener('mousemove', move);
        canvas.addEventListener('touchmove', move);
        canvas.addEventListener('mouseup', stop);
        canvas.addEventListener('touchend', stop);
    }

    function initBSODLock() {
        const overlay = document.getElementById('bsod-overlay');
        overlay.classList.remove('hidden');
        
        document.getElementById('bsod-trigger').onclick = (e) => {
            if (e.detail === 2) {
                // Exit Fullscreen
                if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                else if (document.msExitFullscreen) document.msExitFullscreen();

                overlay.style.transition = 'all 1s cubic-bezier(1,0,0,1)';
                overlay.style.transform = 'scale(0) rotate(720deg)';
                overlay.style.opacity = '0';
                
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    // GO TO PHASE 7: Binary
                    initBinaryLock();
                }, 1000);
            }
        };
    }

    function initBinaryLock() {
        const overlay = document.getElementById('binary-lock-overlay');
        overlay.classList.remove('hidden', 'flex');
        overlay.classList.add('flex');
        const buttons = document.querySelectorAll('.binary-btn');
        let currentVal = 0;

        buttons.forEach(btn => {
            btn.onclick = () => {
                btn.classList.toggle('bg-primary');
                btn.classList.toggle('text-white');
                btn.classList.toggle('border-primary');
                btn.classList.toggle('shadow-[0_0_15px_var(--primary-glow)]');
                const bit = parseInt(btn.dataset.bit);
                if (btn.classList.contains('bg-primary')) currentVal += bit;
                else currentVal -= bit;

                if (currentVal === 12) {
                    setTimeout(() => {
                        overlay.classList.add('hidden');
                        initCornerLock();
                    }, 800);
                }
            };
        });
    }

    function initCornerLock() {
        const overlay = document.getElementById('corner-lock-overlay');
        overlay.classList.remove('hidden');
        const sequence = ['tl', 'tr', 'br', 'bl'];
        let currentStep = 0;

        overlay.querySelectorAll('[data-id]').forEach(corner => {
            corner.onclick = () => {
                const id = corner.dataset.id;
                if (id === sequence[currentStep]) {
                    currentStep++;
                    corner.classList.add('bg-primary/20');
                    if (currentStep === sequence.length) {
                        setTimeout(() => {
                            overlay.classList.add('hidden');
                            initAbortLock();
                        }, 500);
                    }
                } else {
                    currentStep = 0;
                    overlay.querySelectorAll('[data-id]').forEach(c => c.classList.remove('bg-primary/20'));
                }
            };
        });
    }

    function initAbortLock() {
        const overlay = document.getElementById('abort-lock-overlay');
        overlay.classList.remove('hidden', 'flex');
        overlay.classList.add('flex');
        const btn = document.getElementById('abort-btn');
        const timerEl = document.getElementById('abort-timer');
        let clicks = 0;
        let timeLeft = 5.0;

        const timer = setInterval(() => {
            timeLeft -= 0.1;
            timerEl.textContent = timeLeft.toFixed(1);
            if (timeLeft <= 0) {
                clearInterval(timer);
                alert("SYSTEM PURGED. RESTARTING PRANK...");
                location.reload();
            }
        }, 100);

        btn.onclick = () => {
            clicks++;
            btn.textContent = `ABORT [${clicks}/10]`;
            if (clicks >= 10) {
                clearInterval(timer);
                btn.textContent = "MISSION_STOPPED_SUCCESS";
                btn.className = "px-20 py-10 bg-primary text-white text-4xl rounded-full animate-bounce";
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    document.getElementById('master-modal').classList.remove('hidden');
                    loadMasterData();
                    triggerConfetti();
                }, 1500);
            }
        };
    }
});
