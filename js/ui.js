// --- TEMA CLARO/ESCURO ---
export const setupTheme = () => {
    const htmlElement = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    let isDark = localStorage.getItem('mindspace_theme') === 'dark';

    const applyTheme = () => {
        if (isDark) {
            htmlElement.classList.add('dark');
            themeIcon.textContent = 'light_mode';
        } else {
            htmlElement.classList.remove('dark');
            themeIcon.textContent = 'dark_mode';
        }
    };

    applyTheme();

    document.getElementById('theme-toggle').addEventListener('click', () => {
        isDark = !isDark;
        applyTheme();
        localStorage.setItem('mindspace_theme', isDark ? 'dark' : 'light');
    });
};

// --- MODAL DE CONFIRMAÇÃO ---
export const showConfirm = (title, message) => {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const box = document.getElementById('custom-confirm-box');

        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => { modal.classList.remove('opacity-0'); box.classList.remove('scale-95'); }, 10);

        const handleClose = (result) => {
            modal.classList.add('opacity-0'); box.classList.add('scale-95');
            setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);

            document.getElementById('confirm-ok').onclick = null;
            document.getElementById('confirm-cancel').onclick = null;
            resolve(result);
        };

        document.getElementById('confirm-ok').onclick = () => handleClose(true);
        document.getElementById('confirm-cancel').onclick = () => handleClose(false);
    });
};

// --- MODAL DE PROMPT (INPUT) ---
export const showPrompt = (title, defaultValue) => {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-prompt-modal');
        const box = document.getElementById('custom-prompt-box');
        const input = document.getElementById('prompt-input');

        document.getElementById('prompt-title').textContent = title;
        input.value = defaultValue;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0'); box.classList.remove('scale-95');
            input.focus();
        }, 10);

        const handleClose = (result) => {
            modal.classList.add('opacity-0'); box.classList.add('scale-95');
            setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);

            document.getElementById('prompt-ok').onclick = null;
            document.getElementById('prompt-cancel').onclick = null;
            resolve(result);
        };

        document.getElementById('prompt-ok').onclick = () => handleClose(input.value);
        document.getElementById('prompt-cancel').onclick = () => handleClose(null);
    });
};

// --- CALENDÁRIO ---
export const setupCalendar = () => {
    const dateWidget = document.getElementById('date-widget');
    const dropdown = document.getElementById('calendar-dropdown');
    const grid = document.getElementById('calendar-grid');
    const monthYearText = document.getElementById('calendar-month-year');

    const now = new Date();
    document.getElementById('current-date').textContent = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(now);

    const renderCalendarGrid = () => {
        const year = now.getFullYear();
        const month = now.getMonth();
        monthYearText.textContent = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now);

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = '';
        const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

        html += daysOfWeek.map(d => `<div class="text-center text-xs font-bold text-on-surface-variant mb-2">${d}</div>`).join('');
        for (let i = 0; i < firstDay; i++) html += `<div></div>`;
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = i === now.getDate();
            const bgClass = isToday ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-low text-on-surface';
            html += `<div class="text-center py-1 text-sm rounded-full cursor-pointer transition-colors ${bgClass}">${i}</div>`;
        }
        grid.innerHTML = html;
    };

    dateWidget.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdown.classList.contains('hidden')) {
            renderCalendarGrid();
            dropdown.classList.remove('hidden');
            setTimeout(() => dropdown.classList.remove('opacity-0', 'scale-95'), 10);
        } else {
            dropdown.classList.add('opacity-0', 'scale-95');
            setTimeout(() => dropdown.classList.add('hidden'), 200);
        }
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !dateWidget.contains(e.target)) {
            dropdown.classList.add('opacity-0', 'scale-95');
            setTimeout(() => dropdown.classList.add('hidden'), 200);
        }
    });
};