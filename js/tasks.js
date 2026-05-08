import { supabase } from './api.js';
import { showConfirm, showPrompt } from './ui.js';

let tasksData = { fixed: [], new: [] };
const fixedList = document.getElementById('fixed-tasks-list');
const newList = document.getElementById('new-tasks-list');
const taskInput = document.getElementById('new-task-input');

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
        <li class="flex items-center gap-3 group relative bg-surface hover:bg-surface-container-low p-2 -mx-2 rounded-lg transition-colors">
            <input class="sleek-checkbox" type="checkbox" ${task.completed ? 'checked' : ''} data-action="toggle" data-id="${task.id}"/>
            <label class="font-body-md text-body-md text-on-surface cursor-pointer flex-1 transition-colors duration-200 ${task.completed ? 'line-through opacity-60' : ''}" data-action="toggle" data-id="${task.id}">${task.text}</label>
            
            <div class="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                <button class="text-on-surface-variant hover:text-primary p-1 rounded hover:bg-surface-container" data-action="edit" data-id="${task.id}" title="Editar">
                    <span class="material-symbols-outlined text-[18px] pointer-events-none">edit</span>
                </button>
                <button class="text-on-surface-variant hover:text-primary p-1 rounded hover:bg-surface-container" data-action="pin" data-id="${task.id}" title="${task.is_fixed ? 'Remover Fixação' : 'Fixar Tarefa'}">
                    <span class="material-symbols-outlined text-[18px] pointer-events-none">${task.is_fixed ? 'push_pin' : 'keep'}</span>
                </button>
                <button class="text-on-surface-variant hover:text-error p-1 rounded hover:bg-error-container" data-action="delete" data-id="${task.id}" title="Deletar">
                    <span class="material-symbols-outlined text-[18px] pointer-events-none">delete</span>
                </button>
            </div>
        </li>
    `;

    fixedList.innerHTML = tasksData.fixed.map(createHtml).join('');
    newList.innerHTML = tasksData.new.map(createHtml).join('');
};

const handleTaskAction = async (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const id = parseInt(target.dataset.id);
    let task = tasksData.fixed.find(t => t.id === id) || tasksData.new.find(t => t.id === id);
    if (!task) return;

    if (action === 'toggle') {
        task.completed = !task.completed;
        renderTasks(); // Fast UI update
        await supabase.from('tasks').update({ completed: task.completed }).eq('id', id);
    }
    else if (action === 'edit') {
        const newText = await showPrompt('Editar Tarefa', task.text);
        if (newText && newText.trim() !== '') {
            task.text = newText.trim();
            renderTasks();
            await supabase.from('tasks').update({ text: task.text }).eq('id', id);
        }
    }
    else if (action === 'pin') {
        task.is_fixed = !task.is_fixed;
        // Move entre as listas locais
        if (task.is_fixed) { tasksData.new = tasksData.new.filter(t => t.id !== id); tasksData.fixed.push(task); }
        else { tasksData.fixed = tasksData.fixed.filter(t => t.id !== id); tasksData.new.push(task); }
        renderTasks();
        await supabase.from('tasks').update({ is_fixed: task.is_fixed }).eq('id', id);
    }
    else if (action === 'delete') {
        const isConfirmed = await showConfirm('Deletar Tarefa', 'Quer mesmo apagar esta tarefa?');
        if (isConfirmed) {
            tasksData.fixed = tasksData.fixed.filter(t => t.id !== id);
            tasksData.new = tasksData.new.filter(t => t.id !== id);
            renderTasks();
            await supabase.from('tasks').delete().eq('id', id);
        }
    }
};

export const setupTasksLogic = () => {
    fixedList.addEventListener('click', handleTaskAction);
    newList.addEventListener('click', handleTaskAction);
    fixedList.addEventListener('change', handleTaskAction); // Para o checkbox
    newList.addEventListener('change', handleTaskAction);   // Para o checkbox

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