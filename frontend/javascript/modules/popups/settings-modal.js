import { state, showToast } from '../common.js';

export function initSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    const fullscreen = modal.querySelector('.settings-fullscreen');
    const overlay = document.getElementById('close-settings-overlay');

    // ─── Theme state ───
    let teacherPwVisible = false;
    let teacherData = null;

    // ─── Theme switching ───
    const updateThemeUI = (theme) => {
        const isDark = theme === 'dark';
        const checkLight = document.getElementById('check-light');
        const checkDark = document.getElementById('check-dark');
        const btnLight = document.getElementById('theme-light-btn');
        const btnDark = document.getElementById('theme-dark-btn');

        if (isDark) {
            document.body.classList.add('dark-mode', 'dark');
            document.documentElement.classList.add('dark-mode', 'dark');
            if (checkLight) checkLight.classList.add('hidden');
            if (checkDark) { checkDark.classList.remove('hidden'); checkDark.style.display = 'flex'; }
            if (btnLight) { btnLight.classList.remove('border-primary'); btnLight.classList.add('border-slate-200'); }
            if (btnDark) { btnDark.classList.remove('border-slate-200'); btnDark.classList.add('border-primary'); }
        } else {
            document.body.classList.remove('dark-mode', 'dark');
            document.documentElement.classList.remove('dark-mode', 'dark');
            if (checkLight) { checkLight.classList.remove('hidden'); checkLight.style.display = 'flex'; }
            if (checkDark) checkDark.classList.add('hidden');
            if (btnLight) { btnLight.classList.remove('border-slate-200'); btnLight.classList.add('border-primary'); }
            if (btnDark) { btnDark.classList.remove('border-primary'); btnDark.classList.add('border-slate-200'); }
        }
        localStorage.setItem('ournote_theme', theme);
    };

    document.getElementById('theme-light-btn')?.addEventListener('click', () => updateThemeUI('white'));
    document.getElementById('theme-dark-btn')?.addEventListener('click', () => updateThemeUI('dark'));

    // Initialize theme from saved state
    const savedTheme = localStorage.getItem('ournote_theme') || 'white';
    updateThemeUI(savedTheme);

    // ─── Student PIN change logic ───
    document.getElementById('save-pin-btn')?.addEventListener('click', async () => {
        const currentPin = document.getElementById('pin-current')?.value.trim();
        const newPin = document.getElementById('pin-new')?.value.trim();
        const confirmPin = document.getElementById('pin-confirm')?.value.trim();

        if (!currentPin || !newPin || !confirmPin) {
            showToast('모든 항목을 입력해주세요.', 'error');
            return;
        }
        if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
            showToast('새 PIN은 6자리 숫자여야 합니다.', 'error');
            return;
        }
        if (newPin !== confirmPin) {
            showToast('새 PIN이 일치하지 않습니다.', 'error');
            return;
        }

        // Verify current PIN
        const userPin = state.currentUser?.pin || '000000';
        if (currentPin !== userPin) {
            showToast('현재 PIN이 올바르지 않습니다.', 'error');
            return;
        }

        const btn = document.getElementById('save-pin-btn');
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">sync</span> 변경 중...';

        try {
            const res = await fetch('/api/students/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: state.currentUser.id, new_pin: newPin })
            });

            if (res.ok) {
                // Update local state
                state.currentUser.pin = newPin;
                localStorage.setItem('currentUser', JSON.stringify(state.currentUser));

                showToast('✅ PIN이 성공적으로 변경되었습니다!');
                document.getElementById('pin-current').value = '';
                document.getElementById('pin-new').value = '';
                document.getElementById('pin-confirm').value = '';
            } else {
                showToast('PIN 변경에 실패했습니다.', 'error');
            }
        } catch {
            showToast('서버 오류입니다.', 'error');
        }

        btn.innerHTML = '<span class="material-symbols-outlined text-lg">check_circle</span> PIN 변경하기';
    });

    // ─── Teacher: load own password ───
    const loadTeacherPassword = async () => {
        try {
            const res = await fetch('/api/teacher');
            teacherData = await res.json();
            const idEl = document.getElementById('teacher-id-display');
            if (idEl) idEl.textContent = teacherData.username || '-';
            // Initially hidden
            const pwEl = document.getElementById('teacher-pw-display');
            if (pwEl) pwEl.textContent = '••••••••';
        } catch {
            const idEl = document.getElementById('teacher-id-display');
            if (idEl) idEl.textContent = '로드 실패';
        }
    };

    // ─── Usage Rules Logic ───
    const loadRules = async () => {
        const rulesTextBox = document.getElementById('rules-text-box');
        const rulesEditTextarea = document.getElementById('rules-edit-textarea');
        const editForm = document.getElementById('rules-edit-form');
        const isTeacher = state.currentUser?.role === 'teacher';

        try {
            const res = await fetch('/api/rules');
            const data = await res.json();
            const rules = data.rules || '등록된 이용 규칙이 없습니다.';
            
            if (rulesTextBox) rulesTextBox.textContent = rules;
            if (rulesEditTextarea) rulesEditTextarea.value = rules;
            
            if (isTeacher && editForm) {
                editForm.classList.remove('hidden');
            }
        } catch {
            if (rulesTextBox) rulesTextBox.textContent = '규칙을 불러오는 데 실패했습니다.';
        }
    };

    document.getElementById('save-rules-btn')?.addEventListener('click', async () => {
        const newRules = document.getElementById('rules-edit-textarea')?.value;
        const btn = document.getElementById('save-rules-btn');
        
        btn.disabled = true;
        btn.textContent = '저장 중...';
        
        try {
            const res = await fetch('/api/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rules: newRules })
            });
            
            if (res.ok) {
                showToast('✅ 이용 규칙이 저장되었습니다!');
                const rulesTextBox = document.getElementById('rules-text-box');
                if (rulesTextBox) rulesTextBox.textContent = newRules;
            } else {
                showToast('저장에 실패했습니다.', 'error');
            }
        } catch {
            showToast('서버 오류입니다.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '규칙 변경 내용 저장';
        }
    });

    // Toggle password visibility
    document.getElementById('toggle-teacher-pw')?.addEventListener('click', () => {
        teacherPwVisible = !teacherPwVisible;
        const pwEl = document.getElementById('teacher-pw-display');
        const toggleBtn = document.getElementById('toggle-teacher-pw');
        if (pwEl && teacherData) {
            pwEl.textContent = teacherPwVisible ? (teacherData.password || '-') : '••••••••';
        }
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('.material-symbols-outlined');
            if (icon) icon.textContent = teacherPwVisible ? 'visibility_off' : 'visibility';
        }
    });

    // ─── Teacher: load all student PINs ───
    const loadStudentPins = async () => {
        const container = document.getElementById('student-pin-list');
        if (!container) return;
        try {
            const res = await fetch('/api/students');
            const students = await res.json();
            container.innerHTML = students.map(s => `
                <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all">
                    <div class="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm flex-shrink-0">
                        ${s.id}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-text-main text-sm truncate">${s.name}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="px-4 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-sm text-text-main tracking-widest select-all">
                            ${s.pin || '000000'}
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            container.innerHTML = '<p class="text-center text-red-400 text-sm py-6">학생 목록을 불러올 수 없습니다.</p>';
        }
    };

    // ─── OPEN settings (full-screen) ───
    window.openSettings = () => {
        const isTeacher = state.currentUser?.role === 'teacher';
        const isStudent = state.currentUser?.role === 'student';

        // Show/hide role-specific sections
        const studentSection = document.getElementById('section-student-pin');
        const teacherSection = document.getElementById('section-teacher-passwords');
        if (studentSection) studentSection.classList.toggle('hidden', !isStudent);
        if (teacherSection) teacherSection.classList.toggle('hidden', !isTeacher);

        // Load rules (for both student and teacher)
        loadRules();

        // Load teacher data if teacher
        if (isTeacher) {
            loadTeacherPassword();
            loadStudentPins();
        }

        // Show the full-screen modal
        modal.classList.remove('hidden');
        modal.style.display = 'block';

        requestAnimationFrame(() => {
            if (overlay) overlay.style.opacity = '1';
            if (fullscreen) {
                fullscreen.style.transform = 'translateY(0)';
                fullscreen.style.opacity = '1';
            }
        });
    };

    // ─── CLOSE settings ───
    const closeHandler = () => {
        if (fullscreen) {
            fullscreen.style.transform = 'translateY(100%)';
            fullscreen.style.opacity = '0';
        }
        if (overlay) overlay.style.opacity = '0';

        // Reset password visibility
        teacherPwVisible = false;
        const pwEl = document.getElementById('teacher-pw-display');
        if (pwEl) pwEl.textContent = '••••••••';
        const toggleBtn = document.getElementById('toggle-teacher-pw');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('.material-symbols-outlined');
            if (icon) icon.textContent = 'visibility';
        }

        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.display = '';
        }, 500);
    };

    document.getElementById('close-settings-modal')?.addEventListener('click', closeHandler);
    overlay?.addEventListener('click', closeHandler);
}
