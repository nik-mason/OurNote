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
        if (securityTab) {
            securityTab.style.display = isTeacher ? 'flex' : 'none';
        }

        switchTab('visual');
        modal.classList.remove('hidden');

        const overlay = modal.querySelector('.modal-overlay');
        const content = modal.querySelector('.modal-v4');

        // 초기 상태 설정 (invisible)
        if (content) {
            content.style.opacity = '0';
            content.style.transform = 'translateY(40px) scale(0.96)';
            content.style.transition = 'opacity 0.45s cubic-bezier(0.16,1,0.3,1), transform 0.45s cubic-bezier(0.16,1,0.3,1)';
        }

        // double rAF: 첫 프레임에서 DOM 반영, 두 번째 프레임에서 애니메이션 시작 (확실한 방법)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (overlay) overlay.style.opacity = '1';
                if (content) {
                    content.style.opacity = '1';
                    content.style.transform = 'translateY(0) scale(1)';
                }
            });
        });
    };

    const closeHandler = () => {
        const overlay = modal.querySelector('.modal-overlay');
        const content = modal.querySelector('.modal-v4');

        if (content) {
            content.style.opacity = '0';
            content.style.transform = 'translateY(30px) scale(0.97)';
        }
        if (overlay) overlay.style.opacity = '0';

        setTimeout(() => {
            modal.classList.add('hidden');
            // 인라인 스타일 초기화 (다음 열기 준비)
            if (content) content.style.cssText = '';
        }, 480);
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
