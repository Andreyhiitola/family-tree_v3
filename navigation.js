// navigation_fixed.js - Исправленный модуль навигации

(function() {
    'use strict';
    
    console.log('=== НАВИГАЦИЯ ПО ДЕРЕВУ (ИСПРАВЛЕННАЯ) ===');
    
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
        
        // Добавляем стили
        addStyles();
        
        // 1. Создаем простые панели
        createPanels();
        
        // 2. Обновляем данные
        updateAllPanels();
        
        // 3. Добавляем обработчики
        setupHandlers();
        
        // 4. Исправляем контейнер дерева
        fixTreeContainer();
        
        console.log('Навигация готова');
    }
    
    function fixTreeContainer() {
        // Добавляем горизонтальный скролл для дерева
        const treeContainer = document.getElementById('tree');
        if (treeContainer) {
            // Обернем дерево в контейнер со скроллом
            const wrapper = document.createElement('div');
            wrapper.id = 'tree-scroll-wrapper';
            wrapper.style.cssText = `
                width: 100%;
                height: 70vh;
                overflow: auto;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-top: 10px;
            `;
            
            // Перемещаем дерево в обертку
            treeContainer.parentNode.insertBefore(wrapper, treeContainer);
            wrapper.appendChild(treeContainer);
            
            // Обновляем размеры дерева
            setTimeout(() => {
                if (window.familyTree && typeof window.familyTree.buildTree === 'function') {
                    window.familyTree.buildTree();
                }
            }, 100);
        }
    }
    
    function createPanels() {
        // Панель выбора человека (справа вверху) - СВОРАЧИВАЕМАЯ
        const selectorPanel = document.createElement('div');
        selectorPanel.id = 'nav-selector';
        selectorPanel.innerHTML = `
            <div class="nav-header" style="display: flex; justify-content: space-between; align-items: center; 
                  cursor: pointer; padding: 10px; background: #2196F3; color: white; border-radius: 4px;">
                <h4 style="margin: 0; font-size: 14px;">🔍 Поиск человека</h4>
                <button id="nav-toggle-btn" style="background: none; border: none; color: white; font-size: 18px; 
                       cursor: pointer; padding: 0 5px;">−</button>
            </div>
            <div id="nav-content" style="padding: 15px; background: white; display: block;">
                <input type="text" id="nav-search" placeholder="Введите имя или фамилию..." 
                       style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px;">
                <div id="nav-list" style="max-height: 250px; overflow-y: auto; border: 1px solid #eee; padding: 5px; 
                     border-radius: 4px;"></div>
                <div style="margin-top: 10px; font-size: 12px; color: #666;">
                    <strong>Подсказка:</strong> кликните на человека в списке
                </div>
            </div>
        `;
        
        selectorPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 280px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            border: 1px solid #ddd;
            overflow: hidden;
        `;
        
        document.body.appendChild(selectorPanel);
        
        // Панель текущего корня (слева вверху)
        const rootPanel = document.createElement('div');
        rootPanel.id = 'nav-current';
        rootPanel.innerHTML = `
            <div style="background: #4CAF50; color: white; padding: 10px; border-radius: 4px 4px 0 0;">
                <h4 style="margin: 0; font-size: 14px;">🌳 Текущий корень</h4>
            </div>
            <div style="padding: 15px; background: white;">
                <div id="nav-root-info" style="padding: 10px; background: #f9f9f9; border-radius: 4px; 
                     margin-bottom: 10px; border: 1px solid #eee;">
                    <div style="text-align: center; color: #666; font-style: italic;">
                        Полное дерево
                    </div>
                </div>
                <button id="nav-reset-btn" style="width: 100%; padding: 8px; background: #4CAF50; color: white; 
                       border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    🔄 Показать всё дерево
                </button>
            </div>
        `;
        
        rootPanel.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 250px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            border: 1px solid #ddd;
        `;
        
        document.body.appendChild(rootPanel);
        
        // Панель статистики (справа внизу)
        const statsPanel = document.createElement('div');
        statsPanel.id = 'nav-stats';
        statsPanel.innerHTML = `
            <div style="background: #9C27B0; color: white; padding: 10px; border-radius: 4px 4px 0 0;">
                <h4 style="margin: 0; font-size: 14px;">📊 Статистика</h4>
            </div>
            <div style="padding: 15px; background: white;">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; 
                     margin-bottom: 15px;">
                    <div>
                        <div style="font-size: 11px; color: #666; text-transform: uppercase;">Всего</div>
                        <div id="nav-total" style="font-size: 24px; font-weight: bold; color: #333;">0</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #666; text-transform: uppercase;">Мужчин</div>
                        <div id="nav-males" style="font-size: 24px; font-weight: bold; color: #2196F3;">0</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #666; text-transform: uppercase;">Женщин</div>
                        <div id="nav-females" style="font-size: 24px; font-weight: bold; color: #E91E63;">0</div>
                    </div>
                </div>
                <div style="font-size: 11px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
                    <strong>Горячие клавиши:</strong>
                    <div style="margin-top: 5px;">
                        • <kbd style="background: #f1f1f1; padding: 2px 4px; border-radius: 3px;">Ctrl+F</kbd> - поиск
                    </div>
                    <div>
                        • <kbd style="background: #f1f1f1; padding: 2px 4px; border-radius: 3px;">Esc</kbd> - сброс
                    </div>
                    <div>
                        • <kbd style="background: #f1f1f1; padding: 2px 4px; border-radius: 3px;">F2</kbd> - скрыть/показать
                    </div>
                </div>
            </div>
        `;
        
        statsPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 280px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 15px rgba(0,0,0,0.2);
            z-index: 9998;
            border: 1px solid #ddd;
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
                 style="padding: 10px; margin: 5px 0; border: 1px solid #e0e0e0; border-radius: 4px; cursor: pointer;
                        background: white;
                        transition: all 0.2s; border-left: 4px solid ${person.gender === 'M' ? '#2196F3' : '#E91E63'};">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${person.gender === 'M' ? '#e3f2fd' : '#fce4ec'}; 
                             color: ${person.gender === 'M' ? '#1565c0' : '#c2185b'}; display: flex; align-items: center; 
                             justify-content: center; margin-right: 10px; font-weight: bold;">
                            ${person.gender === 'M' ? '♂' : '♀'}
                        </div>
                        <div>
                            <div style="font-weight: bold; font-size: 13px;">${person.name} ${person.surname}</div>
                            <div style="font-size: 11px; color: #666;">
                                ${person.birthDate ? `🎂 ${person.birthDate}` : ''}
                            </div>
                        </div>
                    </div>
                    <div style="font-size: 12px; color: #999; background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">
                        ID: ${person.id}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Добавляем обработчики кликов
        list.querySelectorAll('.person-item').forEach(item => {
            item.addEventListener('click', function() {
                const personId = this.dataset.id;
                selectPerson(personId);
                
                // Подсвечиваем выбранный элемент
                list.querySelectorAll('.person-item').forEach(el => {
                    el.style.background = 'white';
                    el.style.boxShadow = 'none';
                });
                this.style.background = '#f0f7ff';
                this.style.boxShadow = '0 2px 4px rgba(33, 150, 243, 0.2)';
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
        showMessage(`🌳 Дерево перестроено от ${person.name} ${person.surname}`, 'success');
    }
    
    function updateCurrentRoot(person) {
        const rootInfo = document.getElementById('nav-root-info');
        if (!rootInfo) return;
        
        if (person) {
            rootInfo.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px; color: #333;">
                        ${person.name} ${person.surname}
                    </div>
                    <div style="display: inline-block; padding: 4px 12px; background: ${person.gender === 'M' ? '#e3f2fd' : '#fce4ec'}; 
                         color: ${person.gender === 'M' ? '#1565c0' : '#c2185b'}; border-radius: 12px; font-size: 12px; 
                         margin-bottom: 8px;">
                        ${person.gender === 'M' ? '♂ Мужской' : '♀ Женский'}
                    </div>
                    ${person.birthDate ? `
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">
                            🎂 ${person.birthDate}
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            rootInfo.innerHTML = `
                <div style="text-align: center; color: #666; font-style: italic;">
                    Полное дерево
                </div>
            `;
        }
    }
    
    function resetToFullTree() {
        console.log('Сброс к полному дереву');
        
        if (typeof window.familyTree.buildTree === 'function') {
            window.familyTree.buildTree();
        }
        
        updateCurrentRoot(null);
        showMessage('🔄 Показано полное дерево', 'info');
    }
    
    function setupHandlers() {
        // Поиск
        const searchInput = document.getElementById('nav-search');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                updatePersonList(e.target.value);
            });
        }
        
        // Кнопка сворачивания панели выбора
        const toggleBtn = document.getElementById('nav-toggle-btn');
        const panelContent = document.getElementById('nav-content');
        const navHeader = document.querySelector('#nav-selector .nav-header');
        
        if (toggleBtn && panelContent && navHeader) {
            toggleBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (panelContent.style.display === 'none') {
                    panelContent.style.display = 'block';
                    this.textContent = '−';
                    document.getElementById('nav-selector').style.width = '280px';
                } else {
                    panelContent.style.display = 'none';
                    this.textContent = '+';
                    document.getElementById('nav-selector').style.width = '200px';
                }
            });
            
            // Сворачивание по клику на заголовок
            navHeader.addEventListener('click', function(e) {
                if (e.target === this || e.target.tagName === 'H4') {
                    toggleBtn.click();
                }
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
                const content = document.getElementById('nav-content');
                const btn = document.getElementById('nav-toggle-btn');
                if (panel && content && btn) {
                    if (content.style.display === 'none') {
                        content.style.display = 'block';
                        btn.textContent = '−';
                        panel.style.width = '280px';
                    } else {
                        content.style.display = 'none';
                        btn.textContent = '+';
                        panel.style.width = '200px';
                    }
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
            padding: 12px 24px;
            border-radius: 6px;
            z-index: 100000;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            animation: fadeInOut 2s;
            font-size: 14px;
            text-align: center;
            min-width: 300px;
            max-width: 400px;
        `;
        
        document.body.appendChild(msg);
        
        // Автоматически удаляем через 2 секунды
        setTimeout(() => {
            msg.style.opacity = '0';
            msg.style.transition = 'opacity 0.5s';
            setTimeout(() => msg.remove(), 500);
        }, 2000);
    }
    
    function addStyles() {
        // Удаляем старые стили, если есть
        const oldStyle = document.getElementById('nav-styles');
        if (oldStyle) oldStyle.remove();
        
        const style = document.createElement('style');
        style.id = 'nav-styles';
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
            
            .person-item:hover {
                background-color: #f8f9fa !important;
                transform: translateX(3px);
                box-shadow: 0 2px 6px rgba(0,0,0,0.1) !important;
            }
            
            .person-item {
                transition: all 0.2s ease !important;
            }
            
            /* Стили для контейнера дерева */
            #tree-scroll-wrapper {
                scrollbar-width: thin;
                scrollbar-color: #ccc #f5f5f5;
            }
            
            #tree-scroll-wrapper::-webkit-scrollbar {
                width: 10px;
                height: 10px;
            }
            
            #tree-scroll-wrapper::-webkit-scrollbar-track {
                background: #f5f5f5;
                border-radius: 4px;
            }
            
            #tree-scroll-wrapper::-webkit-scrollbar-thumb {
                background: #ccc;
                border-radius: 4px;
            }
            
            #tree-scroll-wrapper::-webkit-scrollbar-thumb:hover {
                background: #aaa;
            }
            
            /* Улучшенные стили для дерева */
            #tree svg {
                min-width: 100%;
                min-height: 600px;
                background: #f9f9f9;
                border-radius: 4px;
            }
            
            /* Адаптивность панелей */
            @media (max-width: 1200px) {
                #nav-selector, #nav-current, #nav-stats {
                    max-width: 250px;
                }
                
                #nav-selector.collapsed {
                    width: 180px !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Запускаем ожидание FamilyTree
    console.log('Ожидание FamilyTree...');
    waitForFamilyTree();
    
})();
