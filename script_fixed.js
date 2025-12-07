// В самое начало добавьте этот код для отладки
console.log('=== НАЧАЛО ЗАГРУЗКИ SCRIPT.JS ===');

// Перехватываем ошибки
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Глобальная ошибка:', message, 'в', source, 'строка', lineno);
    return true;
};

// Проверяем загрузку D3
if (!window.d3) {
    console.error('D3.js не загружена!');
    // Попробуем загрузить
    const script = document.createElement('script');
    script.src = 'https://d3js.org/d3.v7.min.js';
    script.onload = function() {
        console.log('D3.js загружена динамически');
        if (window.familyTree) {
            window.familyTree.buildTree();
        }
    };
    document.head.appendChild(script);
}

class FamilyTree {
    constructor() {
        console.log('Конструктор FamilyTree вызван');
        this.data = { people: [] };
        this.selectedPerson = null;
        this.treeData = null;
        this.svg = null;
        this.treeNodes = null;
        this.init();
    }

    async init() {
        console.log('Инициализация семейного дерева');
        try {
            await this.loadData();
            this.initUI();
            this.buildTree();
            this.updateStats();
            console.log('Инициализация завершена успешно');
        } catch (error) {
            console.error('Ошибка инициализации:', error);
        }
    }

    // ... остальной код без изменений ...
    // ВАЖНО: Весь остальной код из вашего script.js должен быть здесь
}

// Инициализация при загрузке страницы
console.log('Добавляю обработчик DOMContentLoaded');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, создаю FamilyTree');
    window.familyTree = new FamilyTree();
});
