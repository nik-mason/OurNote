import { state } from '../common.js';

export function initCommandPalette() {
    // 1. Create HTML Structure if not exists
    if (!document.getElementById('command-palette')) {
        const palette = document.createElement('div');
        palette.id = 'command-palette';
        palette.innerHTML = `
            <div id="palette-overlay" style="position:fixed; inset:0; background:rgba(0,0,0,0.4); backdrop-filter:blur(10px);"></div>
            <div class="palette-container">
                <div class="palette-input-area">
                    <span class="material-symbols-outlined text-primary">search</span>
                    <input type="text" id="palette-input" placeholder="무엇을 도와드릴까요? (명령어 검색...)" autocomplete="off">
                    <span class="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-400">ESC</span>
                </div>
                <div id="palette-list" class="palette-list">
                    <!-- Dynamic Items -->
                </div>
            </div>
        `;
        document.body.appendChild(palette);
    }

    const palette = document.getElementById('command-palette');
    const input = document.getElementById('palette-input');
    const list = document.getElementById('palette-list');
    const overlay = document.getElementById('palette-overlay');

    const commands = [
        { id: 'go-dashboard', label: '✨ 대시보드로 이동', icon: 'dashboard', action: () => document.querySelector('[data-cat="dashboard"]')?.click() },
        { id: 'go-notice', label: '📢 공지사항 보기', icon: 'campaign', action: () => document.querySelector('[data-cat="notice"]')?.click() },
        { id: 'go-homework', label: '📝 숙제 확인하기', icon: 'assignment', action: () => document.querySelector('[data-cat="homework"]')?.click() },
        { id: 'new-post', label: '✍️ 새 이야기 작성', icon: 'edit_note', action: () => document.getElementById('open-write-modal')?.click() },
        { id: 'toggle-theme', label: '🌓 테마 전환 (다크/라이트)', icon: 'contrast', action: () => {
            const current = localStorage.getItem('ournote_theme') || 'white';
            const next = current === 'dark' ? 'white' : 'dark';
            // Trigger theme switch via global event or direct call if available
            window.toggleThemeFluid?.(next);
        }},
        { id: 'open-settings', label: '⚙️ 설정 열기', icon: 'settings', action: () => window.openSettings?.() },
        { id: 'logout', label: '🚪 로그아웃', icon: 'logout', action: () => document.getElementById('logout-btn')?.click() }
    ];

    let selectedIndex = 0;
    let filteredCommands = [];

    const renderList = (filter = '') => {
        filteredCommands = commands.filter(c => c.label.toLowerCase().includes(filter.toLowerCase()));
        list.innerHTML = filteredCommands.map((c, i) => `
            <div class="palette-item ${i === selectedIndex ? 'selected' : ''}" data-index="${i}">
                <span class="material-symbols-outlined">${c.icon}</span>
                <div class="flex-1">
                    <div class="font-bold text-sm text-text-main">${c.label}</div>
                    <div class="text-[10px] text-text-dim font-medium">Command</div>
                </div>
                <span class="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100">subdirectory_arrow_left</span>
            </div>
        `).join('');
    };

    const open = () => {
        palette.classList.add('active');
        selectedIndex = 0;
        input.value = '';
        renderList();
        setTimeout(() => input.focus(), 100);
    };

    const close = () => {
        palette.classList.remove('active');
    };

    // Hotkey: Ctrl + K
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            open();
        }
        if (e.key === 'Escape') close();
    });

    overlay.onclick = close;

    input.oninput = (e) => {
        selectedIndex = 0;
        renderList(e.target.value);
    };

    input.onkeydown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % filteredCommands.length;
            renderList(input.value);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + filteredCommands.length) % filteredCommands.length;
            renderList(input.value);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const cmd = filteredCommands[selectedIndex];
            if (cmd) {
                cmd.action();
                close();
            }
        }
    };

    list.onclick = (e) => {
        const item = e.target.closest('.palette-item');
        if (item) {
            const idx = parseInt(item.dataset.index);
            filteredCommands[idx].action();
            close();
        }
    };
}
