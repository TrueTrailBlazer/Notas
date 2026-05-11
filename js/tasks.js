import { supabase } from './api.js';
import { showConfirm } from './ui.js';

let tasksData = { fixed: [], new: [] };
let selectedDate = new Date();
let sortableFixed, sortableNew;

const fixedList = document.getElementById('fixed-tasks-list');
const newList = document.getElementById('new-tasks-list');
const taskInput = document.getElementById('new-task-input');

const taskModal = document.getElementById('task-modal');
const taskModalBox = document.getElementById('task-modal-box');
const editIdInput = document.getElementById('task-edit-id');
const editTextInput = document.getElementById('task-edit-input');
const editFixedCheckbox = document.getElementById('task-edit-fixed');

const formatDateForDB = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const fetchTasks = async (date = new Date()) => {
    selectedDate = date;
    const dateStr = formatDateForDB(selectedDate);

    // 1. Busca as tarefas (fixas ou criadas no dia selecionado)
    const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .or(`is_fixed.eq.true,created_date.eq.${dateStr}`)
        .order('order_index', { ascending: true });

    if (tasksError) {
        console.error('Erro ao buscar tarefas:', tasksError);
        return;
    }

    // 2. Busca o estado de conclusão para esse dia específico
    const { data: completions, error: compError } = await supabase
        .from('task_completions')
        .select('*')
        .eq('completed_date', dateStr);

    if (compError) {
        console.error('Erro ao buscar conclusões:', compError);
        return;
    }

    // Mapeia o estado de conclusão para cada tarefa
    const taskList = tasks.map(t => {
        const completion = completions.find(c => c.task_id === t.id);
        return {
            ...t,
            completed: completion ? completion.completed : false
        };
    });

    tasksData.fixed = taskList.filter(t => t.is_fixed).sort((a, b) => a.order_index - b.order_index);
    tasksData.new = taskList.filter(t => !t.is_fixed).sort((a, b) => a.order_index - b.order_index);
    renderTasks();
};

const renderTasks = () => {
    const createHtml = (task) => `
        <li class="flex items-start gap-3 group relative bg-transparent hover:bg-surface-container-low p-2 rounded-lg transition-colors border border-transparent hover:border-outline-variant cursor-grab active:cursor-grabbing" data-id="${task.id}">
            <div class="mt-0.5 flex-shrink-0">
                <input class="sleek-checkbox" type="checkbox" ${task.completed ? 'checked' : ''} data-action="toggle" data-id="${task.id}"/>
            </div>
            <label class="font-body-md text-sm text-on-surface cursor-pointer flex-1 transition-colors duration-200 line-clamp-3 break-words leading-snug ${task.completed ? 'line-through opacity-50' : ''}" data-action="toggle" data-id="${task.id}" title="${task.text}">${task.text}</label>
            <button class="flex-shrink-0 ml-auto text-on-surface-variant hover:text-primary p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" data-action="edit" data-id="${task.id}" title="Gerenciar">
                <span class="material-symbols-outlined text-[18px] pointer-events-none">edit_note</span>
            </button>
        </li>
    `;

    fixedList.innerHTML = tasksData.fixed.map(createHtml).join('');
    newList.innerHTML = tasksData.new.map(createHtml).join('');
    
    setupSortable();
};

const setupSortable = () => {
    if (sortableFixed) sortableFixed.destroy();
    if (sortableNew) sortableNew.destroy();

    const sortOptions = {
        animation: 150,
        ghostClass: 'opacity-40',
        onEnd: async (evt) => {
            const list = evt.to;
            const items = Array.from(list.querySelectorAll('li[data-id]'));
            const isFixedList = list.id === 'fixed-tasks-list';
            
            const updates = items.map((el, index) => ({
                id: parseInt(el.dataset.id),
                order_index: index
            }));

            // Sincroniza localmente
            updates.forEach(u => {
                const arr = isFixedList ? tasksData.fixed : tasksData.new;
                const t = arr.find(x => x.id === u.id);
                if (t) t.order_index = u.order_index;
            });

            // Re-ordena os arrays internos
            if (isFixedList) tasksData.fixed.sort((a, b) => a.order_index - b.order_index);
            else tasksData.new.sort((a, b) => a.order_index - b.order_index);

            // Sincroniza com Supabase
            try {
                for (const u of updates) {
                    await supabase.from('tasks').update({ order_index: u.order_index }).eq('id', u.id);
                }
            } catch (err) {
                console.error('Erro ao salvar ordem:', err);
            }
        }
    };

    sortableFixed = new Sortable(fixedList, sortOptions);
    sortableNew = new Sortable(newList, sortOptions);
};

const openTaskModal = (id) => {
    const task = tasksData.fixed.find(t => t.id === id) || tasksData.new.find(t => t.id === id);
    if (!task) return;

    editIdInput.value = task.id;
    editTextInput.value = task.text;
    editFixedCheckbox.checked = task.is_fixed;

    taskModal.classList.remove('hidden');
    taskModal.classList.add('flex');
    setTimeout(() => {
        taskModal.classList.remove('opacity-0');
        taskModalBox.classList.remove('scale-95');
        editTextInput.focus();
    }, 10);
};

