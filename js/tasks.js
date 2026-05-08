import { supabase } from './api.js';

let tasksData = { fixed: [], new: [] };
const fixedList = document.getElementById('fixed-tasks-list');
const newList = document.getElementById('new-tasks-list');
const taskInput = document.getElementById('new-task-input');

export const checkDailyReset = async () => {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('mindspace_last_reset');

    // Se mudou de dia, reseta todas as tarefas fixas para pendentes
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
        <li class="flex items-center gap-3 group">
            <input class="sleek-checkbox rounded" id="task-${task.id}" type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}"/>
            <label class="font-body-md text-body-md text-on-surface cursor-pointer group-hover:text-primary transition-colors duration-200 ${task.completed ? 'line-through opacity-60' : ''}" for="task-${task.id}">${task.text}</label>
        </li>
    `;

    fixedList.innerHTML = tasksData.fixed.map(createHtml).join('');
    newList.innerHTML = tasksData.new.map(createHtml).join('');

    // Adiciona os listeners nos checkboxes (em módulos, funções globais inline no HTML não funcionam bem)
    document.querySelectorAll('.sleek-checkbox').forEach(box => {
        box.addEventListener('change', (e) => toggleTask(e.target.dataset.id));
    });
};

const toggleTask = async (id) => {
    const taskId = parseInt(id);
    let task = tasksData.fixed.find(t => t.id === taskId) || tasksData.new.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        renderTasks(); // Optimistic UI
        await supabase.from('tasks').update({ completed: task.completed }).eq('id', taskId);
    }
};

export const setupTasksLogic = () => {
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
        if (confirm('Limpar todas as tarefas não-fixas?')) {
            await supabase.from('tasks').delete().eq('is_fixed', false);
            tasksData.new = [];
            renderTasks();
        }
    });
};