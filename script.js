const STORAGE_KEY = 'taskmaster_tasks';
const CATEGORIES_KEY = 'taskmaster_categories';
const SETTINGS_KEY = 'taskmaster_settings';

let tasks = [];
let categories = [
    { id: 'personal', name: 'Personnel', icon: '🏠', removable: false },
    { id: 'work', name: 'Travail', icon: '💼', removable: false },
    { id: 'urgent', name: 'Urgent', icon: '⚡', removable: false }
];
let currentFilter = 'all';
let currentCategory = 'all';
let currentView = 'list';
let editingTaskId = null;

// Initialisation
function init() {
    loadData();
    setupEventListeners();
    checkNotifications();
    renderCategories();
    renderTasks();
    updateStats();
    applyTheme();
    setInterval(checkNotifications, 60000);
}

function loadData() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);
        tasks = savedTasks ? JSON.parse(savedTasks) : [];
        
        const savedCategories = localStorage.getItem(CATEGORIES_KEY);
        if (savedCategories) {
            const parsed = JSON.parse(savedCategories);
            // Fusionner avec les catégories par défaut
            const defaultIds = categories.map(c => c.id);
            const customCategories = parsed.filter(c => !defaultIds.includes(c.id));
            categories = [...categories, ...customCategories];
        }
    } catch (e) {
        console.error('Erreur de chargement:', e);
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.error('Erreur de sauvegarde:', e);
    }
}

function saveCategories() {
    try {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    } catch (e) {
        console.error('Erreur de sauvegarde catégories:', e);
    }
}

function setupEventListeners() {
    // Ajout de tâche
    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Recherche
    document.getElementById('searchBar').addEventListener('input', (e) => {
        renderTasks(e.target.value);
    });

    // Filtres
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderTasks();
        });
    });

    // Vues
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentView = e.target.dataset.view;
            renderTasks();
        });
    });

    // Thème
    document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);

    // Modal tâche
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('saveTaskBtn').addEventListener('click', saveEditedTask);
    document.getElementById('taskModal').addEventListener('click', (e) => {
        if (e.target.id === 'taskModal') closeModal();
    });

    // Modal catégorie
    document.getElementById('addCategoryBtn').addEventListener('click', openCategoryModal);
    document.getElementById('closeCategoryModal').addEventListener('click', closeCategoryModal);
    document.getElementById('saveCategoryBtn').addEventListener('click', saveNewCategory);
    document.getElementById('categoryModal').addEventListener('click', (e) => {
        if (e.target.id === 'categoryModal') closeCategoryModal();
    });
}

function renderCategories() {
    const categoryList = document.getElementById('categoryList');
    const categorySelect = document.getElementById('categorySelect');
    const modalCategorySelect = document.getElementById('modalCategory');
    
    // Liste des filtres
    categoryList.innerHTML = '<button class="category-btn active" data-category="all">Toutes</button>';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.dataset.category = cat.id;
        btn.innerHTML = `${cat.icon} ${cat.name}`;
        
        if (cat.removable) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-category';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteCategory(cat.id);
            };
            btn.appendChild(deleteBtn);
        }
        
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentCategory = cat.id;
            renderTasks();
        });
        
        categoryList.appendChild(btn);
    });
    
    // Selects
    categorySelect.innerHTML = '';
    modalCategorySelect.innerHTML = '';
    categories.forEach(cat => {
        const option1 = document.createElement('option');
        option1.value = cat.id;
        option1.textContent = `${cat.icon} ${cat.name}`;
        categorySelect.appendChild(option1);
        
        const option2 = option1.cloneNode(true);
        modalCategorySelect.appendChild(option2);
    });
}

function openCategoryModal() {
    document.getElementById('newCategoryName').value = '';
    document.getElementById('newCategoryIcon').value = '';
    document.getElementById('categoryModal').classList.add('active');
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
}

function saveNewCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    const icon = document.getElementById('newCategoryIcon').value.trim() || '📌';
    
    if (!name) {
        alert('Veuillez entrer un nom de catégorie');
        return;
    }
    
    const id = 'cat_' + Date.now();
    categories.push({ id, name, icon, removable: true });
    saveCategories();
    renderCategories();
    closeCategoryModal();
}

function deleteCategory(categoryId) {
    if (!confirm('Supprimer cette catégorie ? Les tâches associées seront déplacées vers "Personnel".')) return;
    
    // Déplacer les tâches vers "personnel"
    tasks.forEach(task => {
        if (task.category === categoryId) {
            task.category = 'personal';
        }
    });
    
    categories = categories.filter(c => c.id !== categoryId);
    saveCategories();
    saveTasks();
    
    if (currentCategory === categoryId) {
        currentCategory = 'all';
    }
    
    renderCategories();
    renderTasks();
}

function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    
    if (!text) return;

    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        priority: document.getElementById('prioritySelect').value,
        category: document.getElementById('categorySelect').value,
        dueDate: document.getElementById('dueDateInput').value,
        createdAt: new Date().toISOString(),
        description: '',
        estimatedTime: null,
        recurrence: 'none'
    };

    tasks.unshift(task);
    saveTasks();
    renderTasks();
    updateStats();
    
    input.value = '';
    document.getElementById('dueDateInput').value = '';
}

