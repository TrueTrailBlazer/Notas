import { supabase } from './api.js';
import { showConfirm } from './ui.js';

let notesData = [];
let autosaveTimeout;

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

const createNoteCard = (note) => {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note-block bg-surface rounded-xl border border-outline-variant p-card-padding ambient-shadow-level-1 relative group flex flex-col justify-between cursor-pointer min-h-[240px]';

    let icon = note.is_pinned ? `<span class="material-symbols-outlined text-primary text-sm ml-2">push_pin</span>` :
        (note.is_archived ? `<span class="material-symbols-outlined text-on-surface-variant text-sm ml-2">inventory_2</span>` : '');

    noteDiv.innerHTML = `
        <div class="flex justify-between items-start">
            <h3 class="font-h2 text-h2 font-medium text-on-background flex items-center">${note.title || 'Sem título'} ${icon}</h3>
            <button class="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-surface-container rounded-full">
                <span class="material-symbols-outlined pointer-events-none">open_in_new</span>
            </button>
        </div>
        <div class="mt-4 flex-1">
            <p class="font-body-md text-body-md text-on-surface-variant line-clamp-4 w-full overflow-hidden text-ellipsis whitespace-pre-wrap">${note.content || ''}</p>
        </div>
        <div class="mt-4 flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
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

    const active = notesData.filter(n => !n.is_archived);
    const pinned = notesData.filter(n => n.is_pinned && !n.is_archived);
    const archived = notesData.filter(n => n.is_archived);

    active.forEach(n => grids.dashboard.appendChild(createNoteCard(n)));

    const btn = document.createElement('button');
    btn.className = 'bg-surface-container-low rounded-xl border border-dashed border-primary/50 hover:bg-surface hover:border-primary hover:shadow-sm transition-all duration-200 p-card-padding flex flex-col items-center justify-center min-h-[240px] group';
    btn.innerHTML = `<div class="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200"><span class="material-symbols-outlined text-[24px]">add</span></div><span class="font-h2 text-h2 font-medium text-primary">Criar Nova Nota</span>`;
    btn.addEventListener('click', () => openModal(null));
    grids.dashboard.appendChild(btn);

    pinned.length ? pinned.forEach(n => grids.pinned.appendChild(createNoteCard(n))) : (grids.pinned ? grids.pinned.innerHTML = '<p class="text-on-surface-variant col-span-full">Nenhuma nota fixada.</p>' : null);
    archived.length ? archived.forEach(n => grids.archives.appendChild(createNoteCard(n))) : (grids.archives ? grids.archives.innerHTML = '<p class="text-on-surface-variant col-span-full">Seu arquivo está vazio.</p>' : null);
};

// --- Modal & Autosave (Optimistic UI - Zero Lag) ---
let tempPinned = false, tempArchived = false;

const openModal = (id) => {
    const note = id ? notesData.find(n => n.id === id) : null;
    document.getElementById('modal-note-id').value = note ? note.id : '';
    document.getElementById('modal-title').value = note ? note.title : '';
    document.getElementById('modal-body').value = note ? note.content : '';

    tempPinned = note ? note.is_pinned : false;
    tempArchived = note ? note.is_archived : false;

    document.getElementById('delete-note-btn').classList.toggle('hidden', !note);
    ['modal-pin-btn', 'modal-archive-btn', 'modal-divider'].forEach(id => document.getElementById(id).classList.remove('hidden'));
    updateIcons();

    const modal = document.getElementById('full-note-modal');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    setTimeout(() => { modal.classList.remove('opacity-0'); document.getElementById('modal-content-box').classList.remove('scale-95'); }, 10);
};

const updateIcons = () => {
    const pin = document.getElementById('modal-pin-icon');
    const arch = document.getElementById('modal-archive-icon');
    pin.style.fontVariationSettings = tempPinned ? "'FILL' 1" : "'FILL' 0";
    pin.classList.toggle('text-primary', tempPinned);
    arch.style.fontVariationSettings = tempArchived ? "'FILL' 1" : "'FILL' 0";
    arch.classList.toggle('text-primary', tempArchived);
};

const executeAutosave = debounce(async () => {
    const idStr = document.getElementById('modal-note-id').value;
    const payload = {
        title: document.getElementById('modal-title').value.trim() || 'Sem título',
        content: document.getElementById('modal-body').value.trim(),
        is_pinned: tempPinned, is_archived: tempArchived, date: new Date().toISOString()
    };

    if (idStr) {
        const id = parseInt(idStr);
        // Atualiza a memória instantaneamente para zerar o lag
        const index = notesData.findIndex(n => n.id === id);
        if (index > -1) notesData[index] = { ...notesData[index], ...payload };
        renderNotes(); // Atualiza a grid por trás sem travar a tela

        // Salva no banco no background
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
    document.getElementById('modal-title').addEventListener('input', executeAutosave);
    document.getElementById('modal-body').addEventListener('input', executeAutosave);

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
            renderNotes(); // UI rápida
            closeModal();
            supabase.from('notes').delete().eq('id', id).then(); // Background
        }
    });

    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);
    document.getElementById('fab-add-note').addEventListener('click', () => openModal(null));
};