const closeTaskModal = () => {
    taskModal.classList.add('opacity-0');
    taskModalBox.classList.add('scale-95');
    setTimeout(() => {
        taskModal.classList.add('hidden');
        taskModal.classList.remove('flex');
    }, 300);
};

const saveTaskFromModal = async () => {
    const id = parseInt(editIdInput.value);
    const newText = editTextInput.value.trim();
    const isFixed = editFixedCheckbox.checked;

    if (!newText) return;

    let task = tasksData.fixed.find(t => t.id === id) || tasksData.new.find(t => t.id === id);
    if (!task) return;

    task.text = newText;
    const changedFixState = task.is_fixed !== isFixed;
    task.is_fixed = isFixed;

    if (changedFixState) {
        if (isFixed) {
            tasksData.new = tasksData.new.filter(t => t.id !== id);
            tasksData.fixed.push(task);
            tasksData.fixed.sort((a, b) => a.order_index - b.order_index);
        } else {
            tasksData.fixed = tasksData.fixed.filter(t => t.id !== id);
            tasksData.new.push(task);
            tasksData.new.sort((a, b) => a.order_index - b.order_index);
        }
    }

    renderTasks();
    closeTaskModal();
    await supabase.from('tasks').update({ text: newText, is_fixed: isFixed }).eq('id', id);
};

const deleteTaskFromModal = async () => {
    const isConfirmed = await showConfirm('Deletar Tarefa', 'Tem certeza que deseja apagar esta tarefa?');
    if (isConfirmed) {
        const id = parseInt(editIdInput.value);
        tasksData.fixed = tasksData.fixed.filter(t => t.id !== id);
        tasksData.new = tasksData.new.filter(t => t.id !== id);
        renderTasks();
        closeTaskModal();
        await supabase.from('tasks').delete().eq('id', id);
    }
};

const handleTaskAction = async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const id = parseInt(target.dataset.id);

    if (action === 'toggle') {
        let task = tasksData.fixed.find(t => t.id === id) || tasksData.new.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            renderTasks();
            
            const dateStr = formatDateForDB(selectedDate);
            console.log(`Togglig task ${id} for date ${dateStr}. New state: ${task.completed}`);
            
            try {
                // Tenta encontrar um registro existente para este dia
                const { data: existing, error: findError } = await supabase
                    .from('task_completions')
                    .select('*')
                    .eq('task_id', id)
                    .eq('completed_date', dateStr)
                    .maybeSingle();

                if (findError) throw findError;

                if (existing) {
                    const { error: updError } = await supabase
                        .from('task_completions')
                        .update({ completed: task.completed })
                        .eq('id', existing.id);
                    if (updError) throw updError;
                } else {
                    const { error: insError } = await supabase
                        .from('task_completions')
                        .insert([{ 
                            task_id: id, 
                            completed_date: dateStr, 
                            completed: task.completed 
                        }]);
                    if (insError) throw insError;
                }
                console.log('Estado de conclusão salvo com sucesso.');
            } catch (err) {
                console.error('Erro crítico ao salvar conclusão:', err);
                // Opcional: Reverter estado na UI se falhar? 
                // task.completed = !task.completed; renderTasks();
            }
        }
    } else if (action === 'edit') {
        openTaskModal(id);
    }
};

export const setupTasksLogic = () => {
    fixedList.addEventListener('click', handleTaskAction);
    newList.addEventListener('click', handleTaskAction);

    document.getElementById('task-cancel-btn').addEventListener('click', closeTaskModal);
    document.getElementById('task-save-btn').addEventListener('click', saveTaskFromModal);
    document.getElementById('task-delete-btn').addEventListener('click', deleteTaskFromModal);

    taskModal.addEventListener('click', (e) => {
        if (e.target.id === 'task-modal') closeTaskModal();
    });

    const addTask = async () => {
        const text = taskInput.value.trim();
        if (text) {
            taskInput.value = '';
            const dateStr = formatDateForDB(selectedDate);
            const maxOrder = Math.max(...[...tasksData.fixed, ...tasksData.new].map(t => t.order_index || 0), -1);
            
            const { data, error } = await supabase
                .from('tasks')
                .insert([{ 
                    text: text, 
                    is_fixed: false, 
                    created_date: dateStr,
                    order_index: maxOrder + 1
                }])
                .select();

            if (!error) {
                tasksData.new.push({ ...data[0], completed: false });
                tasksData.new.sort((a, b) => a.order_index - b.order_index);
                renderTasks();
            }
        }
    };

    document.getElementById('add-task-btn').addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

    document.getElementById('clear-new-tasks').addEventListener('click', async () => {
        const isConfirmed = await showConfirm('Limpar Tarefas', 'Tem certeza que deseja apagar todas as tarefas não-fixas deste dia?');
        if (isConfirmed) {
            const dateStr = formatDateForDB(selectedDate);
            await supabase.from('tasks').delete().eq('is_fixed', false).eq('created_date', dateStr);
            tasksData.new = [];
            renderTasks();
        }
    });

    // Escuta mudanças de data do calendário
    document.addEventListener('dateChanged', (e) => {
        fetchTasks(e.detail.date);
    });
};