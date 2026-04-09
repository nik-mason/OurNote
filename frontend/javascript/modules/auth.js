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

    if (!loginBtn) return; // Not on login page

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
                    const userData = { ...user, role: 'student' };
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    showToast(`${user.name}님, 환영합니다!`);
                    setTimeout(() => window.location.href = '/dashboard', 1000);
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
}
