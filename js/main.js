import { checkSession, setupAuth } from './api.js';
import { fetchTasks, setupTasksLogic } from './tasks.js';
import { fetchNotes, renderNotes, setupNotesLogic } from './notes.js';

document.addEventListener('DOMContentLoaded', () => {

    // Inicialização pós-login
    const startApp = async () => {
        await fetchTasks();
        await fetchNotes();
        setupTasksLogic();
        setupNotesLogic();
    };

    // Configura o Login
    setupAuth(startApp);
    checkSession(startApp);

    // Configuração de Tema Local
    let isDark = localStorage.getItem('mindspace_theme') === 'dark';
    const applyTheme = () => {
        document.documentElement.classList.toggle('dark', isDark);
        document.getElementById('theme-icon').textContent = isDark ? 'light_mode' : 'dark_mode';
    };
    applyTheme();

    document.getElementById('theme-toggle').addEventListener('click', () => {
        isDark = !isDark;
        applyTheme();
        localStorage.setItem('mindspace_theme', isDark ? 'dark' : 'light');
    });

    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // SPA Routing
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
            btn.querySelector('span').style.fontVariationSettings = isActive ? "'FILL' 1" : "'FILL' 0";
        });

        renderNotes(); // Atualiza a tela visível
    };

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.target));
    });

    switchView('dashboard'); // Tela inicial
});