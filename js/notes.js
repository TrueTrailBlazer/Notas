import { supabase } from './api.js';
import { showConfirm } from './ui.js';

let notesData = [];
let autosaveTimeout;
let searchQuery = '';

// Dicionário de cores tipo Google Keep
const KEEP_COLORS = [
    { name: 'default', value: 'var(--surface)' },
    { name: 'red', value: '#f28b82' },
    { name: 'orange', value: '#fbbc04' },
    { name: 'yellow', value: '#fff475' },
    { name: 'green', value: '#ccff90' },
    { name: 'teal', value: '#a7ffeb' },
    { name: 'blue', value: '#cbf0f8' },
    { name: 'purple', value: '#d7aefb' },
    { name: 'pink', value: '#fdcfe8' },
    { name: 'brown', value: '#e6c9a8' },
    { name: 'gray', value: '#e8eaed' }
];

const debounce = (func, delay) => {
    return (...args) => {
        clearTimeout(autosaveTimeout);
        autosaveTimeout = setTimeout(() => func.apply(this, args), delay);
    };
};

export const fetchNotes = async () => {
    const { data, error } = await supabase.from('notes').select('*').order('date', { ascending: false });
    if (!error && data) {
        notesData = data;
        renderNotes();
    }
};

const formatDate = (iso) => new Date(iso).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// Converte checkboxes textuais em HTML para exibição no card
const formatCardContent = (text, isList) => {
    if (!text) return '';
    if (!isList) return text;

    // Modo Lista: Cria visualmente as caixinhas apenas leitura no card
    const lines = text.split('\n');
    let html = '<div class="flex flex-col gap-1 mt-1">';
    lines.forEach(line => {
        if (line.trim() === '') return;
        const isChecked = line.startsWith('[x] ');
        const cleanText = line.replace(/^\[[ x]\]\s*/i, '');
        html += `<div class="flex items-start gap-2">
            <span class="material-symbols-outlined text-[16px] mt-0.5 opacity-70">${isChecked ? 'check_box' : 'check_box_outline_blank'}</span>
            <span class="${isChecked ? 'line-through opacity-50' : ''}">${cleanText}</span>
        </div>`;
    });
    html += '</div>';
    return html;
};

const createNoteCard = (note) => {
    const noteDiv = document.createElement('div');

    // Classes de tamanho individual
    const sizeClasses = note.card_size === 'large' ? 'md:col-span-2 md:row-span-2' : 'col-span-1 row-span-1';
    noteDiv.className = `note-block rounded-xl border border-outline-variant p-card-padding ambient-shadow-level-1 relative group flex flex-col justify-between cursor-pointer min-h-[240px] ${sizeClasses}`;

    // Aplica a cor de fundo salva
    const bgColor = KEEP_COLORS.find(c => c.name === (note.color || 'default'))?.value || 'var(--surface)';
    noteDiv.style.backgroundColor = bgColor;

    // Ajusta o texto se a cor for muito escura (apenas se usasse cores fortes, mas o Keep usa pastéis)
    const textColorStyle = note.color && note.color !== 'default' ? 'color: #1a1c18;' : '';

    let icon = note.is_pinned ? `<span class="material-symbols-outlined text-sm ml-2">push_pin</span>` :
        (note.is_archived ? `<span class="material-symbols-outlined text-sm ml-2">inventory_2</span>` : '');

    noteDiv.innerHTML = `
        <div class="flex justify-between items-start" style="${textColorStyle}">
            <h3 class="font-h2 text-h2 font-medium flex items-center">${note.title || 'Sem título'} ${icon}</h3>
            <button class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-black/10 rounded-full">
                <span class="material-symbols-outlined pointer-events-none">open_in_new</span>
            </button>
        </div>
        <div class="mt-4 flex-1" style="${textColorStyle}">
            <div class="font-body-md text-body-md line-clamp-6 w-full overflow-hidden text-ellipsis whitespace-pre-wrap ${note.is_list ? '' : 'opacity-80'}">${formatCardContent(note.content, note.is_list)}</div>
        </div>
        <div class="mt-4 flex items-center gap-2 font-label-sm text-label-sm opacity-60" style="${textColorStyle}">
            <span class="material-symbols-outlined text-[16px]">schedule</span>
            <span>${formatDate(note.date)}</span>
        </div>
    `;
    noteDiv.addEventListener('click', () => openModal(note.id));
    return noteDiv;
};

