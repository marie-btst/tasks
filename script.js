// === CONFIGURATION ===
const CONFIG = {
    STORAGE_KEYS: {
        TASKS: 'myTasks',
        FREQUENT_TASKS: 'myFreqTasks',
        THEME: 'theme'
    },
    DEFAULT_EMOJIS: {
        TASK: '📌',
        HABIT: '⭐'
    }
};

// === DOM SELECTION ===
const DOM = {
    taskInput: document.getElementById('task-input'),
    optionalCheck: document.getElementById('optional-check'),
    addBtn: document.getElementById('add-btn'),
    taskList: document.getElementById('task-list'),
    clearBtn: document.getElementById('clear-all'),
    
    dateDisplay: document.getElementById('date-display'),
    themeToggle: document.getElementById('theme-toggle'),
    
    emojiTrigger: document.getElementById('emoji-trigger'),
    emojiPopover: document.getElementById('emoji-popover'),
    mainPicker: document.querySelector('#emoji-popover emoji-picker'),
    
    freqInput: document.getElementById('frequent-input'),
    freqOptionalCheck: document.getElementById('freq-optional-check'),
    addFreqBtn: document.getElementById('add-frequent-btn'),
    freqList: document.getElementById('frequent-list'),
    freqEmojiTrigger: document.getElementById('freq-emoji-trigger'),
    freqEmojiPopover: document.getElementById('freq-emoji-popover'),
    freqPicker: document.querySelector('#freq-emoji-popover emoji-picker')
};

// === APP STATE ===
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
            { text: "Sport", emoji: "📈", optional: false },
            { text: "Lecture", emoji: "📚", optional: true }
        ]);
    },
    
    getFromStorage(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error reading ${key}:`, error);
            return defaultValue;
        }
    },
    
    save() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
            localStorage.setItem(CONFIG.STORAGE_KEYS.FREQUENT_TASKS, JSON.stringify(this.frequentTasks));
        } catch (error) {
            console.error('Save error:', error);
        }
    }
};

// === UTILS ===
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
        if(navigator.vibrate) navigator.vibrate(20); 
        return confirm(message);
    }
};

// === THEME MANAGER ===
class ThemeManager {
    static init() {
        const currentTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
        
        if (currentTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            DOM.themeToggle.textContent = '☀️';
        } else {
            document.documentElement.removeAttribute('data-theme');
            DOM.themeToggle.textContent = '🌙';
        }
        
        DOM.themeToggle.addEventListener('click', () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            
            if (isLight) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, 'dark');
                DOM.themeToggle.textContent = '🌙';
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, 'light');
                DOM.themeToggle.textContent = '☀️';
            }
            if(navigator.vibrate) navigator.vibrate(10);
        });
    }
}

// === EMOJI MANAGER ===
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
        this.setupPicker(DOM.emojiTrigger, DOM.emojiPopover, DOM.mainPicker, (emoji) => {
            AppState.currentTaskEmoji = emoji;
            DOM.taskInput.focus();
        });
        
        this.setupPicker(DOM.freqEmojiTrigger, DOM.freqEmojiPopover, DOM.freqPicker, (emoji) => {
            AppState.currentFreqEmoji = emoji;
            DOM.freqInput.focus();
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.input-wrapper')) {
                this.closeAllPopovers();
            }
        });
    }
}

// === DRAG & DROP ===
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

// === TASK MANAGER ===
class TaskManager {
    static render() {
        DOM.taskList.innerHTML = '';
        
        AppState.tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <div class="task-content" data-index="${index}">
                    <div class="custom-checkbox"><i>✔</i></div>
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
        
        if(navigator.vibrate) navigator.vibrate([30, 30, 30]);

        DOM.taskInput.value = '';
        DOM.optionalCheck.checked = false;

        if (window.innerWidth > 800) DOM.taskInput.focus();
        else DOM.taskInput.blur(); 
    }
    
    static toggleComplete(index) {
        if (AppState.tasks[index]) {
            AppState.tasks[index].completed = !AppState.tasks[index].completed;
            AppState.save();
            this.render();
            if(navigator.vibrate) navigator.vibrate(15);
        }
    }
    
    static delete(index, domElement) {
        domElement.classList.add('slide-out');
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

// === HABIT MANAGER ===
class HabitManager {
    static render() {
        DOM.freqList.innerHTML = '';
        
        AppState.frequentTasks.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `freq-tag ${item.optional ? 'optional' : ''}`;
            
            div.innerHTML = `
                <div class="freq-content" style="display:flex; align-items:center; gap:8px;">
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
    
    static add(text, emoji, isOptional) {
        const trimmedText = text.trim();
        if (!trimmedText) return;
        
        AppState.frequentTasks.push({
            text: trimmedText,
            emoji: emoji,
            optional: isOptional
        });
        
        AppState.save();
        this.render();
        
        DOM.freqInput.value = '';
        DOM.freqOptionalCheck.checked = false;
        
        if (window.innerWidth > 800) DOM.freqInput.focus();
        else DOM.freqInput.blur();
    }
    
    static addToTasks(index) {
        const habit = AppState.frequentTasks[index];
        if (habit) {
            TaskManager.add(habit.text, habit.optional || false, habit.emoji);
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
            this.add(DOM.freqInput.value, AppState.currentFreqEmoji, DOM.freqOptionalCheck.checked);
        });
        
        DOM.freqInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.add(DOM.freqInput.value, AppState.currentFreqEmoji, DOM.freqOptionalCheck.checked);
            }
        });
    }
}

// === INIT ===
class App {
    static init() {
        DOM.dateDisplay.textContent = Utils.formatDate();
        AppState.init();
        ThemeManager.init();
        EmojiManager.init();
        DragDropManager.init();
        TaskManager.init();
        HabitManager.init();
        TaskManager.render();
        HabitManager.render();
    }
}

document.addEventListener('DOMContentLoaded', () => App.init());