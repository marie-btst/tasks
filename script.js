const taskInput = document.getElementById('taskInput');
const addTaskButton = document.getElementById('addTaskButton');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const emptyState = document.getElementById('emptyState');

const STORAGE_KEY = 'todoListTasks';

/**
 * Retourne l'emoji correspondant au texte de la tâche
 * @param {string} text - Le texte de la tâche
 * @returns {string} L'emoji correspondant
 */
function getEmojiForTask(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('coder') || lowerText.includes('code') || lowerText.includes('dev')) return '💻';
    if (lowerText.includes('sport') || lowerText.includes('exercice') || lowerText.includes('courir') || lowerText.includes('courir')) return '🏃';
    if (lowerText.includes('manger') || lowerText.includes('courses') || lowerText.includes('cuisine')) return '🍔';
    if (lowerText.includes('dormir')) return '😴';
    if (lowerText.includes('livre') || lowerText.includes('lire')) return '📚';
    if (lowerText.includes('réunion') || lowerText.includes('email')) return '📧';
    if (lowerText.includes('appel') || lowerText.includes('téléphone')) return '☎️';
    if (lowerText.includes('achat') || lowerText.includes('shopping')) return '🛍️';
    if (lowerText.includes('travail') || lowerText.includes('job')) return '💼';
    
    return '📌'; 
}

/**
 * Récupère les tâches du localStorage
 * @returns {Array} Tableau des tâches
 */
function getTasks() {
    const tasksJSON = localStorage.getItem(STORAGE_KEY);
    return tasksJSON ? JSON.parse(tasksJSON) : [];
}

/**
 * Sauvegarde les tâches dans le localStorage
 * @param {Array} tasks - Tableau des tâches à sauvegarder
 */
function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Met à jour le compteur de tâches
 */
function updateTaskCount() {
    const tasks = getTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const clearAllButton = document.getElementById('clearAllButton');
    
    if (total === 0) {
        taskCount.textContent = '0 tâche';
        emptyState.style.display = 'block';
        taskList.style.display = 'none';
        clearAllButton.style.display = 'none';
    } else {
        const remaining = total - completed;
        taskCount.textContent = `${remaining}/${total} tâche${total > 1 ? 's' : ''}`;
        emptyState.style.display = 'none';
        taskList.style.display = 'block';
        clearAllButton.style.display = 'inline-block';
    }
}

/**
 * Crée un élément <li> pour une tâche
 * @param {Object} task - L'objet tâche {text: string, completed: boolean}
 * @returns {HTMLLIElement} L'élément <li> créé
 */
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
    
    const taskIcon = document.createElement('span');
    taskIcon.classList.add('task-icon');
    taskIcon.textContent = getEmojiForTask(task.text); 

    const taskText = document.createElement('span');
    taskText.classList.add('task-text');
    taskText.textContent = task.text;

    taskContent.addEventListener('click', (event) => {
        if (!event.target.classList.contains('delete-button')) {
            toggleTaskCompletion(task.text);
        }
    });

    taskContent.appendChild(checkbox);
    taskContent.appendChild(taskIcon);
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

/**
 * Affiche toutes les tâches actuelles dans le DOM
 */
function renderTasks() {
    taskList.innerHTML = '';
    const tasks = getTasks();
    
    tasks.forEach(task => {
        const li = createTaskElement(task);
        taskList.appendChild(li);
    });
    
    updateTaskCount();
}

/**
 * Ajoute une nouvelle tâche
 */
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

/**
 * Supprime une tâche
 * @param {string} text - Le texte de la tâche à supprimer
 */
function deleteTask(text) {
    let tasks = getTasks();
    tasks = tasks.filter(task => task.text !== text);
    saveTasks(tasks);
    renderTasks();
}

/**
 * Bascule l'état "complétée" d'une tâche
 * @param {string} text - Le texte de la tâche
 */
function toggleTaskCompletion(text) {
    const tasks = getTasks();
    const taskIndex = tasks.findIndex(task => task.text === text);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks(tasks);
        renderTasks();
    }
}

/**
 * Supprime toutes les tâches après confirmation
 */
function clearAllTasks() {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les tâches ?')) {
        saveTasks([]);
        renderTasks();
    }
}

// Écouteurs d'événements
const clearAllButton = document.getElementById('clearAllButton');
addTaskButton.addEventListener('click', addTask);
clearAllButton.addEventListener('click', clearAllTasks);
taskInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addTask();
    }
});

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', renderTasks);