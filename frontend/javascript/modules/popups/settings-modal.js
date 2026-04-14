import { state, showToast } from '../common.js';

export function initSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    // ── 학생 비번 목록 로드 ──
    const loadStudentPins = async () => {
        const container = document.getElementById('student-pin-list');
        if (!container) return;
        try {
            const res = await fetch('/api/students');
            const students = await res.json();
            container.innerHTML = students.map(s => `
                <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div class="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm flex-shrink-0">
                        ${s.id}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-text-main text-sm truncate">${s.name}</p>
                    </div>
                    <input type="text" value="${s.pin || ''}" maxlength="8"
                        class="w-24 text-center font-mono font-bold text-sm border border-slate-200 bg-white rounded-xl px-2 py-2 focus:outline-none focus:border-primary transition-all"
                        data-student-id="${s.id}" placeholder="비번">
                    <button onclick="window.saveStudentPin('${s.id}', this)" 
                        class="size-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-all flex-shrink-0">
                        <span class="material-symbols-outlined text-[16px]">save</span>
                    </button>
                </div>
            `).join('');
        } catch (e) {
            container.innerHTML = '<p class="col-span-full text-center text-red-400 text-sm py-6">학생 목록을 불러올 수 없습니다.</p>';
        }
    };

    window.saveStudentPin = async (studentId, btn) => {
        const input = btn.closest('div').querySelector('input[data-student-id]');
        const newPin = input?.value.trim();
        if (!newPin) { showToast('비밀번호를 입력해주세요.', 'error'); return; }
        
        btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">sync</span>';
        try {
            const res = await fetch('/api/students/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: studentId, new_pin: newPin })
            });
            if (res.ok) {
                showToast(`✅ ${studentId}번 비밀번호가 변경되었습니다.`);
                btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span>';
                setTimeout(() => { btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">save</span>'; }, 1500);
            } else {
                showToast('변경에 실패했습니다.', 'error');
                btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">save</span>';
            }
        } catch {
            showToast('서버 오류입니다.', 'error');
            btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">save</span>';
        }
    };

    // Section Switching Logic (defined first so openSettings can use it)
    const switchTab = (tabName) => {
        modal.querySelectorAll('.settings-pane').forEach(el => el.classList.add('hidden'));
        modal.querySelectorAll('.settings-tab').forEach(el => el.classList.remove('active', 'bg-white/10'));

        const targetPane = modal.querySelector(`#tab-${tabName}`);
        if (targetPane) targetPane.classList.remove('hidden');

        const activeBtn = modal.querySelector(`.settings-tab[data-tab="${tabName}"]`);
        if (activeBtn) activeBtn.classList.add('active', 'bg-white/10');

        // 보안 탭 열릴 때 학생 목록 자동 로드
        if (tabName === 'security' && state.currentUser?.role === 'teacher') {
            loadStudentPins();
        }
    };

    // 전역 함수로 등록
    window.openSettings = () => {
        const isTeacher = state.currentUser?.role === 'teacher';
        const securityTab = modal.querySelector('.settings-tab[data-tab="security"]');
        if (securityTab) securityTab.style.display = isTeacher ? 'flex' : 'none';

        switchTab('visual');

        // ── 모달 컨테이너를 직접 스타일로 표시 (CSS 클래스 의존 없음) ──
        modal.classList.remove('hidden');
        modal.style.cssText = `
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: fixed !important;
            inset: 0 !important;
            z-index: 100000 !important;
            background: rgba(0,0,0,0.85) !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
        `;

        const content = modal.querySelector('.modal-v4');
        if (content) {
            // 항상 라이트 테마 강제 (다크모드 간섭 차단)
            content.style.cssText = `
                display: flex !important;
                flex-direction: column !important;
                width: 94vw !important;
                max-width: 1024px !important;
                height: 88vh !important;
                background: #ffffff !important;
                color: #0f172a !important;
                border-radius: 2rem !important;
                overflow: hidden !important;
                box-shadow: 0 32px 80px -12px rgba(0,0,0,0.6) !important;
                position: relative !important;
                z-index: 1 !important;
                opacity: 0;
                transform: translateY(36px) scale(0.97);
                transition: opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1);
            `;
        }

        // 두 프레임 후 애니메이션 시작 (확실한 트랜지션 촉발)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (content) {
                    content.style.opacity = '1';
                    content.style.transform = 'translateY(0) scale(1)';
                }
            });
        });
    };

    const closeHandler = () => {
        const content = modal.querySelector('.modal-v4');
        if (content) {
            content.style.opacity = '0';
            content.style.transform = 'translateY(32px) scale(0.97)';
        }
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.cssText = '';
            if (content) content.style.cssText = '';
        }, 420);
    };

    document.getElementById('close-settings-modal')?.addEventListener('click', closeHandler);
    modal.querySelector('.modal-overlay')?.addEventListener('click', closeHandler);

    modal.querySelectorAll('.settings-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.currentTarget.getAttribute('data-tab'));
        });
    });

    // Theme Switching
    const updateThemeUI = (theme) => {
        const isDark = theme === 'dark';
        document.querySelectorAll('.theme-option').forEach(el => {
            if (el.getAttribute('data-theme') === theme) {
                el.classList.add('active', 'ring-2', 'ring-primary');
            } else {
                el.classList.remove('active', 'ring-2', 'ring-primary');
            }
        });
        if (isDark) {
            document.body.classList.add('dark-mode', 'dark');
            document.documentElement.classList.add('dark-mode', 'dark');
        } else {
            document.body.classList.remove('dark-mode', 'dark');
            document.documentElement.classList.remove('dark-mode', 'dark');
        }
        localStorage.setItem('ournote_theme', theme);
    };

    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            updateThemeUI(e.currentTarget.getAttribute('data-theme'));
        });
    });

    const savedTheme = localStorage.getItem('ournote_theme') || 'white';
    updateThemeUI(savedTheme);
}
