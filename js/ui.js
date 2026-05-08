// --- 1. TEMA CLARO/ESCURO ---
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

    applyTheme(); // Aplica ao carregar

    document.getElementById('theme-toggle').addEventListener('click', () => {
        isDark = !isDark;
        applyTheme();
        localStorage.setItem('mindspace_theme', isDark ? 'dark' : 'light');
    });
};

// --- 2. MODAL CUSTOMIZADO (Substitui o window.confirm) ---
export const showConfirm = (title, message) => {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const box = document.getElementById('custom-confirm-box');

        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            box.classList.remove('scale-95');
        }, 10);

        const handleClose = (result) => {
            modal.classList.add('opacity-0');
            box.classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);

            // Remove os listeners para não acumular
            document.getElementById('confirm-ok').onclick = null;
            document.getElementById('confirm-cancel').onclick = null;
            resolve(result);
        };

        document.getElementById('confirm-ok').onclick = () => handleClose(true);
        document.getElementById('confirm-cancel').onclick = () => handleClose(false);
    });
};

// --- 3. CALENDÁRIO DROPDOWN ---
export const setupCalendar = () => {
    const dateWidget = document.getElementById('date-widget');
    const dropdown = document.getElementById('calendar-dropdown');
    const grid = document.getElementById('calendar-grid');
    const monthYearText = document.getElementById('calendar-month-year');

    // Atualiza a data no botão (Hoje)
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

        // Cabeçalho da semana
        html += daysOfWeek.map(d => `<div class="text-center text-xs font-bold text-on-surface-variant mb-2">${d}</div>`).join('');

        // Espaços vazios antes do dia 1
        for (let i = 0; i < firstDay; i++) html += `<div></div>`;

        // Dias do mês
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = i === now.getDate();
            const bgClass = isToday ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-low text-on-surface';
            html += `<div class="text-center py-1 text-sm rounded-full cursor-pointer transition-colors ${bgClass}">${i}</div>`;
        }
        grid.innerHTML = html;
    };

    // Toggle ao clicar
    dateWidget.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que feche na mesma hora
        if (dropdown.classList.contains('hidden')) {
            renderCalendarGrid();
            dropdown.classList.remove('hidden');
            setTimeout(() => {
                dropdown.classList.remove('opacity-0', 'scale-95');
            }, 10);
        } else {
            dropdown.classList.add('opacity-0', 'scale-95');
            setTimeout(() => dropdown.classList.add('hidden'), 200);
        }
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !dateWidget.contains(e.target)) {
            dropdown.classList.add('opacity-0', 'scale-95');
            setTimeout(() => dropdown.classList.add('hidden'), 200);
        }
    });
};