const taskInput = document.getElementById('taskInput');
const addTaskButton = document.getElementById('addTaskButton');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const emptyState = document.getElementById('emptyState');

const STORAGE_KEY = 'todoListTasks';

function getTasks() {
    const tasksJSON = localStorage.getItem(STORAGE_KEY);
    return tasksJSON ? JSON.parse(tasksJSON) : [];
}

function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createConfetti() {
    const colors = ['confetti-green', 'confetti-orange', 'confetti-yellow'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti', colors[Math.floor(Math.random() * colors.length)]);
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDuration = (Math.random() * 1.5 + 4.5) + 's';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 6000);
    }
}

function showVictoryAnimation() {
    const victoryContainer = document.createElement('div');
    victoryContainer.classList.add('victory-container');
    victoryContainer.innerHTML = `
        <div class="victory-message">
            <span class="victory-emoji">✅</span>
            <br>
            Félicitation, <br>
            tu as réalisé tout ce que tu avais à faire !
        </div>
    `;
    
    document.body.appendChild(victoryContainer);
    createConfetti();
    
    setTimeout(() => {
        victoryContainer.remove();
    }, 3000);
}

function updateTaskCount() {
    const tasks = getTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const clearAllButton = document.getElementById('clearAllButton');
    
    if (total === 0) {
        taskCount.textContent = '0/0 tâche réalisée';
        emptyState.style.display = 'block';
        taskList.style.display = 'none';
        clearAllButton.style.display = 'none';
    } else if (completed === total) {
        taskCount.innerHTML = '<span style="animation: bounce 0.8s infinite;">📈 Toutes les tâches ont été réalisées !</span>';
        emptyState.style.display = 'none';
        taskList.style.display = 'block';
        clearAllButton.style.display = 'inline-block';
        showVictoryAnimation();
    } else {
        const pluriel = completed > 1 ? 's réalisées' : ' réalisée';
        taskCount.textContent = `${completed}/${total} tâche${pluriel}`;
        emptyState.style.display = 'none';
        taskList.style.display = 'block';
        clearAllButton.style.display = 'inline-block';
    }
}

function createTaskElement(task) {
    const li = document.createElement('li');
    if (task.completed) {
        li.classList.add('completed');
    }
    
    const taskContent = document.createElement('div');
    taskContent.classList.add('task-content');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.classList.add('task-checkbox');
    checkbox.addEventListener('change', () => {
        toggleTaskCompletion(task.text);
    });

    const taskText = document.createElement('span');
    taskText.classList.add('task-text');
    taskText.textContent = task.text;

    taskContent.addEventListener('click', (event) => {
        if (!event.target.classList.contains('delete-button')) {
            toggleTaskCompletion(task.text);
        }
    });

    taskContent.appendChild(checkbox);
    taskContent.appendChild(taskText);

    const taskActions = document.createElement('div');
    taskActions.classList.add('task-actions');

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.textContent = 'Supprimer';
    deleteButton.addEventListener('click', () => {
        deleteTask(task.text);
    });

    taskActions.appendChild(deleteButton);

    li.appendChild(taskContent);
    li.appendChild(taskActions);

    return li;
}

function renderTasks() {
    taskList.innerHTML = '';
    const tasks = getTasks();
    
    tasks.forEach(task => {
        const li = createTaskElement(task);
        taskList.appendChild(li);
    });
    
    updateTaskCount();
}

function addTask() {
    const text = taskInput.value.trim();

    if (text === '') {
        taskInput.focus();
        return;
    }

    const tasks = getTasks();
    
    if (tasks.some(task => task.text === text)) {
        alert('Cette tâche existe déjà.');
        return;
    }
    
    tasks.push({ text: text, completed: false });
    saveTasks(tasks);
    renderTasks();
    taskInput.value = '';
    taskInput.focus();
}

function deleteTask(text) {
    let tasks = getTasks();
    tasks = tasks.filter(task => task.text !== text);
    saveTasks(tasks);
    renderTasks();
}

function toggleTaskCompletion(text) {
    const tasks = getTasks();
    const taskIndex = tasks.findIndex(task => task.text === text);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks(tasks);
        renderTasks();
    }
}

function clearAllTasks() {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les tâches ?')) {
        saveTasks([]);
        renderTasks();
    }
}

const clearAllButton = document.getElementById('clearAllButton');
addTaskButton.addEventListener('click', addTask);
clearAllButton.addEventListener('click', clearAllTasks);
taskInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addTask();
    }
});

document.addEventListener('DOMContentLoaded', renderTasks);