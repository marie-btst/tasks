// 1. Récupération des éléments du DOM
const taskInput = document.getElementById('taskInput');
const addTaskButton = document.getElementById('addTaskButton');
const taskList = document.getElementById('taskList');

const STORAGE_KEY = 'todoListTasks';

// --- Nouvelles fonctions pour les Émojis ---

/**
 * Tente d'associer un émoji au texte de la tâche.
 * @param {string} text - Le texte de la tâche.
 * @returns {string} L'émoji correspondant ou un émoji par défaut.
 */
function getEmojiForTask(text) {
    const lowerText = text.toLowerCase();
    
    // Vous pouvez ajouter autant de règles que vous voulez ici !
    if (lowerText.includes('coder') || lowerText.includes('code') || lowerText.includes('dev')) return '💻';
    if (lowerText.includes('sport') || lowerText.includes('exercice') || lowerText.includes('courir')) return '🏃';
    if (lowerText.includes('manger') || lowerText.includes('courses') || lowerText.includes('cuisine')) return '🍔';
    if (lowerText.includes('dormir')) return '😴';
    if (lowerText.includes('livre') || lowerText.includes('lire')) return '📚';
    if (lowerText.includes('réunion') || lowerText.includes('email')) return '📧';
    
    // Émoji par défaut
    return '📌'; 
}


// --- Fonctions de Stockage Local (Identiques) ---

function getTasks() {
    const tasksJSON = localStorage.getItem(STORAGE_KEY);
    return tasksJSON ? JSON.parse(tasksJSON) : [];
}

function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// --- Fonctions de Gestion des Tâches (Mises à jour) ---

/**
 * Crée un élément <li> pour une tâche donnée, incluant la checkbox et l'émoji.
 * @param {Object} task - L'objet tâche {text: string, completed: boolean}.
 * @returns {HTMLLIElement} L'élément <li> créé.
 */
function createTaskElement(task) {
    const li = document.createElement('li');
    if (task.completed) {
        li.classList.add('completed');
    }
    
    // --- Conteneur de contenu (Checkbox, Émoji, Texte) ---
    const taskContent = document.createElement('div');
    taskContent.classList.add('task-content');

    // 1. Création de la Checkbox (Input type checkbox)
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.classList.add('task-checkbox');

    // Événement pour basculer l'état au clic sur la checkbox
    checkbox.addEventListener('change', () => {
        toggleTaskCompletion(task.text);
    });
    
    // 2. Création de l'Émoji
    const taskIcon = document.createElement('span');
    taskIcon.classList.add('task-icon');
    // Utilisation de la nouvelle fonction pour obtenir l'émoji
    taskIcon.textContent = getEmojiForTask(task.text); 

    // 3. Création du Texte de la tâche
    const taskText = document.createElement('span');
    taskText.classList.add('task-text');
    taskText.textContent = task.text;

    // Événement pour basculer l'état au clic sur le texte (comme avant)
    taskContent.addEventListener('click', (event) => {
        // Assurez-vous que le clic n'est pas sur le bouton Supprimer
        if (!event.target.classList.contains('delete-button')) {
            toggleTaskCompletion(task.text);
        }
    });

    // Assemblage du contenu
    taskContent.appendChild(checkbox);
    taskContent.appendChild(taskIcon);
    taskContent.appendChild(taskText);

    // --- Bouton de Suppression (Identique) ---
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.textContent = 'Supprimer';

    deleteButton.addEventListener('click', () => {
        deleteTask(task.text);
    });

    // Assemblage final de l'élément <li>
    li.appendChild(taskContent);
    li.appendChild(deleteButton);

    return li;
}

/**
 * Affiche toutes les tâches actuelles dans le DOM. (Identique)
 */
function renderTasks() {
    taskList.innerHTML = '';
    const tasks = getTasks();
    
    tasks.forEach(task => {
        const li = createTaskElement(task);
        taskList.appendChild(li);
    });
}

/**
 * Ajoute une nouvelle tâche. (Identique)
 */
function addTask() {
    const text = taskInput.value.trim();

    if (text === '') {
        alert('Veuillez entrer une tâche !');
        return;
    }

    const tasks = getTasks();
    
    // Vérifie si la tâche existe déjà (pour ne pas avoir de doublons pour la clé de suppression)
    if (tasks.some(task => task.text === text)) {
        alert('Cette tâche existe déjà.');
        return;
    }
    
    tasks.push({ text: text, completed: false });
    
    saveTasks(tasks);
    renderTasks();
    
    taskInput.value = '';
}

/**
 * Supprime une tâche. (Identique)
 */
function deleteTask(text) {
    let tasks = getTasks();
    tasks = tasks.filter(task => task.text !== text);
    saveTasks(tasks);
    renderTasks();
}

/**
 * Bascule l'état "terminée" d'une tâche. (Identique)
 */
function toggleTaskCompletion(text) {
    const tasks = getTasks();
    
    const taskIndex = tasks.findIndex(task => task.text === text);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks(tasks);
        renderTasks(); // IMPORTANT : Re-render pour mettre à jour la classe CSS
    }
}


// --- Écouteurs d'Événements et Initialisation (Identiques) ---

addTaskButton.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addTask();
    }
});

document.addEventListener('DOMContentLoaded', renderTasks);