export const renderNotes = () => {
    const grids = {
        dashboard: document.getElementById('notes-grid'),
        pinned: document.getElementById('pinned-grid'),
        archives: document.getElementById('archives-grid')
    };

    Object.values(grids).forEach(g => { if (g) g.innerHTML = ''; });

    // Lógica da Barra de Pesquisa
    let filteredNotes = notesData;
    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filteredNotes = notesData.filter(n =>
            (n.title && n.title.toLowerCase().includes(query)) ||
            (n.content && n.content.toLowerCase().includes(query))
        );
    }

    const active = filteredNotes.filter(n => !n.is_archived);
    const pinned = filteredNotes.filter(n => n.is_pinned && !n.is_archived);
    const archived = filteredNotes.filter(n => n.is_archived);

    active.forEach(n => grids.dashboard.appendChild(createNoteCard(n)));

    // Só mostra o botão "Criar" se não estiver pesquisando
    if (searchQuery === '') {
        const btn = document.createElement('button');
        btn.className = 'js-create-note bg-surface-container-low rounded-xl border border-dashed border-primary/50 hover:bg-surface hover:border-primary hover:shadow-sm transition-all duration-200 p-card-padding flex flex-col items-center justify-center min-h-[240px] group col-span-1 row-span-1';
        btn.innerHTML = `<div class="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 pointer-events-none"><span class="material-symbols-outlined text-[24px]">add</span></div><span class="font-h2 text-h2 font-medium text-primary pointer-events-none">Criar Nova Nota</span>`;
        grids.dashboard.appendChild(btn);
    }

    pinned.length ? pinned.forEach(n => grids.pinned.appendChild(createNoteCard(n))) : (grids.pinned ? grids.pinned.innerHTML = '<p class="text-on-surface-variant col-span-full">Nenhuma nota encontrada.</p>' : null);
    archived.length ? archived.forEach(n => grids.archives.appendChild(createNoteCard(n))) : (grids.archives ? grids.archives.innerHTML = '<p class="text-on-surface-variant col-span-full">Arquivo vazio.</p>' : null);
};

// --- Estado do Modal ---
let tempPinned = false, tempArchived = false, tempColor = 'default', tempSize = 'normal', tempIsList = false;

const openModal = (id) => {
    const note = id ? notesData.find(n => n.id === id) : null;
    document.getElementById('modal-note-id').value = note ? note.id : '';
    document.getElementById('modal-title').value = note ? note.title : '';

    tempPinned = note ? note.is_pinned : false;
    tempArchived = note ? note.is_archived : false;
    tempColor = note ? (note.color || 'default') : 'default';
    tempSize = note ? (note.card_size || 'normal') : 'normal';
    tempIsList = note ? (note.is_list || false) : false;

    applyModalColors();
    updateIcons();

    // Injeta o conteúdo no lugar certo (Texto ou Lista)
    const contentText = note ? note.content : '';
    if (tempIsList) {
        renderListEditor(contentText);
    } else {
        document.getElementById('modal-body').value = contentText || '';
        toggleEditorMode(false);
    }

    document.getElementById('delete-note-btn').classList.toggle('hidden', !note);
    document.getElementById('color-popover').classList.add('hidden'); // Fecha paleta por padrão

    const modal = document.getElementById('full-note-modal');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    setTimeout(() => { modal.classList.remove('opacity-0'); document.getElementById('modal-content-box').classList.remove('scale-95'); }, 10);
};

// --- LÓGICA DE CORES ---
const setupColorPalette = () => {
    const popover = document.getElementById('color-popover');
    popover.innerHTML = KEEP_COLORS.map(c => `
        <button class="w-8 h-8 rounded-full border border-black/10 hover:scale-110 transition-transform ${c.name === tempColor ? 'ring-2 ring-primary ring-offset-1' : ''}" 
                style="background-color: ${c.value}" 
                data-color="${c.name}" title="${c.name}"></button>
    `).join('');

    popover.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            tempColor = e.target.dataset.color;
            applyModalColors();
            setupColorPalette(); // Re-renderiza para mudar o "ring" de seleção
            executeAutosave();
        });
    });
};

