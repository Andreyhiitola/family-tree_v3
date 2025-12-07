// navigation.js - Функционал навигации и перестройки дерева

// Ждем загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    // Ждем создания экземпляра FamilyTree
    const checkFamilyTree = setInterval(function() {
        if (window.familyTree && window.familyTree.data && window.familyTree.data.people) {
            clearInterval(checkFamilyTree);
            initTreeNavigation();
        }
    }, 100);
});

// Инициализация навигации
function initTreeNavigation() {
    console.log('Инициализация навигации по дереву...');
    
    if (!window.familyTree || !window.familyTree.data) {
        console.error('FamilyTree не инициализирован');
        return;
    }
    
    // Добавляем CSS стили
    addStyles();
    
    // Создаем UI элементы
    createPersonSelector();
    createCurrentRootInfo();
    createTreeStatistics();
    
    // Добавляем обработчики
    addNodeClickHandlers();
    addGlobalShortcuts();
    
    console.log('Навигация по дереву инициализирована');
}

// Создание селектора персонажей
function createPersonSelector() {
    const oldSelector = document.getElementById('person-selector');
    if (oldSelector) oldSelector.remove();
    
    const selectorDiv = document.createElement('div');
    selectorDiv.id = 'person-selector';
    selectorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 300px;
        max-height: 400px;
        overflow-y: auto;
        border: 2px solid #2196F3;
    `;
    
    selectorDiv.innerHTML = `
        <h4 style="margin-top: 0; color: #333;">Выберите человека:</h4>
        <input type="text" id="person-search" placeholder="Поиск по имени..." 
               style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px;">
        <div id="person-list" style="max-height: 300px; overflow-y: auto;"></div>
    `;
    
    document.body.appendChild(selectorDiv);
    updatePersonList();
    
    // Поиск
    document.getElementById('person-search').addEventListener('input', function(e) {
        updatePersonList(e.target.value);
    });
}

// Обновление списка людей
function updatePersonList(searchTerm = '') {
    const personList = document.getElementById('person-list');
    if (!personList || !window.familyTree || !window.familyTree.data) return;
    
    const filteredPeople = window.familyTree.data.people.filter(person => {
        if (!searchTerm) return true;
        const fullName = `${person.name} ${person.surname}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });
    
    personList.innerHTML = filteredPeople.map(person => `
        <div class="person-item" data-person-id="${person.id}" 
             style="padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;
                    background: ${person.gender === 'M' ? '#e6f3ff' : '#ffe6f2'};
                    transition: all 0.2s ease;">
            <strong>${person.name} ${person.surname}</strong>
            <div style="font-size: 12px; color: #666;">
                ID: ${person.id} | ${person.gender === 'M' ? '♂' : '♀'}
                ${person.birthDate ? `| Род. ${person.birthDate}` : ''}
            </div>
        </div>
    `).join('');
    
    // Обработчики кликов
    document.querySelectorAll('.person-item').forEach(item => {
        item.addEventListener('click', function() {
            const personId = this.dataset.personId;
            rebuildTreeFromPerson(personId);
        });
    });
}

// Перестройка дерева от выбранного человека
function rebuildTreeFromPerson(personId) {
    console.log('Перестраиваю дерево от человека:', personId);
    
    if (!window.familyTree || !window.familyTree.data) {
        console.error('FamilyTree не инициализирован');
        return;
    }
    
    const selectedPerson = window.familyTree.data.people.find(p => p.id === personId);
    if (!selectedPerson) {
        console.error('Человек не найден:', personId);
        return;
    }
    
    // Вызываем метод FamilyTree
    window.familyTree.selectPerson(personId);
    window.familyTree.buildTree(personId);
    
    // Обновляем информацию
    updateCurrentRootInfo(selectedPerson);
    
    // Выделяем выбранный узел
    highlightSelectedNode();
}

