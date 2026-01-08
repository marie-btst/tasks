// === CONFIGURATION ===
const CONFIG = {
    STORAGE_KEYS: {
        TASKS: 'myTasks',
        FREQUENT_TASKS: 'myFreqTasks',
        COLORS: 'myColors'
    },
    DEFAULT_COLORS: {
        '--bg-color': '#181818',
        '--card-bg': '#292929',
        '--text-primary': '#ffffff',
        '--text-secondary': '#c4c4c4',
        '--accent': '#e0e0e0',
        '--accent-hover': '#a0a0a0',
        '--optional': '#1ea319',
        '--danger': '#d41e1e',
        '--border': '#696969'
    },
    DEFAULT_EMOJIS: {
        TASK: '📌',
        HABIT: '⭐'
    }
};

// === SÉLECTION DU DOM ===
const DOM = {
    // Tâches
    taskInput: document.getElementById('task-input'),
    optionalCheck: document.getElementById('optional-check'),
    addBtn: document.getElementById('add-btn'),
    taskList: document.getElementById('task-list'),
    clearBtn: document.getElementById('clear-all'),
    
    // Date
    dateDisplay: document.getElementById('date-display'),
    
    // Emojis tâches
    emojiTrigger: document.getElementById('emoji-trigger'),
    emojiPopover: document.getElementById('emoji-popover'),
    mainPicker: document.querySelector('#emoji-popover emoji-picker'),
    
    // Habitudes
    freqInput: document.getElementById('frequent-input'),
    addFreqBtn: document.getElementById('add-frequent-btn'),
    freqList: document.getElementById('frequent-list'),
    freqEmojiTrigger: document.getElementById('freq-emoji-trigger'),
    freqEmojiPopover: document.getElementById('freq-emoji-popover'),
    freqPicker: document.querySelector('#freq-emoji-popover emoji-picker'),
    
    // Paramètres
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    resetColors: document.getElementById('reset-colors'),
    saveColors: document.getElementById('save-colors'),
    colorInputs: document.querySelectorAll('input[type="color"]')
};