const applyModalColors = () => {
    const box = document.getElementById('modal-content-box');
    const bgColor = KEEP_COLORS.find(c => c.name === tempColor)?.value || 'var(--surface)';
    box.style.backgroundColor = bgColor;
};

// --- LÓGICA DE CHECKLIST (LIST MODE) ---
const toggleEditorMode = (toList) => {
    const textArea = document.getElementById('modal-body');
    const listContainer = document.getElementById('modal-list-container');

    if (toList) {
        // Converte texto para lista
        const text = textArea.value;
        renderListEditor(text);
        textArea.classList.add('hidden');
        listContainer.classList.remove('hidden');
        listContainer.classList.add('flex');
    } else {
        // Converte lista de volta para texto
        const items = Array.from(document.querySelectorAll('.list-item-row')).map(row => {
            const isChecked = row.querySelector('input[type="checkbox"]').checked;
            const text = row.querySelector('input[type="text"]').value;
            return `[${isChecked ? 'x' : ' '}] ${text}`;
        }).filter(t => t !== '[ ] '); // Remove linhas vazias

        textArea.value = items.join('\n');
        listContainer.classList.add('hidden');
        listContainer.classList.remove('flex');
        textArea.classList.remove('hidden');
    }
};

const renderListEditor = (rawText) => {
    const listContainer = document.getElementById('modal-list-container');
    listContainer.innerHTML = '';

    const lines = (rawText || '').split('\n').filter(l => l.trim() !== '');

    // Função para criar uma linha do checklist
    const addRow = (text = '', isChecked = false) => {
        const div = document.createElement('div');
        div.className = 'list-item-row flex items-center gap-3 group';
        div.innerHTML = `
            <input type="checkbox" class="sleek-checkbox" ${isChecked ? 'checked' : ''}>
            <input type="text" class="list-item-input flex-1 bg-transparent text-on-surface text-lg ${isChecked ? 'line-through opacity-50' : ''}" value="${text}" placeholder="Item da lista">
            <button class="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error transition-opacity js-remove-item"><span class="material-symbols-outlined text-[18px]">close</span></button>
        `;

        // Eventos da linha
        div.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
            const txt = div.querySelector('input[type="text"]');
            if (e.target.checked) txt.classList.add('line-through', 'opacity-50');
            else txt.classList.remove('line-through', 'opacity-50');
            executeAutosave();
        });

        div.querySelector('input[type="text"]').addEventListener('input', executeAutosave);

        // Se der ENTER num input, cria linha nova abaixo
        div.querySelector('input[type="text"]').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addRow();
            }
        });

        div.querySelector('.js-remove-item').addEventListener('click', () => {
            div.remove();
            executeAutosave();
        });

        listContainer.appendChild(div);
        div.querySelector('input[type="text"]').focus();
    };

    // Popula as linhas existentes
    lines.forEach(line => {
        const isChecked = line.startsWith('[x] ') || line.startsWith('[X] ');
        const cleanText = line.replace(/^\[[ x]\]\s*/i, '');
        addRow(cleanText, isChecked);
    });

    // Botão fixo no final para adicionar nova linha
    const btnAdd = document.createElement('button');
    btnAdd.className = 'flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mt-2 text-sm px-2 font-medium';
    btnAdd.innerHTML = `<span class="material-symbols-outlined text-[18px]">add</span> Adicionar item`;
    btnAdd.addEventListener('click', () => addRow());
    listContainer.appendChild(btnAdd);

    toggleEditorMode(true);
};

// Pega o conteúdo dependendo de qual modo estamos usando
const getModalContent = () => {
    if (tempIsList) {
        return Array.from(document.querySelectorAll('.list-item-row')).map(row => {
            const isChecked = row.querySelector('input[type="checkbox"]').checked;
            const text = row.querySelector('input[type="text"]').value;
            if (text.trim() === '') return null;
            return `[${isChecked ? 'x' : ' '}] ${text}`;
        }).filter(Boolean).join('\n');
    }
    return document.getElementById('modal-body').value.trim();
};

