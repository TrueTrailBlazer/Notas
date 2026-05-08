import { supabase } from './api.js';
import { showConfirm } from './ui.js';

let tasksData = { fixed: [], new: [] };
const fixedList = document.getElementById('fixed-tasks-list');
const newList = document.getElementById('new-tasks-list');
const taskInput = document.getElementById('new-task-input');

const taskModal = document.getElementById('task-modal');
const taskModalBox = document.getElementById('task-modal-box');
const editIdInput = document.getElementById('task-edit-id');
const editTextInput = document.getElementById('task-edit-input');
const editFixedCheckbox = document.getElementById('task-edit-fixed');

export const checkDailyReset = async () => {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('mindspace_last_reset');

    if (lastReset !== today) {
        await supabase.from('tasks').update({ completed: false }).eq('is_fixed', true);
        localStorage.setItem('mindspace_last_reset', today);
    }
};

export const fetchTasks = async () => {
    await checkDailyReset();
    const { data, error } = await supabase.from('tasks').select('*').order('id');
    if (!error && data) {
        tasksData.fixed = data.filter(t => t.is_fixed);
        tasksData.new = data.filter(t => !t.is_fixed);
        renderTasks();
    }
};

const renderTasks = () => {
    const createHtml = (task) => `
        <li class="flex items-start gap-3 group relative bg-transparent hover:bg-surface-container-low p-2 rounded-lg transition-colors border border-transparent hover:border-outline-variant">
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
        } else {
            tasksData.fixed = tasksData.fixed.filter(t => t.id !== id);
            tasksData.new.push(task);
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
            await supabase.from('tasks').update({ completed: task.completed }).eq('id', id);
        }
    } else if (action === 'edit') {
        openTaskModal(id);
    }
};

export const setupTasksLogic = () => {
    fixedList.addEventListener('click', handleTaskAction);
    newList.addEventListener('click', handleTaskAction);
    fixedList.addEventListener('change', handleTaskAction);
    newList.addEventListener('change', handleTaskAction);

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
            const { data, error } = await supabase.from('tasks').insert([{ text: text, is_fixed: false }]).select();
            if (!error) {
                tasksData.new.push(data[0]);
                renderTasks();
            }
        }
    };

    document.getElementById('add-task-btn').addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

    document.getElementById('clear-new-tasks').addEventListener('click', async () => {
        const isConfirmed = await showConfirm('Limpar Tarefas', 'Tem certeza que deseja apagar todas as tarefas não-fixas?');
        if (isConfirmed) {
            await supabase.from('tasks').delete().eq('is_fixed', false);
            tasksData.new = [];
            renderTasks();
        }
    });
};