// === ÉTAT DE L'APPLICATION ===
const AppState = {
    tasks: [],
    frequentTasks: [],
    currentTaskEmoji: CONFIG.DEFAULT_EMOJIS.TASK,
    currentFreqEmoji: CONFIG.DEFAULT_EMOJIS.HABIT,
    
    init() {
        this.loadData();
        this.loadColors();
    },
    
    loadData() {
        this.tasks = this.getFromStorage(CONFIG.STORAGE_KEYS.TASKS, []);
        this.frequentTasks = this.getFromStorage(CONFIG.STORAGE_KEYS.FREQUENT_TASKS, [
            { text: "Sport", emoji: "🏋️" },
            { text: "Lecture", emoji: "📚" }
        ]);
        
        // Migration des anciennes données
        if (this.frequentTasks.length > 0 && typeof this.frequentTasks[0] === 'string') {
            this.frequentTasks = this.frequentTasks.map(t => ({ 
                text: t, 
                emoji: CONFIG.DEFAULT_EMOJIS.HABIT 
            }));
            this.save();
        }
    },
    
    getFromStorage(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Erreur lors de la lecture de ${key}:`, error);
            return defaultValue;
        }
    },
    
    save() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
            localStorage.setItem(CONFIG.STORAGE_KEYS.FREQUENT_TASKS, JSON.stringify(this.frequentTasks));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    },
    
    loadColors() {
        const savedColors = this.getFromStorage(CONFIG.STORAGE_KEYS.COLORS, null);
        if (savedColors) {
            Object.entries(savedColors).forEach(([key, value]) => {
                document.documentElement.style.setProperty(key, value);
            });
        }
    },
    
    saveColors() {
        const colors = {};
        DOM.colorInputs.forEach(input => {
            const varName = input.dataset.var;
            colors[varName] = input.value;
            document.documentElement.style.setProperty(varName, input.value);
        });
        
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.COLORS, JSON.stringify(colors));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des couleurs:', error);
        }
    },
    
    resetColors() {
        Object.entries(CONFIG.DEFAULT_COLORS).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
            const input = document.querySelector(`input[data-var="${key}"]`);
            if (input) input.value = value;
        });
        
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.COLORS);
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
        }
    }
};

// === UTILITAIRES ===
const Utils = {
    formatDate() {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        return new Date().toLocaleDateString('fr-FR', options);
    },
    
    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    
    showConfirm(message) {
        return confirm(message);
    }
};

// === GESTIONNAIRE D'EMOJIS ===
class EmojiManager {
    static setupPicker(triggerBtn, popover, pickerElement, updateCallback) {
        triggerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeAllPopovers(popover);
            popover.classList.toggle('hidden');
        });

        pickerElement.addEventListener('emoji-click', event => {
            const emoji = event.detail.unicode;
            triggerBtn.textContent = emoji;
            popover.classList.add('hidden');
            updateCallback(emoji);
        });
    }
    
    static closeAllPopovers(exceptPopover = null) {
        document.querySelectorAll('.popover').forEach(p => {
            if (p !== exceptPopover) {
                p.classList.add('hidden');
            }
        });
    }
    
    static init() {
        this.setupPicker(
            DOM.emojiTrigger, 
            DOM.emojiPopover, 
            DOM.mainPicker, 
            (emoji) => {
                AppState.currentTaskEmoji = emoji;
                DOM.taskInput.focus();
            }
        );
        
        this.setupPicker(
            DOM.freqEmojiTrigger, 
            DOM.freqEmojiPopover, 
            DOM.freqPicker, 
            (emoji) => {
                AppState.currentFreqEmoji = emoji;
                DOM.freqInput.focus();
            }
        );
        
        // Fermer les popovers au clic extérieur
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.input-wrapper')) {
                this.closeAllPopovers();
            }
        });
    }
}

// === GESTIONNAIRE DE DRAG & DROP ===
class DragDropManager {
    static init() {
        Sortable.create(DOM.taskList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            delay: 100,
            delayOnTouchOnly: true,
            onEnd: (evt) => {
                const item = AppState.tasks.splice(evt.oldIndex, 1)[0];
                AppState.tasks.splice(evt.newIndex, 0, item);
                AppState.save();
            }
        });
        
        Sortable.create(DOM.freqList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            delay: 100,
            delayOnTouchOnly: true,
            onEnd: (evt) => {
                const item = AppState.frequentTasks.splice(evt.oldIndex, 1)[0];
                AppState.frequentTasks.splice(evt.newIndex, 0, item);
                AppState.save();
            }
        });
    }
}

// === GESTIONNAIRE DE TÂCHES ===
class TaskManager {
    static render() {
        DOM.taskList.innerHTML = '';
        
        AppState.tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <div class="task-content" data-index="${index}">
                    <div class="custom-checkbox">
                        <i>✔</i>
                    </div>
                    <span class="task-emoji">${Utils.sanitizeHTML(task.emoji || CONFIG.DEFAULT_EMOJIS.TASK)}</span>
                    <span class="task-text">${Utils.sanitizeHTML(task.text)}</span>
                    ${task.optional ? '<span class="badge-optional">Facultatif</span>' : ''}
                </div>
                <button class="delete-btn" data-index="${index}" aria-label="Supprimer">&times;</button>
            `;
            
            // Event listeners
            const content = li.querySelector('.task-content');
            const deleteBtn = li.querySelector('.delete-btn');
            
            content.addEventListener('click', () => this.toggleComplete(index));
            deleteBtn.addEventListener('mousedown', (e) => e.stopPropagation());
            deleteBtn.addEventListener('click', () => this.delete(index));
            
            DOM.taskList.appendChild(li);
        });
    }
    
    static add(text, isOptional, emoji) {
        const trimmedText = text.trim();
        if (!trimmedText) return;
        
        AppState.tasks.push({
            text: trimmedText,
            optional: isOptional,
            completed: false,
            emoji: emoji
        });
        
        AppState.save();
        this.render();
        
        // Reset du formulaire
        DOM.taskInput.value = '';
        DOM.optionalCheck.checked = false;
        DOM.taskInput.focus();
    }
    
    static toggleComplete(index) {
        if (AppState.tasks[index]) {
            AppState.tasks[index].completed = !AppState.tasks[index].completed;
            AppState.save();
            this.render();
        }
    }
    
    static delete(index) {
        AppState.tasks.splice(index, 1);
        AppState.save();
        this.render();
    }
    
    static clearAll() {
        if (AppState.tasks.length > 0 && Utils.showConfirm("Vider la liste du jour ?")) {
            AppState.tasks = [];
            AppState.save();
            this.render();
        }
    }
    
    static init() {
        // Bouton ajouter
        DOM.addBtn.addEventListener('click', () => {
            this.add(DOM.taskInput.value, DOM.optionalCheck.checked, AppState.currentTaskEmoji);
        });
        
        // Touche Enter
        DOM.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.add(DOM.taskInput.value, DOM.optionalCheck.checked, AppState.currentTaskEmoji);
            }
        });
        
        // Bouton effacer tout
        DOM.clearBtn.addEventListener('click', () => this.clearAll());
    }
}

