// navigation.js - Упрощенный модуль навигации

(function() {
    'use strict';
    
    console.log('=== НАВИГАЦИЯ ПО ДЕРЕВУ ===');
    
    // Ожидаем загрузки FamilyTree
    let initAttempts = 0;
    const maxAttempts = 30;
    
    function waitForFamilyTree() {
        if (window.familyTree && window.familyTree.data && window.familyTree.data.people) {
            console.log('FamilyTree найден, запускаю навигацию');
            initNavigation();
        } else if (initAttempts < maxAttempts) {
            initAttempts++;
            setTimeout(waitForFamilyTree, 500);
        } else {
            console.warn('FamilyTree не найден за', maxAttempts * 500, 'мс');
        }
    }
    
    function initNavigation() {
        console.log('Инициализация навигации...');
        
        // 1. Создаем простые панели
        createPanels();
        
        // 2. Обновляем данные
        updateAllPanels();
        
        // 3. Добавляем обработчики
        setupHandlers();
        
        console.log('Навигация готова');
        
        // Показываем уведомление
        showMessage('Навигация по дереву активна', 'info');
    }
    
    function createPanels() {
        // Панель выбора человека (справа вверху)
        const selectorPanel = document.createElement('div');
        selectorPanel.id = 'nav-selector';
        selectorPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0;">Выбор человека</h4>
                <button id="nav-hide-btn" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
            </div>
            <input type="text" id="nav-search" placeholder="Поиск по имени..." 
                   style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px;">
            <div id="nav-list" style="max-height: 300px; overflow-y: auto; border: 1px solid #eee; padding: 5px;"></div>
        `;
        
        selectorPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            border: 2px solid #2196F3;
        `;
        
        document.body.appendChild(selectorPanel);
        
        // Панель текущего корня (слева вверху)
        const rootPanel = document.createElement('div');
        rootPanel.id = 'nav-current';
        rootPanel.innerHTML = `
            <h4 style="margin-top: 0;">Текущий корень</h4>
            <div id="nav-root-info" style="padding: 10px; background: #f5f5f5; border-radius: 4px; margin-bottom: 10px;">
                Полное дерево
            </div>
            <button id="nav-reset-btn" style="width: 100%; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Показать всё дерево
            </button>
        `;
        
        rootPanel.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 250px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 9999;
            border: 2px solid #4CAF50;
        `;
        
        document.body.appendChild(rootPanel);
        
        // Панель статистики (справа внизу)
        const statsPanel = document.createElement('div');
        statsPanel.id = 'nav-stats';
        statsPanel.innerHTML = `
            <h4 style="margin-top: 0;">Статистика</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #666;">Всего</div>
                    <div id="nav-total" style="font-size: 24px; font-weight: bold;">0</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #666;">Мужчин</div>
                    <div id="nav-males" style="font-size: 24px; font-weight: bold; color: #2196F3;">0</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #666;">Женщин</div>
                    <div id="nav-females" style="font-size: 24px; font-weight: bold; color: #E91E63;">0</div>
                </div>
            </div>
            <div style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
                <strong>Подсказки:</strong><br>
                • Кликните на человека в дереве<br>
                • Используйте поиск справа<br>
                • Esc - сброс к полному дереву
            </div>
        `;
        
        statsPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 9998;
            border: 2px solid #9C27B0;
        `;
        
        document.body.appendChild(statsPanel);
    }
    
    function updateAllPanels() {
        updatePersonList();
        updateStatistics();
    }
    
    function updatePersonList(searchTerm = '') {
        const list = document.getElementById('nav-list');
        if (!list || !window.familyTree || !window.familyTree.data) return;
        
        const people = window.familyTree.data.people;
        const filtered = searchTerm ? 
            people.filter(p => 
                `${p.name} ${p.surname}`.toLowerCase().includes(searchTerm.toLowerCase())
            ) : people;
        
        if (filtered.length === 0) {
            list.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Ничего не найдено</div>';
            return;
        }
        
        list.innerHTML = filtered.map(person => `
            <div class="person-item" data-id="${person.id}" 
                 style="padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;
                        background: ${person.gender === 'M' ? '#e3f2fd' : '#fce4ec'};
                        transition: all 0.2s;">
                <div style="display: flex; align-items: center;">
                    <div style="width: 30px; height: 30px; border-radius: 50%; background: ${person.gender === 'M' ? '#2196F3' : '#E91E63'}; 
                         color: white; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                        ${person.gender === 'M' ? '♂' : '♀'}
                    </div>
                    <div>
                        <strong>${person.name} ${person.surname}</strong><br>
                        <small style="color: #666;">ID: ${person.id}</small>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Добавляем обработчики кликов
        list.querySelectorAll('.person-item').forEach(item => {
            item.addEventListener('click', function() {
                const personId = this.dataset.id;
                selectPerson(personId);
            });
        });
    }
    
    function updateStatistics() {
        if (!window.familyTree || !window.familyTree.data) return;
        
        const people = window.familyTree.data.people;
        const total = people.length;
        const males = people.filter(p => p.gender === 'M').length;
        const females = people.filter(p => p.gender === 'F').length;
        
        const totalEl = document.getElementById('nav-total');
        const malesEl = document.getElementById('nav-males');
        const femalesEl = document.getElementById('nav-females');
        
        if (totalEl) totalEl.textContent = total;
        if (malesEl) malesEl.textContent = males;
        if (femalesEl) femalesEl.textContent = females;
    }
    
    function selectPerson(personId) {
        if (!window.familyTree || !window.familyTree.data) return;
        
        const person = window.familyTree.data.people.find(p => p.id === personId);
        if (!person) return;
        
        console.log('Выбран человек:', person.name, person.surname);
        
        // 1. Выделяем в дереве
        if (typeof window.familyTree.selectPerson === 'function') {
            window.familyTree.selectPerson(personId);
        }
        
        // 2. Перестраиваем дерево от этого человека
        if (typeof window.familyTree.buildTree === 'function') {
            window.familyTree.buildTree(personId);
        }
        
        // 3. Обновляем информацию о корне
        updateCurrentRoot(person);
        
        // 4. Показываем сообщение
        showMessage(`Дерево перестроено от ${person.name} ${person.surname}`, 'success');
    }
    
    function updateCurrentRoot(person) {
        const rootInfo = document.getElementById('nav-root-info');
        if (!rootInfo) return;
        
        if (person) {
            rootInfo.innerHTML = `
                <div style="margin-bottom: 5px;">
                    <strong>${person.name} ${person.surname}</strong>
                </div>
                <div style="font-size: 12px;">
                    <span style="color: ${person.gender === 'M' ? '#2196F3' : '#E91E63'};">
                        ${person.gender === 'M' ? '♂ Мужской' : '♀ Женский'}
                    </span>
                    ${person.birthDate ? `<br>Родился: ${person.birthDate}` : ''}
                </div>
            `;
        } else {
            rootInfo.innerHTML = 'Полное дерево';
        }
    }
    
    function resetToFullTree() {
        console.log('Сброс к полному дереву');
        
        if (typeof window.familyTree.buildTree === 'function') {
            window.familyTree.buildTree();
        }
        
        updateCurrentRoot(null);
        showMessage('Показано полное дерево', 'info');
    }
    
    function setupHandlers() {
        // Поиск
        const searchInput = document.getElementById('nav-search');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                updatePersonList(e.target.value);
            });
        }
        
        // Кнопка скрытия
        const hideBtn = document.getElementById('nav-hide-btn');
        if (hideBtn) {
            hideBtn.addEventListener('click', function() {
                const panel = document.getElementById('nav-selector');
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                this.textContent = panel.style.display === 'none' ? '👁' : '×';
            });
        }
        
        // Кнопка сброса
        const resetBtn = document.getElementById('nav-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetToFullTree);
        }
        
        // Горячие клавиши
        document.addEventListener('keydown', function(e) {
            // Ctrl+F - поиск
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                const search = document.getElementById('nav-search');
                if (search) {
                    search.focus();
                    search.select();
                }
            }
            
            // Escape - сброс
            if (e.key === 'Escape') {
                resetToFullTree();
            }
            
            // F2 - скрыть/показать панель выбора
            if (e.key === 'F2') {
                e.preventDefault();
                const panel = document.getElementById('nav-selector');
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                }
            }
        });
        
        // Обработка кликов по узлам дерева
        document.addEventListener('click', function(e) {
            // Проверяем, кликнули ли на узел дерева
            if (e.target.closest('.node') || e.target.closest('circle') || e.target.classList.contains('node')) {
                const node = e.target.closest('.node') || e.target;
                const d3Data = d3.select(node).datum();
                
                if (d3Data && d3Data.data && d3Data.data.id) {
                    e.preventDefault();
                    e.stopPropagation();
                    selectPerson(d3Data.data.id);
                }
            }
        });
    }
    
    function showMessage(text, type = 'info') {
        // Создаем временное уведомление
        const msg = document.createElement('div');
        msg.textContent = text;
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 100000;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: fadeInOut 2s;
        `;
        
        document.body.appendChild(msg);
        
        // Автоматически удаляем через 2 секунды
        setTimeout(() => {
            msg.style.opacity = '0';
            msg.style.transition = 'opacity 0.5s';
            setTimeout(() => msg.remove(), 500);
        }, 2000);
    }
    
    // Добавляем стили анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
        
        .person-item:hover {
            background-color: #f0f0f0 !important;
            transform: translateX(5px);
        }
        
        .person-item {
            transition: all 0.2s ease;
        }
    `;
    document.head.appendChild(style);
    
    // Запускаем ожидание FamilyTree
    console.log('Ожидание FamilyTree...');
    waitForFamilyTree();
    
})();