// Создание информации о текущем корне
function createCurrentRootInfo() {
    const infoDiv = document.createElement('div');
    infoDiv.id = 'current-root-info';
    infoDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 300px;
        border: 2px solid #4CAF50;
        display: none;
    `;
    
    document.body.appendChild(infoDiv);
}

// Обновление информации о текущем корне
function updateCurrentRootInfo(person) {
    const infoDiv = document.getElementById('current-root-info');
    if (!infoDiv) return;
    
    infoDiv.style.display = 'block';
    infoDiv.innerHTML = `
        <h4 style="margin-top: 0; color: #333;">Текущее дерево построено от:</h4>
        <div style="padding: 10px; background: ${person.gender === 'M' ? '#e6f3ff' : '#ffe6f2'}; border-radius: 5px;">
            <p style="margin: 5px 0;"><strong>${person.name} ${person.surname}</strong></p>
            <p style="margin: 5px 0; font-size: 14px;">Пол: ${person.gender === 'M' ? '♂ Мужской' : '♀ Женский'}</p>
            ${person.birthDate ? `<p style="margin: 5px 0; font-size: 14px;">Дата рождения: ${person.birthDate}</p>` : ''}
            ${person.deathDate ? `<p style="margin: 5px 0; font-size: 14px;">Дата смерти: ${person.deathDate}</p>` : ''}
        </div>
        <button id="reset-tree-view" class="btn btn-sm btn-outline" style="margin-top: 10px; width: 100%;">
            Показать всё дерево
        </button>
    `;
    
    document.getElementById('reset-tree-view').addEventListener('click', resetToFullTree);
}

// Возврат к полному дереву
function resetToFullTree() {
    const infoDiv = document.getElementById('current-root-info');
    if (infoDiv) infoDiv.style.display = 'none';
    
    if (window.familyTree) {
        window.familyTree.selectedPerson = null;
        window.familyTree.buildTree();
    }
    
    updatePersonList();
}

// Создание статистики
function createTreeStatistics() {
    const statsDiv = document.createElement('div');
    statsDiv.id = 'tree-statistics';
    statsDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 250px;
        border: 2px solid #9C27B0;
    `;
    
    document.body.appendChild(statsDiv);
    updateTreeStatistics();
}

// Обновление статистики
function updateTreeStatistics() {
    const statsDiv = document.getElementById('tree-statistics');
    if (!statsDiv || !window.familyTree || !window.familyTree.data) return;
    
    const total = window.familyTree.data.people.length;
    const males = window.familyTree.data.people.filter(p => p.gender === 'M').length;
    const females = window.familyTree.data.people.filter(p => p.gender === 'F').length;
    
    statsDiv.innerHTML = `
        <h4 style="margin-top: 0; color: #333;">Статистика</h4>
        <p style="margin: 5px 0;">Всего людей: <strong>${total}</strong></p>
        <p style="margin: 5px 0;">Мужчин: <strong>${males}</strong></p>
        <p style="margin: 5px 0;">Женщин: <strong>${females}</strong></p>
        <hr style="margin: 10px 0;">
        <p style="margin: 5px 0; font-size: 12px; color: #666;">
            <strong>Горячие клавиши:</strong><br>
            Ctrl+F - поиск<br>
            Alt+S - скрыть панель<br>
            Esc - сброс
        </p>
    `;
}

// Добавление обработчиков кликов на узлы
function addNodeClickHandlers() {
    // Используем делегирование событий
    document.addEventListener('click', function(event) {
        const nodeElement = event.target.closest('.node, circle, [data-person-id]');
        if (nodeElement && nodeElement.classList && nodeElement.classList.contains('node')) {
            // Находим ID через данные D3
            const d3Data = d3.select(nodeElement).datum();
            if (d3Data && d3Data.data && d3Data.data.id) {
                event.preventDefault();
                event.stopPropagation();
                rebuildTreeFromPerson(d3Data.data.id);
            }
        }
    }, true);
}

// Добавление глобальных горячих клавиш
function addGlobalShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+F - поиск
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('person-search');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape - сброс
        if (e.key === 'Escape') {
            resetToFullTree();
        }
        
        // Alt+S - скрыть/показать селектор
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            const selector = document.getElementById('person-selector');
            if (selector) {
                selector.style.display = selector.style.display === 'none' ? 'block' : 'none';
            }
        }
    });
}

// Выделение выбранного узла
function highlightSelectedNode() {
    // Эта функция будет вызываться после перестройки дерева
    // Сейчас просто обновим список
    setTimeout(() => {
        updatePersonList(document.getElementById('person-search')?.value || '');
    }, 500);
}

// Добавление CSS стилей
function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Стили для панелей навигации */
        #person-selector, #current-root-info, #tree-statistics {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
        }
        
        .person-item:hover {
            background-color: #f0f0f0 !important;
            transform: translateX(5px);
            transition: all 0.2s ease;
        }
        
        /* Стили для кнопок */
        .btn {
            display: inline-block;
            padding: 6px 12px;
            margin: 0;
            font-size: 14px;
            font-weight: 400;
            line-height: 1.42857143;
            text-align: center;
            white-space: nowrap;
            vertical-align: middle;
            cursor: pointer;
            border: 1px solid transparent;
            border-radius: 4px;
            user-select: none;
        }
        
        .btn-outline {
            color: #333;
            background-color: transparent;
            border: 1px solid #333;
        }
        
        .btn-outline:hover {
            background-color: #f5f5f5;
        }
        
        .btn-sm {
            padding: 5px 10px;
            font-size: 12px;
            line-height: 1.5;
            border-radius: 3px;
        }
    `;
    
    document.head.appendChild(style);
}

// Экспорт функций для глобального использования
window.rebuildTreeFromPerson = rebuildTreeFromPerson;
window.resetToFullTree = resetToFullTree;
window.updatePersonList = updatePersonList;
