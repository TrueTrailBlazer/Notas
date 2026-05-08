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

    // Usando event delegation no document para garantir que o clique pegue 100% das vezes
    document.addEventListener('click', (e) => {
        if (e.target.closest('.js-theme-toggle')) {
            isDark = !isDark;
            applyTheme();
            localStorage.setItem('mindspace_theme', isDark ? 'dark' : 'light');
        }
    });
};

export const setupSidebarResizer = () => {
    const resizer = document.getElementById('sidebar-resizer');
    const root = document.documentElement;

    const savedWidth = localStorage.getItem('mindspace_sidebar_width');
    if (savedWidth) root.style.setProperty('--sidebar-width', `${savedWidth}px`);

    let isResizing = false;

    resizer.addEventListener('mousedown', () => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        let newWidth = e.clientX;
        if (newWidth < 220) newWidth = 220;
        if (newWidth > 600) newWidth = 600;
        root.style.setProperty('--sidebar-width', `${newWidth}px`);
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            const currentWidth = getComputedStyle(root).getPropertyValue('--sidebar-width').replace('px', '').trim();
            localStorage.setItem('mindspace_sidebar_width', currentWidth);
        }
    });
};

export const setupSidebarCollapsibles = () => {
    const setupToggle = (toggleId, listId, iconId, storageKey) => {
        const toggleBtn = document.getElementById(toggleId);
        const list = document.getElementById(listId);
        const icon = document.getElementById(iconId);

        let isCollapsed = localStorage.getItem(storageKey) === 'true';

        const applyState = () => {
            if (isCollapsed) {
                list.classList.add('h-0', 'overflow-hidden', 'opacity-0');
                icon.style.transform = 'rotate(180deg)';
            } else {
                list.classList.remove('h-0', 'overflow-hidden', 'opacity-0');
                icon.style.transform = 'rotate(0deg)';
            }
        };
        applyState();

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isCollapsed = !isCollapsed;
            localStorage.setItem(storageKey, isCollapsed);
            applyState();
        });
    };

    setupToggle('toggle-fixed-tasks', 'fixed-tasks-list', 'icon-fixed-tasks', 'mindspace_fixed_collapsed');
    setupToggle('toggle-new-tasks', 'new-tasks-list', 'icon-new-tasks', 'mindspace_new_collapsed');
};

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

export const setupCalendar = () => {
    const dateWidget = document.getElementById('date-widget');
    const dropdown = document.getElementById('calendar-dropdown');
    const grid = document.getElementById('calendar-grid');
    const monthYearText = document.getElementById('calendar-month-year');
    const currentDateText = document.getElementById('current-date');
    const btnBackToday = document.getElementById('btn-back-today');

    let selectedDate = new Date();
    let viewDate = new Date();
    viewDate.setDate(1);

    const isDateToday = (dateObj) => {
        const today = new Date();
        return dateObj.getDate() === today.getDate() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getFullYear() === today.getFullYear();
    };

    const updateHeaderDate = () => {
        currentDateText.textContent = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(selectedDate);

        // Verifica se é hoje e muda a cor da UI
        if (!isDateToday(selectedDate)) {
            dateWidget.classList.add('bg-primary-container', 'text-on-primary-container');
            dateWidget.classList.remove('text-primary');
            currentDateText.classList.remove('text-on-background');
            btnBackToday.classList.remove('hidden');
        } else {
            dateWidget.classList.remove('bg-primary-container', 'text-on-primary-container');
            dateWidget.classList.add('text-primary');
            currentDateText.classList.add('text-on-background');
            btnBackToday.classList.add('hidden');
        }
    };

    const renderCalendarGrid = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        monthYearText.textContent = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(viewDate);

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = '';
        const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

        html += daysOfWeek.map(d => `<div class="text-center text-xs font-bold text-on-surface-variant mb-2">${d}</div>`).join('');
        for (let i = 0; i < firstDay; i++) html += `<div></div>`;

        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear());
            const isSelected = (i === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear());

            let bgClass = 'hover:bg-surface-container-high text-on-surface';
            if (isSelected) bgClass = 'bg-primary text-on-primary font-bold shadow-sm';
            else if (isToday) bgClass = 'border border-primary text-primary font-bold';

            html += `<div class="text-center py-1 text-sm rounded-full cursor-pointer transition-colors ${bgClass}" data-day="${i}">${i}</div>`;
        }
        grid.innerHTML = html;

        grid.querySelectorAll('[data-day]').forEach(dayEl => {
            dayEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const day = parseInt(dayEl.dataset.day);
                selectedDate = new Date(year, month, day);
                updateHeaderDate();
                renderCalendarGrid();

                dropdown.classList.add('opacity-0', 'scale-95');
                setTimeout(() => dropdown.classList.add('hidden'), 200);
            });
        });
    };

    document.getElementById('cal-prev').addEventListener('click', (e) => {
        e.stopPropagation(); viewDate.setMonth(viewDate.getMonth() - 1); renderCalendarGrid();
    });
    document.getElementById('cal-next').addEventListener('click', (e) => {
        e.stopPropagation(); viewDate.setMonth(viewDate.getMonth() + 1); renderCalendarGrid();
    });

    btnBackToday.addEventListener('click', () => {
        selectedDate = new Date();
        updateHeaderDate();
        renderCalendarGrid();
    });

    updateHeaderDate();

    dateWidget.addEventListener('click', () => {
        const isHidden = dropdown.classList.contains('hidden');
        if (isHidden) {
            viewDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            renderCalendarGrid();
            dropdown.classList.remove('hidden');
            requestAnimationFrame(() => dropdown.classList.remove('opacity-0', 'scale-95'));
        } else {
            dropdown.classList.add('opacity-0', 'scale-95');
            setTimeout(() => dropdown.classList.add('hidden'), 200);
        }
    });

    document.addEventListener('click', (e) => {
        if (!dateWidget.contains(e.target) && !dropdown.contains(e.target) && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('opacity-0', 'scale-95');
            setTimeout(() => dropdown.classList.add('hidden'), 200);
        }
    });
};