const updateIcons = () => {
    const pin = document.getElementById('modal-pin-icon');
    const arch = document.getElementById('modal-archive-icon');

    pin.style.fontVariationSettings = tempPinned ? "'FILL' 1" : "'FILL' 0";
    pin.classList.toggle('text-primary', tempPinned);

    arch.style.fontVariationSettings = tempArchived ? "'FILL' 1" : "'FILL' 0";
    arch.classList.toggle('text-primary', tempArchived);

    document.getElementById('btn-toggle-size').classList.toggle('text-primary', tempSize === 'large');
    document.getElementById('btn-toggle-list').classList.toggle('text-primary', tempIsList);
};

const executeAutosave = debounce(async () => {
    const idStr = document.getElementById('modal-note-id').value;
    const payload = {
        title: document.getElementById('modal-title').value.trim() || 'Sem título',
        content: getModalContent(),
        is_pinned: tempPinned,
        is_archived: tempArchived,
        color: tempColor,
        card_size: tempSize,
        is_list: tempIsList,
        date: new Date().toISOString()
    };

    if (idStr) {
        const id = parseInt(idStr);
        const index = notesData.findIndex(n => n.id === id);
        if (index > -1) notesData[index] = { ...notesData[index], ...payload };
        renderNotes();
        supabase.from('notes').update(payload).eq('id', id).then();
    } else {
        const { data } = await supabase.from('notes').insert([payload]).select();
        if (data && data.length > 0) {
            document.getElementById('modal-note-id').value = data[0].id;
            notesData.unshift(data[0]);
            renderNotes();
        }
    }
}, 800);

export const setupNotesLogic = () => {
    // Busca e Escuta
    document.getElementById('search-notes').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderNotes();
    });

    document.getElementById('modal-title').addEventListener('input', executeAutosave);
    document.getElementById('modal-body').addEventListener('input', executeAutosave);

    // Botões da Barra de Ferramentas
    document.getElementById('btn-color-palette').addEventListener('click', () => {
        const popover = document.getElementById('color-popover');
        popover.classList.toggle('hidden');
        popover.classList.toggle('grid');
        setupColorPalette();
    });

    document.getElementById('btn-toggle-size').addEventListener('click', () => {
        tempSize = tempSize === 'normal' ? 'large' : 'normal';
        updateIcons();
        executeAutosave();
    });

    document.getElementById('btn-toggle-list').addEventListener('click', () => {
        tempIsList = !tempIsList;
        toggleEditorMode(tempIsList);
        updateIcons();
        executeAutosave();
    });

    document.getElementById('modal-pin-btn').addEventListener('click', () => { tempPinned = !tempPinned; tempArchived = false; updateIcons(); executeAutosave(); });
    document.getElementById('modal-archive-btn').addEventListener('click', () => { tempArchived = !tempArchived; tempPinned = false; updateIcons(); executeAutosave(); });

    const closeModal = () => {
        const modal = document.getElementById('full-note-modal');
        modal.classList.add('opacity-0'); document.getElementById('modal-content-box').classList.add('scale-95');
        setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
    };

    document.getElementById('full-note-modal').addEventListener('click', (e) => {
        if (e.target.id === 'full-note-modal') closeModal();
    });

    document.getElementById('delete-note-btn').addEventListener('click', async () => {
        const isConfirmed = await showConfirm('Deletar Nota', 'Esta ação é irreversível. Deseja deletar esta nota permanentemente?');
        if (isConfirmed) {
            const id = parseInt(document.getElementById('modal-note-id').value);
            notesData = notesData.filter(n => n.id !== id);
            renderNotes();
            closeModal();
            supabase.from('notes').delete().eq('id', id).then();
        }
    });

    document.getElementById('close-modal-btn').addEventListener('click', closeModal);

    // FAB global listener
    document.addEventListener('click', (e) => {
        if (e.target.closest('.js-create-note')) {
            openModal(null);
        }
    });
};