document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. CONFIGURAÇÃO SUPABASE & AUTH
    // ==========================================
    
    // Puxando do arquivo config.js (ou do Netlify)
    const SUPABASE_URL = ENV.SUPABASE_URL; 
    const SUPABASE_ANON_KEY = ENV.SUPABASE_ANON_KEY;
    
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    

    // Variáveis de Estado Global
    let tasksData = { fixed: [], new: [] };
    let notesData = [];

    // Elementos Auth
    const loginOverlay = document.getElementById('login-overlay');
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const loginBtn = document.getElementById('btn-login');
    const btnText = document.getElementById('btn-login-text');
    const btnSpinner = document.getElementById('btn-login-spinner');
    const authError = document.getElementById('auth-error');

    // Verifica Sessão Ativa
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            loginOverlay.classList.add('hidden');
            initApp();
        }
    };
    checkSession();

    // Login Function
    loginBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) return;

        // UI Loading
        btnText.classList.add('hidden');
        btnSpinner.classList.remove('hidden');
        authError.classList.add('hidden');

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            authError.textContent = error.message;
            authError.classList.remove('hidden');
            btnText.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        } else {
            loginOverlay.classList.add('opacity-0');
            setTimeout(() => {
                loginOverlay.classList.add('hidden');
                loginOverlay.classList.remove('opacity-0');
                initApp();
            }, 300);
        }
    });

    // Logout Function
    document.getElementById('btn-logout').addEventListener('click', async () => {
        await supabase.auth.signOut();
        location.reload();
    });

    document.getElementById('btn-clear-local').addEventListener('click', () => {
        localStorage.clear();
        location.reload();
    });


    // ==========================================
    // 2. INICIALIZAÇÃO DA APLICAÇÃO (Após Login)
    // ==========================================
    
    async function initApp() {
        await fetchTasks();
        await fetchNotes();
    }

    // ==========================================
    // 3. TEMA E ROTEAMENTO SPA
    // ==========================================
    
    let isDarkMode = localStorage.getItem('mindspace_theme') === 'dark';
    const htmlElement = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    
    const applyTheme = () => {
        if (isDarkMode) { htmlElement.classList.add('dark'); themeIcon.textContent = 'light_mode'; } 
        else { htmlElement.classList.remove('dark'); themeIcon.textContent = 'dark_mode'; }
    };
    applyTheme();

    document.getElementById('theme-toggle').addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        applyTheme();
        localStorage.setItem('mindspace_theme', isDarkMode ? 'dark' : 'light');
    });

    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // SPA Routing
    const navButtons = document.querySelectorAll('.nav-btn');
    const appViews = document.querySelectorAll('.app-view');

    const switchView = (targetView) => {
        appViews.forEach(view => {
            if (view.id === `view-${targetView}`) view.classList.remove('hidden');
            else view.classList.add('hidden');
        });

        navButtons.forEach(btn => {
            if (btn.dataset.target === targetView) {
                btn.classList.add('text-primary', 'font-bold', 'border-primary', 'bg-surface-container-low');
                btn.classList.remove('text-on-surface-variant', 'border-transparent', 'hover:bg-surface-container');
                btn.querySelector('span').style.fontVariationSettings = "'FILL' 1";
            } else {
                btn.classList.remove('text-primary', 'font-bold', 'border-primary', 'bg-surface-container-low');
                btn.classList.add('text-on-surface-variant', 'border-transparent', 'hover:bg-surface-container');
                btn.querySelector('span').style.fontVariationSettings = "'FILL' 0";
            }
        });
        
        // Renderiza de novo para garantir dados frescos ao mudar de aba
        renderNotes();
    };

    navButtons.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.target)));
    switchView('dashboard'); // Init view


    // ==========================================
    // 4. LÓGICA DE TAREFAS COM SUPABASE
    // ==========================================
    const fixedTasksList = document.getElementById('fixed-tasks-list');
    const newTasksList = document.getElementById('new-tasks-list');
    const newTaskInput = document.getElementById('new-task-input');

    async function fetchTasks() {
        const { data, error } = await supabase.from('tasks').select('*').order('id');
        if (!error && data) {
            tasksData.fixed = data.filter(t => t.is_fixed);
            tasksData.new = data.filter(t => !t.is_fixed);
            
            // Auto-popular tasks fixas se for o primeiro acesso ao banco
            if (tasksData.fixed.length === 0 && data.length === 0) {
                const defaults = [
                    { text: 'Morning Meditation', is_fixed: true },
                    { text: 'Hydration', is_fixed: true },
                    { text: 'Review Goals', is_fixed: true }
                ];
                await supabase.from('tasks').insert(defaults);
                return fetchTasks(); // Chama de novo recursivamente
            }
            renderTasks();
        }
    }

    const renderTasks = () => {
        fixedTasksList.innerHTML = tasksData.fixed.map(task => `
            <li class="flex items-center gap-3 group">
                <input class="sleek-checkbox rounded" id="task-${task.id}" type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})"/>
                <label class="font-body-md text-body-md text-on-surface cursor-pointer group-hover:text-primary transition-colors duration-200 ${task.completed ? 'line-through opacity-60' : ''}" for="task-${task.id}">${task.text}</label>
            </li>
        `).join('');

        newTasksList.innerHTML = tasksData.new.map(task => `
            <li class="flex items-center gap-3 group">
                <input class="sleek-checkbox rounded" id="task-${task.id}" type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})"/>
                <label class="font-body-md text-body-md text-on-surface cursor-pointer group-hover:text-primary transition-colors duration-200 ${task.completed ? 'line-through opacity-60' : ''}" for="task-${task.id}">${task.text}</label>
            </li>
        `).join('');
    };

    window.toggleTask = async (id) => {
        // Encontra a task no array local para UI instatânea (Optimistic UI)
        let task = tasksData.fixed.find(t => t.id === id) || tasksData.new.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            renderTasks(); // Renderiza instantaneo no front
            // Manda pro banco no fundo
            await supabase.from('tasks').update({ completed: task.completed }).eq('id', id);
        }
    };

    const addTask = async () => {
        const text = newTaskInput.value.trim();
        if (text) {
            newTaskInput.value = ''; // limpa input
            // Insere no banco
            const { data, error } = await supabase.from('tasks').insert([{ text: text, is_fixed: false }]).select();
            if (!error && data) {
                tasksData.new.push(data[0]); // Pega o retorno real com o ID gerado e joga no state local
                renderTasks();
            }
        }
    };

    document.getElementById('add-task-btn').addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    
    document.getElementById('clear-new-tasks').addEventListener('click', async () => {
        if(confirm('Clear all non-fixed tasks?')) {
            await supabase.from('tasks').delete().eq('is_fixed', false);
            tasksData.new = [];
            renderTasks();
        }
    });


    // ==========================================
    // 5. LÓGICA DE NOTAS COM SUPABASE
    // ==========================================
    
    async function fetchNotes() {
        // Puxa tudo ordenado da mais nova pra mais velha
        const { data, error } = await supabase.from('notes').select('*').order('date', { ascending: false });
        if (!error && data) {
            notesData = data;
            renderNotes();
        }
    }

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
    };

    const createNoteCard = (note) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-block bg-surface rounded-xl border border-outline-variant p-card-padding ambient-shadow-level-1 relative group flex flex-col justify-between cursor-pointer min-h-[240px]';
        
        let iconHtml = '';
        if (note.is_pinned) iconHtml = `<span class="material-symbols-outlined text-primary text-sm ml-2">push_pin</span>`;
        if (note.is_archived) iconHtml = `<span class="material-symbols-outlined text-on-surface-variant text-sm ml-2">inventory_2</span>`;

        noteDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <h3 class="font-h2 text-h2 font-medium text-on-background flex items-center">${note.title || 'Untitled'} ${iconHtml}</h3>
                <button class="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-surface-container rounded-full flex-shrink-0">
                    <span class="material-symbols-outlined pointer-events-none">open_in_new</span>
                </button>
            </div>
            <div class="mt-4 flex-1">
                <p class="font-body-md text-body-md text-on-surface-variant line-clamp-4 w-full overflow-hidden text-ellipsis whitespace-pre-wrap">${note.content}</p>
            </div>
            <div class="mt-4 flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                <span class="material-symbols-outlined text-[16px]">schedule</span>
                <span>${formatDate(note.date)}</span>
            </div>
        `;
        noteDiv.addEventListener('click', () => openModal(note.id));
        return noteDiv;
    };

    const createNewNoteButton = () => {
        const btn = document.createElement('button');
        btn.className = 'bg-surface-container-low rounded-xl border border-dashed border-primary/50 hover:bg-surface hover:border-primary hover:shadow-sm transition-all duration-200 p-card-padding flex flex-col items-center justify-center min-h-[240px] group';
        btn.innerHTML = `
            <div class="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <span class="material-symbols-outlined text-[24px]">add</span>
            </div>
            <span class="font-h2 text-h2 font-medium text-primary group-hover:text-primary-fixed-variant transition-colors duration-200">Create New Note</span>
        `;
        btn.addEventListener('click', () => openModal(null));
        return btn;
    };

    const renderNotes = () => {
        const dashboardGrid = document.getElementById('notes-grid');
        const pinnedGrid = document.getElementById('pinned-grid');
        const archivesGrid = document.getElementById('archives-grid');

        if(dashboardGrid) dashboardGrid.innerHTML = '';
        if(pinnedGrid) pinnedGrid.innerHTML = '';
        if(archivesGrid) archivesGrid.innerHTML = '';

        const activeNotes = notesData.filter(n => !n.is_archived); 
        const pinnedNotes = notesData.filter(n => n.is_pinned && !n.is_archived);
        const archivedNotes = notesData.filter(n => n.is_archived);

        activeNotes.forEach(note => dashboardGrid.appendChild(createNoteCard(note)));
        dashboardGrid.appendChild(createNewNoteButton());

        if(pinnedNotes.length === 0) pinnedGrid.innerHTML = '<p class="text-on-surface-variant col-span-full">No pinned notes yet.</p>';
        else pinnedNotes.forEach(note => pinnedGrid.appendChild(createNoteCard(note)));

        if(archivedNotes.length === 0) archivesGrid.innerHTML = '<p class="text-on-surface-variant col-span-full">Your archive is empty.</p>';
        else archivedNotes.forEach(note => archivesGrid.appendChild(createNoteCard(note)));
    };


    // ==========================================
    // 6. LÓGICA DO MODAL DE NOTAS
    // ==========================================
    const modal = document.getElementById('full-note-modal');
    const modalContentBox = document.getElementById('modal-content-box');
    const noteIdInput = document.getElementById('modal-note-id');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const deleteBtn = document.getElementById('delete-note-btn');
    const pinBtn = document.getElementById('modal-pin-btn');
    const archiveBtn = document.getElementById('modal-archive-btn');
    const pinIcon = document.getElementById('modal-pin-icon');
    const archiveIcon = document.getElementById('modal-archive-icon');
    const divider = document.getElementById('modal-divider');
    const saveSpinner = document.getElementById('save-spinner');
    const saveText = document.getElementById('save-btn-text');

    let tempIsPinned = false;
    let tempIsArchived = false;

    const updateModalIcons = () => {
        if (tempIsPinned) { pinIcon.style.fontVariationSettings = "'FILL' 1"; pinIcon.classList.add('text-primary'); } 
        else { pinIcon.style.fontVariationSettings = "'FILL' 0"; pinIcon.classList.remove('text-primary'); }

        if (tempIsArchived) { archiveIcon.style.fontVariationSettings = "'FILL' 1"; archiveIcon.classList.add('text-primary'); } 
        else { archiveIcon.style.fontVariationSettings = "'FILL' 0"; archiveIcon.classList.remove('text-primary'); }
    };

    pinBtn.addEventListener('click', () => { tempIsPinned = !tempIsPinned; tempIsArchived = false; updateModalIcons(); });
    archiveBtn.addEventListener('click', () => { tempIsArchived = !tempIsArchived; tempIsPinned = false; updateModalIcons(); });

    const openModal = (id) => {
        if (id) {
            const note = notesData.find(n => n.id === parseInt(id)); // ID no supabase é int
            noteIdInput.value = note.id;
            modalTitle.value = note.title;
            modalBody.value = note.content;
            tempIsPinned = note.is_pinned || false;
            tempIsArchived = note.is_archived || false;
            
            deleteBtn.classList.remove('hidden');
            pinBtn.classList.remove('hidden');
            archiveBtn.classList.remove('hidden');
            divider.classList.remove('hidden');
        } else {
            noteIdInput.value = '';
            modalTitle.value = '';
            modalBody.value = '';
            tempIsPinned = false;
            tempIsArchived = false;
            
            deleteBtn.classList.add('hidden');
            pinBtn.classList.add('hidden');
            archiveBtn.classList.add('hidden');
            divider.classList.add('hidden');
        }
        
        updateModalIcons();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalContentBox.classList.remove('scale-95');
        }, 10);
    };

    const closeModal = () => {
        modal.classList.add('opacity-0');
        modalContentBox.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    };

    const saveNoteFromModal = async () => {
        const id = noteIdInput.value;
        const title = modalTitle.value.trim() || 'Untitled Note';
        const content = modalBody.value.trim();

        // Feedback visual de salvamento
        saveSpinner.classList.remove('hidden');
        saveText.textContent = 'Saving...';

        const payload = {
            title: title,
            content: content,
            is_pinned: tempIsPinned,
            is_archived: tempIsArchived,
            date: new Date().toISOString()
        };

        if (id) {
            // Update
            const { data, error } = await supabase.from('notes').update(payload).eq('id', id).select();
            if (!error) {
                const index = notesData.findIndex(n => n.id === parseInt(id));
                notesData[index] = data[0]; // Substitui pelo atualizado do banco
            }
        } else {
            // Insert
            const { data, error } = await supabase.from('notes').insert([payload]).select();
            if (!error) {
                notesData.unshift(data[0]); // Coloca no inicio da lista
            }
        }

        renderNotes();
        closeModal();
        
        // Reseta botão
        setTimeout(() => {
            saveSpinner.classList.add('hidden');
            saveText.textContent = 'Save Note';
        }, 300);
    };

    const deleteNoteFromModal = async () => {
        if(confirm('Are you sure you want to delete this note?')) {
            const id = noteIdInput.value;
            await supabase.from('notes').delete().eq('id', id);
            notesData = notesData.filter(n => n.id !== parseInt(id));
            renderNotes();
            closeModal();
        }
    };

    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);
    document.getElementById('save-modal-btn').addEventListener('click', saveNoteFromModal);
    deleteBtn.addEventListener('click', deleteNoteFromModal);
    document.getElementById('fab-add-note').addEventListener('click', () => openModal(null));

});