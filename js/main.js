import { checkSession, setupAuth } from './api.js';
import { setupTheme, setupCalendar, setupSidebarResizer } from './ui.js';
import { fetchTasks, setupTasksLogic } from './tasks.js';
import { fetchNotes, renderNotes, setupNotesLogic } from './notes.js';

document.addEventListener('DOMContentLoaded', () => {

    setupTheme();

    const startApp = async () => {
        setupCalendar();
        setupSidebarResizer(); // Inicia o arrasto da sidebar

        await fetchTasks();
        await fetchNotes();

        setupTasksLogic();
        setupNotesLogic();
    };

    setupAuth(startApp);
    checkSession(startApp);

    const switchView = (target) => {
        document.querySelectorAll('.app-view').forEach(view => {
            view.classList.toggle('hidden', view.id !== `view-${target}`);
        });

        document.querySelectorAll('.nav-btn').forEach(btn => {
            const isActive = btn.dataset.target === target;
            btn.classList.toggle('text-primary', isActive);
            btn.classList.toggle('font-bold', isActive);
            btn.classList.toggle('border-primary', isActive);
            btn.classList.toggle('bg-surface-container-low', isActive);

            btn.classList.toggle('text-on-surface-variant', !isActive);
            btn.classList.toggle('border-transparent', !isActive);
            btn.classList.toggle('hover:bg-surface-container', !isActive);

            btn.querySelector('span').style.fontVariationSettings = isActive ? "'FILL' 1" : "'FILL' 0";
        });

        renderNotes();
    };

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.target));
    });

    switchView('dashboard');
});