// === GESTIONNAIRE D'HABITUDES ===
class HabitManager {
    static render() {
        DOM.freqList.innerHTML = '';
        
        AppState.frequentTasks.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'freq-tag';
            
            div.innerHTML = `
                <div class="freq-content" data-index="${index}">
                    <span>${Utils.sanitizeHTML(item.emoji)}</span>
                    <span>${Utils.sanitizeHTML(item.text)}</span>
                </div>
                <span class="freq-delete" data-index="${index}" aria-label="Supprimer">&times;</span>
            `;
            
            // Event listeners
            const content = div.querySelector('.freq-content');
            const deleteBtn = div.querySelector('.freq-delete');
            
            content.addEventListener('click', () => this.addToTasks(index));
            deleteBtn.addEventListener('mousedown', (e) => e.stopPropagation());
            deleteBtn.addEventListener('click', () => this.delete(index));
            
            DOM.freqList.appendChild(div);
        });
    }
    
    static add(text, emoji) {
        const trimmedText = text.trim();
        if (!trimmedText) return;
        
        AppState.frequentTasks.push({
            text: trimmedText,
            emoji: emoji
        });
        
        AppState.save();
        this.render();
        
        // Reset du formulaire
        DOM.freqInput.value = '';
        DOM.freqInput.focus();
    }
    
    static addToTasks(index) {
        const habit = AppState.frequentTasks[index];
        if (habit) {
            TaskManager.add(habit.text, false, habit.emoji);
        }
    }
    
    static delete(index) {
        if (Utils.showConfirm("Supprimer cette habitude ?")) {
            AppState.frequentTasks.splice(index, 1);
            AppState.save();
            this.render();
        }
    }
    
    static init() {
        // Bouton ajouter
        DOM.addFreqBtn.addEventListener('click', () => {
            this.add(DOM.freqInput.value, AppState.currentFreqEmoji);
        });
        
        // Touche Enter
        DOM.freqInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.add(DOM.freqInput.value, AppState.currentFreqEmoji);
            }
        });
    }
}

// === GESTIONNAIRE DE PARAMÈTRES ===
class SettingsManager {
    static open() {
        DOM.settingsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    static close() {
        DOM.settingsModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    static init() {
        // Charger les couleurs actuelles dans les inputs
        DOM.colorInputs.forEach(input => {
            const varName = input.dataset.var;
            const currentValue = getComputedStyle(document.documentElement)
                .getPropertyValue(varName).trim();
            if (currentValue) {
                input.value = currentValue;
            }
        });
        
        // Event listeners
        DOM.settingsBtn.addEventListener('click', () => this.open());
        DOM.closeSettings.addEventListener('click', () => this.close());
        
        DOM.settingsModal.addEventListener('click', (e) => {
            if (e.target === DOM.settingsModal) {
                this.close();
            }
        });
        
        DOM.saveColors.addEventListener('click', () => {
            AppState.saveColors();
            this.close();
        });
        
        DOM.resetColors.addEventListener('click', () => {
            if (Utils.showConfirm("Réinitialiser toutes les couleurs ?")) {
                AppState.resetColors();
            }
        });
        
        // Fermer avec Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !DOM.settingsModal.classList.contains('hidden')) {
                this.close();
            }
        });
    }
}

// === INITIALISATION DE L'APPLICATION ===
class App {
    static init() {
        // Afficher la date
        DOM.dateDisplay.textContent = Utils.formatDate();
        
        // Initialiser l'état
        AppState.init();
        
        // Initialiser les gestionnaires
        EmojiManager.init();
        DragDropManager.init();
        TaskManager.init();
        HabitManager.init();
        SettingsManager.init();
        
        // Rendu initial
        TaskManager.render();
        HabitManager.render();
    }
}

// Démarrer l'application
document.addEventListener('DOMContentLoaded', () => App.init());