function renderTasks(searchQuery = '') {
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    
    let filtered = tasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = currentFilter === 'all' || task.priority === currentFilter;
        const matchesCategory = currentCategory === 'all' || task.category === currentCategory;
        
        if (currentView === 'today') {
            const today = new Date().toISOString().split('T')[0];
            return matchesSearch && matchesPriority && matchesCategory && task.dueDate === today;
        }
        
        return matchesSearch && matchesPriority && matchesCategory;
    });

    if (filtered.length === 0) {
        taskList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    taskList.innerHTML = filtered.map(task => createTaskHTML(task)).join('');
    
    // Attacher les événements
    filtered.forEach(task => {
        const el = document.querySelector(`[data-task-id="${task.id}"]`);
        if (!el) return;

        el.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));
        el.querySelector('[data-action="edit"]')?.addEventListener('click', () => openEditModal(task.id));
        el.querySelector('[data-action="delete"]')?.addEventListener('click', () => deleteTask(task.id));
    });

    setupDragAndDrop();
}

function createTaskHTML(task) {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
    const priorityClass = `priority-${task.priority}`;
    const category = categories.find(c => c.id === task.category);
    const categoryDisplay = category ? `${category.icon} ${category.name}` : task.category;

    return `
        <li class="task-item ${task.completed ? 'completed' : ''} ${priorityClass}" 
            data-task-id="${task.id}" draggable="true">
            <div class="task-header">
                <div class="task-main">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text">${task.text}</span>
                </div>
                <div class="task-badges">
                    <span class="badge badge-category">${categoryDisplay}</span>
                    <span class="badge badge-priority">${task.priority}</span>
                    ${task.dueDate ? `<span class="badge ${isOverdue ? 'badge-overdue' : 'badge-date'}">${formatDate(task.dueDate)}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="icon-btn" data-action="edit" title="Éditer">✏️</button>
                <button class="icon-btn" data-action="delete" title="Supprimer">🗑️</button>
            </div>
            ${task.description ? `<div class="task-details">${task.description}</div>` : ''}
        </li>
    `;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Aujourd\'hui';
    if (date.toDateString() === tomorrow.toDateString()) return 'Demain';
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    
    if (task.completed && task.recurrence !== 'none') {
        createRecurringTask(task);
    }

    saveTasks();
    renderTasks();
    updateStats();
}

function createRecurringTask(originalTask) {
    const newTask = { ...originalTask };
    newTask.id = Date.now();
    newTask.completed = false;
    
    if (originalTask.dueDate) {
        const dueDate = new Date(originalTask.dueDate);
        switch (originalTask.recurrence) {
            case 'daily':
                dueDate.setDate(dueDate.getDate() + 1);
                break;
            case 'weekly':
                dueDate.setDate(dueDate.getDate() + 7);
                break;
            case 'monthly':
                dueDate.setMonth(dueDate.getMonth() + 1);
                break;
        }
        newTask.dueDate = dueDate.toISOString().split('T')[0];
    }
    
    tasks.unshift(newTask);
}

function deleteTask(id) {
    if (!confirm('Supprimer cette tâche ?')) return;
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
}

function openEditModal(id) {
    editingTaskId = id;
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('modalTaskTitle').value = task.text;
    document.getElementById('modalTaskDesc').value = task.description || '';
    document.getElementById('modalPriority').value = task.priority;
    document.getElementById('modalCategory').value = task.category;
    document.getElementById('modalDueDate').value = task.dueDate || '';
    document.getElementById('modalEstimatedTime').value = task.estimatedTime || '';
    document.getElementById('modalRecurrence').value = task.recurrence;

    document.getElementById('taskModal').classList.add('active');
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('active');
    editingTaskId = null;
}

function saveEditedTask() {
    const task = tasks.find(t => t.id === editingTaskId);
    if (!task) return;

    task.text = document.getElementById('modalTaskTitle').value;
    task.description = document.getElementById('modalTaskDesc').value;
    task.priority = document.getElementById('modalPriority').value;
    task.category = document.getElementById('modalCategory').value;
    task.dueDate = document.getElementById('modalDueDate').value;
    task.estimatedTime = document.getElementById('modalEstimatedTime').value;
    task.recurrence = document.getElementById('modalRecurrence').value;

    saveTasks();
    renderTasks();
    closeModal();
}

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const todayTasks = tasks.filter(t => t.dueDate === today).length;
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed).length;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('todayTasks').textContent = todayTasks;
    document.getElementById('overdueTasks').textContent = overdue;
}

function checkNotifications() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    tasks.forEach(task => {
        if (task.completed) return;
        
        if (task.dueDate === today || task.dueDate === tomorrowStr) {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Tâches', {
                    body: `Tâche à venir: ${task.text}`,
                    icon: '📋'
                });
            }
        }
    });

    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    document.querySelector('.theme-toggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme: newTheme }));
}

function applyTheme() {
    try {
        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        if (settings?.theme) {
            document.body.setAttribute('data-theme', settings.theme);
            document.querySelector('.theme-toggle').textContent = settings.theme === 'dark' ? '☀️' : '🌙';
        }
    } catch (e) {}
}

function setupDragAndDrop() {
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(this.parentElement, e.clientY);
    if (afterElement == null) {
        this.parentElement.appendChild(draggedElement);
    } else {
        this.parentElement.insertBefore(draggedElement, afterElement);
    }
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    
    const items = [...document.querySelectorAll('.task-item')];
    const newOrder = items.map(item => parseInt(item.dataset.taskId));
    tasks.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
    saveTasks();
    
    return false;
}

function handleDragEnd() {
    this.classList.remove('dragging');
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Démarrer l'application
init();