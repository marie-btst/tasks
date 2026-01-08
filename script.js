// === CONFIGURATION ===
const CONFIG = {
    STORAGE_KEYS: {
        TASKS: 'myTasks',
        FREQUENT_TASKS: 'myFreqTasks'
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
    freqPicker: document.querySelector('#freq-emoji-popover emoji-picker')
};

// === ÉTAT DE L'APPLICATION ===
const AppState = {
    tasks: [],
    frequentTasks: [],
    currentTaskEmoji: CONFIG.DEFAULT_EMOJIS.TASK,
    currentFreqEmoji: CONFIG.DEFAULT_EMOJIS.HABIT,
    
    init() {
        this.loadData();
    },
    
    loadData() {
        this.tasks = this.getFromStorage(CONFIG.STORAGE_KEYS.TASKS, []);
        this.frequentTasks = this.getFromStorage(CONFIG.STORAGE_KEYS.FREQUENT_TASKS, [
            { text: "Sport", emoji: "📈" },
            { text: "Running", emoji: "🏃" },
            { text: "Lecture", emoji: "📚" }

        ]);
        
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
            console.error(`Erreur lecture ${key}:`, error);
            return defaultValue;
        }
    },
    
    save() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
            localStorage.setItem(CONFIG.STORAGE_KEYS.FREQUENT_TASKS, JSON.stringify(this.frequentTasks));
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
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
        // MODIF MOBILE : Vibration avant la confirm
        if(navigator.vibrate) navigator.vibrate(20); 
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
                TaskManager.render();
                // MODIF MOBILE : Vibration au lâcher
                if(navigator.vibrate) navigator.vibrate(20);
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
                HabitManager.render();
                if(navigator.vibrate) navigator.vibrate(20);
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
            
            const content = li.querySelector('.task-content');
            const deleteBtn = li.querySelector('.delete-btn');
            
            content.addEventListener('click', () => this.toggleComplete(index));
            deleteBtn.addEventListener('mousedown', (e) => e.stopPropagation());
            deleteBtn.addEventListener('click', (e) => this.delete(index, li));
            
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
        
        // MODIF MOBILE : Feedback vibration succès
        if(navigator.vibrate) navigator.vibrate([30, 30, 30]);

        // Reset
        DOM.taskInput.value = '';
        DOM.optionalCheck.checked = false;

        // MODIF MOBILE CRUCIALE : 
        // Si écran large (PC) => on remet le focus pour taper vite
        // Si écran petit (Mobile) => on ferme le clavier pour voir la liste
        if (window.innerWidth > 800) {
            DOM.taskInput.focus();
        } else {
            DOM.taskInput.blur(); 
        }
    }
    
    static toggleComplete(index) {
        if (AppState.tasks[index]) {
            AppState.tasks[index].completed = !AppState.tasks[index].completed;
            AppState.save();
            this.render();
            // MODIF MOBILE : Petite vibration
            if(navigator.vibrate) navigator.vibrate(15);
        }
    }
    
    static delete(index, domElement) {
        domElement.classList.add('slide-out');
        
        // MODIF MOBILE : Vibration
        if(navigator.vibrate) navigator.vibrate(30);

        setTimeout(() => {
            AppState.tasks.splice(index, 1);
            AppState.save();
            this.render();
        }, 300);
    }
    
    static clearAll() {
        if (AppState.tasks.length > 0 && Utils.showConfirm("Vider la liste du jour ?")) {
            const items = document.querySelectorAll('.task-item');
            items.forEach(item => item.classList.add('slide-out'));
            
            setTimeout(() => {
                AppState.tasks = [];
                AppState.save();
                this.render();
            }, 300);
        }
    }
    
    static init() {
        DOM.addBtn.addEventListener('click', () => {
            this.add(DOM.taskInput.value, DOM.optionalCheck.checked, AppState.currentTaskEmoji);
        });
        
        DOM.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.add(DOM.taskInput.value, DOM.optionalCheck.checked, AppState.currentTaskEmoji);
            }
        });
        
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
            
            const content = div.querySelector('.freq-content');
            const deleteBtn = div.querySelector('.freq-delete');
            
            content.addEventListener('click', () => this.addToTasks(index));
            deleteBtn.addEventListener('mousedown', (e) => e.stopPropagation());
            deleteBtn.addEventListener('click', () => this.delete(index, div));
            
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
        
        DOM.freqInput.value = '';
        
        // MODIF MOBILE : Même logique, on ferme le clavier sur mobile
        if (window.innerWidth > 800) {
            DOM.freqInput.focus();
        } else {
            DOM.freqInput.blur();
        }
    }
    
    static addToTasks(index) {
        const habit = AppState.frequentTasks[index];
        if (habit) {
            TaskManager.add(habit.text, false, habit.emoji);
        }
    }
    
    static delete(index, domElement) {
        if (Utils.showConfirm("Supprimer cette habitude ?")) {
            domElement.classList.add('slide-out');
            
            setTimeout(() => {
                AppState.frequentTasks.splice(index, 1);
                AppState.save();
                this.render();
            }, 300);
        }
    }
    
    static init() {
        DOM.addFreqBtn.addEventListener('click', () => {
            this.add(DOM.freqInput.value, AppState.currentFreqEmoji);
        });
        
        DOM.freqInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.add(DOM.freqInput.value, AppState.currentFreqEmoji);
            }
        });
    }
}

// === INITIALISATION ===
class App {
    static init() {
        DOM.dateDisplay.textContent = Utils.formatDate();
        AppState.init();
        EmojiManager.init();
        DragDropManager.init();
        TaskManager.init();
        HabitManager.init();
        TaskManager.render();
        HabitManager.render();
    }
}

document.addEventListener('DOMContentLoaded', () => App.init());