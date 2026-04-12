/**
 * OURNOTE AUTH MODULE
 */
import { state, showToast } from './common.js';

export function initAuth() {
    const loginBtn = document.getElementById('login-btn');
    const studentBtn = document.getElementById('radio-student-btn');
    const teacherBtn = document.getElementById('radio-teacher-btn');
    const loginMode = document.getElementById('login-mode');
    const studentFields = document.getElementById('student-fields');
    const teacherFields = document.getElementById('teacher-fields');

    // 0. Logout LOGIC (Always available if initAuth is called)
    window.logout = () => {
        localStorage.removeItem('currentUser');
        showToast('로그아웃 되었습니다. 안녕히 가세요!');
        setTimeout(() => window.location.href = '/', 1000);
    };

    document.getElementById('logout-btn')?.addEventListener('click', window.logout);
    document.getElementById('logout-btn-mobile')?.addEventListener('click', window.logout);
    document.getElementById('settings-logout-btn')?.addEventListener('click', window.logout);

    if (!loginBtn) return; // Only stop login-page specific logic

    // 1. Mode Toggle Logic
    studentBtn?.addEventListener('click', () => {
        loginMode.value = 'student';
        studentBtn.classList.add('bg-primary', 'text-[#ffffff]', 'shadow-lg', 'shadow-primary/20');
        teacherBtn.classList.remove('bg-primary', 'text-[#ffffff]', 'shadow-lg', 'shadow-primary/20');
        teacherBtn.classList.add('text-[var(--text-dim)]');
        studentFields.classList.remove('hidden');
        teacherFields.classList.add('hidden');
    });

    teacherBtn?.addEventListener('click', () => {
        loginMode.value = 'teacher';
        teacherBtn.classList.add('bg-primary', 'text-[#ffffff]', 'shadow-lg', 'shadow-primary/20');
        studentBtn.classList.remove('bg-primary', 'text-[#ffffff]', 'shadow-lg', 'shadow-primary/20');
        studentBtn.classList.add('text-[var(--text-dim)]');
        teacherFields.classList.remove('hidden');
        studentFields.classList.add('hidden');
    });

    // 2. Login Execution
    let pendingUser = null;
    let pinBuffer = "";

    const openPinModal = (user) => {
        pendingUser = user;
        pinBuffer = "";
        updatePinDisplay();
        document.getElementById('pin-target-name').textContent = `${user.name}님, 비밀번호를 입력하세요`;
        const modal = document.getElementById('pin-modal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.querySelector('.modal-v4')?.classList.add('active'), 10);
        document.getElementById('pin-input-real').focus();
    };

    const updatePinDisplay = () => {
        const dots = document.querySelectorAll('.pin-dot');
        dots.forEach((dot, i) => {
            if (i < pinBuffer.length) {
                dot.classList.add('bg-primary', 'border-primary', 'scale-125');
                dot.classList.remove('border-slate-200');
            } else {
                dot.classList.remove('bg-primary', 'border-primary', 'scale-125');
                dot.classList.add('border-slate-200');
            }
        });

        if (pinBuffer.length === 6) {
            validatePin();
        }
    };

    const validatePin = () => {
        if (pendingUser && pinBuffer === (pendingUser.pin || "000000")) {
            const userData = { ...pendingUser, role: 'student' };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            showToast(`${pendingUser.name}님, 환영합니다!`, 'success');
            
            // Success animation
            document.querySelectorAll('.pin-dot').forEach(d => d.classList.add('bg-green-500', 'border-green-500'));
            
            setTimeout(() => window.location.href = '/dashboard', 800);
        } else {
            showToast('비밀번호가 틀렸습니다.', 'error');
            pinBuffer = "";
            // Shake animation
            const modalBody = document.querySelector('#pin-modal .modal-v4');
            modalBody.classList.add('animate-shake');
            setTimeout(() => {
                modalBody.classList.remove('animate-shake');
                updatePinDisplay();
            }, 500);
        }
    };

    loginBtn.addEventListener('click', async () => {
        const mode = loginMode.value;
        
        if (mode === 'student') {
            const id = document.getElementById('student-id').value.trim();
            const name = document.getElementById('student-name').value.trim();
            
            if (!id || !name) {
                showToast('정보를 모두 입력해 주세요.', 'error');
                return;
            }

            try {
                const res = await fetch('/api/students');
                const students = await res.json();
                const user = students.find(s => s.id === id && s.name === name);

                if (user) {
                    openPinModal(user);
                } else {
                    showToast('학생 정보를 찾을 수 없습니다.', 'error');
                }
            } catch (err) {
                showToast('서버 연결 오류가 발생했습니다.', 'error');
            }
        } else {
            const id = document.getElementById('teacher-id').value.trim();
            const pw = document.getElementById('teacher-pw').value.trim();

            if (!id || !pw) {
                showToast('정보를 모두 입력해 주세요.', 'error');
                return;
            }

            try {
                const res = await fetch('/api/teacher');
                const teacher = await res.json();

                if (teacher.username === id && teacher.password === pw) {
                    const userData = { name: '선생님', role: 'teacher' };
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    showToast('선생님 기기에 접속되었습니다!');
                    setTimeout(() => window.location.href = '/dashboard', 1000);
                } else {
                    showToast('ID 또는 비밀번호가 틀렸습니다.', 'error');
                }
            } catch (err) {
                showToast('서버 연결 오류가 발생했습니다.', 'error');
            }
        }
    });

    // PIN Keypad Events
    document.querySelectorAll('.keypad-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (pinBuffer.length < 6) {
                pinBuffer += btn.getAttribute('data-val');
                updatePinDisplay();
            }
        });
    });

    document.getElementById('pin-clear')?.addEventListener('click', () => {
        pinBuffer = "";
        updatePinDisplay();
    });

    document.getElementById('pin-delete')?.addEventListener('click', () => {
        pinBuffer = pinBuffer.slice(0, -1);
        updatePinDisplay();
    });

    // PC Keyboard Support
    document.getElementById('pin-input-real')?.addEventListener('input', (e) => {
        const val = e.target.value;
        pinBuffer = val.substring(0, 6);
        updatePinDisplay();
        e.target.value = pinBuffer; // sync back if exceeded
    });

    // Close Modal
    document.getElementById('close-pin-modal')?.addEventListener('click', () => {
        document.getElementById('pin-modal').classList.add('hidden');
    });
    document.getElementById('close-pin-overlay')?.addEventListener('click', () => {
        document.getElementById('pin-modal').classList.add('hidden');
    });
}
