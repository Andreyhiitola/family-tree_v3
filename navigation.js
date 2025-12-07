// navigation_enhanced.js - Модуль навигации с панорамированием и зумом

(function() {
    'use strict';
    
    console.log('=== УЛУЧШЕННАЯ НАВИГАЦИЯ ПО ДЕРЕВУ ===');
    
    let zoomEnabled = true;
    let isDragging = false;
    let startX, startY;
    let translateX = 0, translateY = 0;
    let scale = 1;
    let minScale = 0.3;
    let maxScale = 3;
    
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
        console.log('Инициализация улучшенной навигации...');
        
        // Добавляем стили
        addEnhancedStyles();
        
        // 1. Создаем панели
        createPanels();
        
        // 2. Создаем элементы управления навигацией
        createNavigationControls();
        
        // 3. Обновляем данные
        updateAllPanels();
        
        // 4. Настраиваем дерево
        setupTreeNavigation();
        
        // 5. Добавляем обработчики
        setupHandlers();
        
        console.log('Улучшенная навигация готова');
    }
    
    function setupTreeNavigation() {
        // Настраиваем контейнер дерева для навигации
        const treeContainer = document.getElementById('tree');
        if (!treeContainer) return;
        
        // Обернем дерево в контейнер для навигации
        const navContainer = document.createElement('div');
        navContainer.id = 'tree-nav-container';
        navContainer.style.cssText = `
            width: 100%;
            height: 70vh;
            overflow: auto;
            position: relative;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            margin-top: 10px;
            background: linear-gradient(45deg, #f9f9f9 25%, transparent 25%),
                        linear-gradient(-45deg, #f9f9f9 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #f9f9f9 75%),
                        linear-gradient(-45deg, transparent 75%, #f9f9f9 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        `;
        
        // Создаем контейнер для содержимого дерева (для трансформаций)
        const contentWrapper = document.createElement('div');
        contentWrapper.id = 'tree-content-wrapper';
        contentWrapper.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            transform-origin: 0 0;
            transition: transform 0.3s ease;
        `;
        
        // Перемещаем дерево в контейнер
        treeContainer.parentNode.insertBefore(navContainer, treeContainer);
        navContainer.appendChild(contentWrapper);
        contentWrapper.appendChild(treeContainer);
        
        // Добавляем информационную панель навигации
        const navInfo = document.createElement('div');
        navInfo.id = 'nav-info-panel';
        navInfo.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <span id="nav-scale-info">Масштаб: 100%</span>
                <span id="nav-position-info">Позиция: 0, 0</span>
                <button id="nav-reset-view" style="padding: 4px 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Сбросить вид
                </button>
            </div>
        `;
        
        navInfo.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.9);
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 100;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            backdrop-filter: blur(5px);
        `;
        
        navContainer.appendChild(navInfo);
        
        // Обновляем дерево после перестановки
        setTimeout(() => {
            if (window.familyTree && typeof window.familyTree.buildTree === 'function') {
                window.familyTree.buildTree();
            }
        }, 100);
        
        // Инициализируем навигационные события
        initTreeNavigationEvents(navContainer, contentWrapper);
    }
    
    function initTreeNavigationEvents(container, wrapper) {
        // 1. Масштабирование колесиком мыши
        container.addEventListener('wheel', function(e) {
            if (!zoomEnabled) return;
            
            e.preventDefault();
            
            const rect = container.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(minScale, Math.min(maxScale, scale * delta));
            
            // Вычисляем смещение для зума в точку курсора
            const scaleChange = newScale / scale;
            translateX = offsetX - (offsetX - translateX) * scaleChange;
            translateY = offsetY - (offsetY - translateY) * scaleChange;
            scale = newScale;
            
            updateTreeTransform(wrapper);
            updateNavigationInfo();
        }, { passive: false });
        
        // 2. Перетаскивание для панорамирования
        container.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return; // только левая кнопка
            
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            
            container.style.cursor = 'grabbing';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            
            updateTreeTransform(wrapper);
            updateNavigationInfo();
        });
        
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                container.style.cursor = 'grab';
            }
        });
        
        // 3. События для сенсорных устройств
        let touchStartDistance = 0;
        let touchStartScale = 1;
        
        container.addEventListener('touchstart', function(e) {
            if (e.touches.length === 2) {
                // Начало мультитач зума
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touchStartDistance = Math.sqrt(dx * dx + dy * dy);
                touchStartScale = scale;
            } else if (e.touches.length === 1) {
                // Начало перетаскивания
                isDragging = true;
                startX = e.touches[0].clientX - translateX;
                startY = e.touches[0].clientY - translateY;
            }
            e.preventDefault();
        }, { passive: false });
        
        container.addEventListener('touchmove', function(e) {
            if (e.touches.length === 2) {
                // Мультитач зум
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const touchDistance = Math.sqrt(dx * dx + dy * dy);
                
                if (touchStartDistance > 0) {
                    scale = Math.max(minScale, Math.min(maxScale, 
                        touchStartScale * touchDistance / touchStartDistance));
                    updateTreeTransform(wrapper);
                    updateNavigationInfo();
                }
            } else if (e.touches.length === 1 && isDragging) {
                // Перетаскивание
                translateX = e.touches[0].clientX - startX;
                translateY = e.touches[0].clientY - startY;
                updateTreeTransform(wrapper);
                updateNavigationInfo();
            }
            e.preventDefault();
        }, { passive: false });
        
        container.addEventListener('touchend', function() {
            isDragging = false;
            touchStartDistance = 0;
        });
        
        // 4. Сброс вида
        document.getElementById('nav-reset-view').addEventListener('click', function() {
            resetTreeView(wrapper);
        });
        
        // Устанавливаем начальный курсор
        container.style.cursor = 'grab';
    }
    
    function updateTreeTransform(wrapper) {
        wrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
    
    function resetTreeView(wrapper) {
        translateX = 0;
        translateY = 0;
        scale = 1;
        updateTreeTransform(wrapper);
        updateNavigationInfo();
        showMessage('Вид сброшен', 'info');
    }
    
    function updateNavigationInfo() {
        const scaleInfo = document.getElementById('nav-scale-info');
        const positionInfo = document.getElementById('nav-position-info');
        
        if (scaleInfo) {
            scaleInfo.textContent = `Масштаб: ${Math.round(scale * 100)}%`;
        }
        
        if (positionInfo) {
            positionInfo.textContent = `Позиция: ${Math.round(translateX)}, ${Math.round(translateY)}`;
        }
    }
    
    function createNavigationControls() {
        // Панель управления навигацией (слева от дерева)
        const controlsPanel = document.createElement('div');
        controlsPanel.id = 'nav-controls-panel';
        controlsPanel.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px; color: #333; font-weight: bold;">
                Навигация
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-bottom: 15px;">
                <button class="nav-control-btn" data-action="zoom-in" title="Увеличить (Ctrl++)">
                    <span style="font-size: 18px;">+</span>
                </button>
                <button class="nav-control-btn" data-action="reset-view" title="Сбросить вид (R)">
                    <span style="font-size: 18px;">⟳</span>
                </button>
                <button class="nav-control-btn" data-action="zoom-out" title="Уменьшить (Ctrl+-)">
                    <span style="font-size: 18px;">−</span>
                </button>
                <button class="nav-control-btn" data-action="pan-up" title="Вверх (↑)">
                    <span style="font-size: 18px;">↑</span>
                </button>
                <button class="nav-control-btn" data-action="pan-center" title="Центрировать (C)">
                    <span style="font-size: 18px;">◎</span>
                </button>
                <button class="nav-control-btn" data-action="pan-down" title="Вниз (↓)">
                    <span style="font-size: 18px;">↓</span>
                </button>
                <button class="nav-control-btn" data-action="pan-left" title="Влево (←)">
                    <span style="font-size: 18px;">←</span>
                </button>
                <button class="nav-control-btn" data-action="fit-tree" title="Вписать дерево (F)">
                    <span style="font-size: 14px;">⎙</span>
                </button>
                <button class="nav-control-btn" data-action="pan-right" title="Вправо (→)">
                    <span style="font-size: 18px;">→</span>
                </button>
            </div>
            <div style="font-size: 11px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
                <div><strong>Управление:</strong></div>
                <div>• Колесико - масштаб</div>
                <div>• ЛКМ - перетаскивание</div>
                <div>• Shift+колесико - горизонтальная прокрутка</div>
            </div>
        `;
        
        controlsPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 20px;
            transform: translateY(-50%);
            width: 180px;
            background: rgba(255, 255, 255, 0.95);
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 9997;
            border: 1px solid #ddd;
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(controlsPanel);
        
        // Обработчики кнопок навигации
        controlsPanel.querySelectorAll('.nav-control-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.dataset.action;
                handleNavigationAction(action);
            });
        });
    }
    
    function handleNavigationAction(action) {
        const wrapper = document.getElementById('tree-content-wrapper');
        const container = document.getElementById('tree-nav-container');
        if (!wrapper || !container) return;
        
        const containerRect = container.getBoundingClientRect();
        const step = 50;
        const zoomStep = 0.2;
        
        switch(action) {
            case 'zoom-in':
                scale = Math.min(maxScale, scale + zoomStep);
                break;
            case 'zoom-out':
                scale = Math.max(minScale, scale - zoomStep);
                break;
            case 'pan-up':
                translateY += step;
                break;
            case 'pan-down':
                translateY -= step;
                break;
            case 'pan-left':
                translateX += step;
                break;
            case 'pan-right':
                translateX -= step;
                break;
            case 'pan-center':
                translateX = containerRect.width / 2;
                translateY = containerRect.height / 2;
                break;
            case 'reset-view':
                resetTreeView(wrapper);
                return;
            case 'fit-tree':
                fitTreeToView();
                return;
        }
        
        updateTreeTransform(wrapper);
        updateNavigationInfo();
    }
    
    function fitTreeToView() {
        const container = document.getElementById('tree-nav-container');
        const wrapper = document.getElementById('tree-content-wrapper');
        if (!container || !wrapper) return;
        
        const tree = document.querySelector('#tree svg');
        if (!tree) return;
        
        const containerRect = container.getBoundingClientRect();
        const treeRect = tree.getBoundingClientRect();
        
        // Вычисляем масштаб для вписывания
        const scaleX = containerRect.width / treeRect.width;
        const scaleY = containerRect.height / treeRect.height;
        scale = Math.min(scaleX, scaleY, 1) * 0.9; // 10% отступ
        
        // Центрируем
        translateX = (containerRect.width - treeRect.width * scale) / 2;
        translateY = (containerRect.height - treeRect.height * scale) / 2;
        
        updateTreeTransform(wrapper);
        updateNavigationInfo();
        showMessage('Дерево вписано в окно', 'success');
    }
    
    // Остальные функции (createPanels, updateAllPanels, etc.) остаются как в предыдущей версии
    // Для экономии места оставляем только сигнатуры
    
    function createPanels() {
        // Создаем те же панели, что и раньше, но с небольшими улучшениями
        createPersonSelector();
        createCurrentRootPanel();
        createStatisticsPanel();
    }
    
    function createPersonSelector() {
        const oldPanel = document.getElementById('nav-selector');
        if (oldPanel) oldPanel.remove();
        
        const panel = document.createElement('div');
        panel.id = 'nav-selector';
        panel.innerHTML = `
            <div class="nav-header" style="display: flex; justify-content: space-between; align-items: center; 
                  cursor: pointer; padding: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; border-radius: 4px 4px 0 0;">
                <h4 style="margin: 0; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <span>🔍</span> Поиск человека
                </h4>
                <button id="nav-toggle-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; 
                       font-size: 18px; cursor: pointer; padding: 0 10px; border-radius: 4px;">−</button>
            </div>
            <div id="nav-content" style="padding: 15px; background: white; display: block; max-height: 400px; overflow-y: auto;">
                <div style="margin-bottom: 10px;">
                    <input type="text" id="nav-search" placeholder="Введите имя или фамилию..." 
                           style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px;">
                </div>
                <div id="nav-list" style="max-height: 300px; overflow-y: auto;"></div>
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                    <strong>Совет:</strong> Используйте Ctrl+F для быстрого поиска
                </div>
            </div>
        `;
        
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 25px rgba(0,0,0,0.15);
            z-index: 10000;
            overflow: hidden;
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(panel);
    }
    
    function createCurrentRootPanel() {
        const panel = document.createElement('div');
        panel.id = 'nav-current';
        panel.innerHTML = `
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 12px; border-radius: 8px 8px 0 0;">
                <h4 style="margin: 0; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <span>🌳</span> Текущий корень
                </h4>
            </div>
            <div style="padding: 15px; background: white;">
                <div id="nav-root-info" style="padding: 15px; background: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%); 
                     border-radius: 8px; margin-bottom: 15px; border: 1px solid #e0e0e0; text-align: center;">
                    <div style="color: #666; font-style: italic; font-size: 13px;">
                        Полное дерево
                    </div>
                </div>
                <button id="nav-reset-btn" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); 
                       color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px;">
                    🔄 Показать всё дерево
                </button>
            </div>
        `;
        
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 260px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 25px rgba(0,0,0,0.15);
            z-index: 9999;
            overflow: hidden;
        `;
        
        document.body.appendChild(panel);
    }
    
    function createStatisticsPanel() {
        const panel = document.createElement('div');
        panel.id = 'nav-stats';
        panel.innerHTML = `
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 12px; border-radius: 8px 8px 0 0;">
                <h4 style="margin: 0; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <span>📊</span> Статистика
                </h4>
            </div>
            <div style="padding: 15px; background: white;">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center; margin-bottom: 15px;">
                    <div>
                        <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Всего</div>
                        <div id="nav-total" style="font-size: 28px; font-weight: bold; color: #333;">0</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Мужчин</div>
                        <div id="nav-males" style="font-size: 28px; font-weight: bold; color: #2196F3;">0</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Женщин</div>
                        <div id="nav-females" style="font-size: 28px; font-weight: bold; color: #E91E63;">0</div>
                    </div>
                </div>
                <div style="font-size: 11px; color: #666; border-top: 1px solid #eee; padding-top: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <span style="background: #4CAF50; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">Ctrl+F</span>
                        <span>Поиск</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <span style="background: #FF9800; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">R</span>
                        <span>Сброс вида</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="background: #9C27B0; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">F2</span>
                        <span>Скрыть панели</span>
                    </div>
                </div>
            </div>
        `;
        
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 25px rgba(0,0,0,0.15);
            z-index: 9998;
            overflow: hidden;
        `;
        
        document.body.appendChild(panel);
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
            list.innerHTML = `
                <div style="padding: 30px 20px; text-align: center; color: #666; background: #f9f9f9; border-radius: 6px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
                    <div style="font-size: 14px; font-weight: 500;">Ничего не найдено</div>
                    <div style="font-size: 12px; margin-top: 5px;">Попробуйте другой запрос</div>
                </div>
            `;
            return;
        }
        
        list.innerHTML = filtered.map(person => `
            <div class="person-item" data-id="${person.id}" 
                 style="padding: 12px; margin: 8px 0; border: 1px solid #e8e8e8; border-radius: 8px; cursor: pointer;
                        background: white;
                        transition: all 0.2s; 
                        border-left: 5px solid ${person.gender === 'M' ? '#2196F3' : '#E91E63'};
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: ${person.gender === 'M' ? '#e3f2fd' : '#fce4ec'}; 
                             color: ${person.gender === 'M' ? '#1565c0' : '#c2185b'}; display: flex; align-items: center; 
                             justify-content: center; margin-right: 12px; font-weight: bold; font-size: 18px;">
                            ${person.gender === 'M' ? '♂' : '♀'}
                        </div>
                        <div>
                            <div style="font-weight: 600; font-size: 14px; color: #333;">${person.name} ${person.surname}</div>
                            <div style="font-size: 12px; color: #666; display: flex; align-items: center; gap: 8px; margin-top: 2px;">
                                ${person.birthDate ? `<span>🎂 ${person.birthDate}</span>` : ''}
                                <span style="background: #f5f5f5; padding: 1px 6px; border-radius: 3px; font-size: 10px;">
                                    ID: ${person.id}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style="color: #ccc; font-size: 16px;">
                        →
                    </div>
                </div>
            </div>
        `).join('');
        
        // Обработчики кликов
        list.querySelectorAll('.person-item').forEach(item => {
            item.addEventListener('click', function() {
                const personId = this.dataset.id;
                selectPerson(personId);
                
                // Подсвечиваем выбранный элемент
                list.querySelectorAll('.person-item').forEach(el => {
                    el.style.background = 'white';
                    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                });
                this.style.background = '#f0f7ff';
                this.style.boxShadow = '0 4px 8px rgba(33, 150, 243, 0.2)';
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
        
        // 4. Центрируем вид на выбранном человеке
        centerOnPerson(personId);
        
        // 5. Показываем сообщение
        showMessage(`🌳 Дерево перестроено от ${person.name} ${person.surname}`, 'success');
    }
    
    function centerOnPerson(personId) {
        // Находим элемент дерева с этим человеком
        setTimeout(() => {
            const node = document.querySelector(`[data-person-id="${personId}"]`) || 
                        document.querySelector(`.node[data-id="${personId}"]`);
            
            if (node) {
                const container = document.getElementById('tree-nav-container');
                const wrapper = document.getElementById('tree-content-wrapper');
                
                if (container && wrapper) {
                    const containerRect = container.getBoundingClientRect();
                    const nodeRect = node.getBoundingClientRect();
                    
                    // Вычисляем позицию для центрирования
                    translateX = containerRect.width / 2 - (nodeRect.left - containerRect.left) - nodeRect.width / 2;
                    translateY = containerRect.height / 2 - (nodeRect.top - containerRect.top) - nodeRect.height / 2;
                    
                    updateTreeTransform(wrapper);
                    updateNavigationInfo();
                }
            }
        }, 300);
    }
    
    function updateCurrentRoot(person) {
        const rootInfo = document.getElementById('nav-root-info');
        if (!rootInfo) return;
        
        if (person) {
            rootInfo.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px; color: #333;">
                        ${person.name} ${person.surname}
                    </div>
                    <div style="display: inline-block; padding: 6px 16px; background: ${person.gender === 'M' ? '#e3f2fd' : '#fce4ec'}; 
                         color: ${person.gender === 'M' ? '#1565c0' : '#c2185b'}; border-radius: 20px; font-size: 13px; 
                         margin-bottom: 10px; border: 1px solid ${person.gender === 'M' ? '#bbdefb' : '#f8bbd0'};">
                        ${person.gender === 'M' ? '♂ Мужской' : '♀ Женский'}
                    </div>
                    ${person.birthDate ? `
                        <div style="font-size: 13px; color: #666; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 5px;">
                            <span>🎂</span>
                            <span>${person.birthDate}</span>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            rootInfo.innerHTML = `
                <div style="text-align: center; color: #666; font-style: italic; padding: 10px;">
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
        
        if (toggleBtn && panelContent) {
            toggleBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (panelContent.style.display === 'none') {
                    panelContent.style.display = 'block';
                    this.textContent = '−';
                    document.getElementById('nav-selector').style.width = '300px';
                } else {
                    panelContent.style.display = 'none';
                    this.textContent = '+';
                    document.getElementById('nav-selector').style.width = '200px';
                }
            });
        }
        
        // Кнопка сброса дерева
        const resetBtn = document.getElementById('nav-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetToFullTree);
        }
        
        // Глобальные горячие клавиши
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
            
            // R - сброс вида
            if (e.key === 'r' || e.key === 'R') {
                const resetBtn = document.getElementById('nav-reset-view');
                if (resetBtn) resetBtn.click();
            }
            
            // F - вписать дерево в окно
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                fitTreeToView();
            }
            
            // C - центрировать
            if (e.key === 'c' || e.key === 'C') {
                handleNavigationAction('pan-center');
            }
            
            // Стрелки для навигации
            if (e.key === 'ArrowUp') handleNavigationAction('pan-up');
            if (e.key === 'ArrowDown') handleNavigationAction('pan-down');
            if (e.key === 'ArrowLeft') handleNavigationAction('pan-left');
            if (e.key === 'ArrowRight') handleNavigationAction('pan-right');
            
            // +/- для зума
            if ((e.key === '+' || e.key === '=') && e.ctrlKey) {
                e.preventDefault();
                handleNavigationAction('zoom-in');
            }
            if ((e.key === '-' || e.key === '_') && e.ctrlKey) {
                e.preventDefault();
                handleNavigationAction('zoom-out');
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
                        panel.style.width = '300px';
                    } else {
                        content.style.display = 'none';
                        btn.textContent = '+';
                        panel.style.width = '200px';
                    }
                }
            }
            
            // Escape - сброс дерева
            if (e.key === 'Escape') {
                resetToFullTree();
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
        const msg = document.createElement('div');
        msg.textContent = text;
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 14px 28px;
            border-radius: 8px;
            z-index: 100000;
            font-weight: 600;
            box-shadow: 0 6px 20px rgba(0,0,0,0.25);
            animation: navFadeInOut 2.5s;
            font-size: 15px;
            text-align: center;
            min-width: 300px;
            max-width: 400px;
            backdrop-filter: blur(5px);
        `;
        
        document.body.appendChild(msg);
        
        setTimeout(() => {
            msg.style.opacity = '0';
            msg.style.transition = 'opacity 0.5s';
            setTimeout(() => msg.remove(), 500);
        }, 2000);
    }
    
    function addEnhancedStyles() {
        const style = document.createElement('style');
        style.id = 'nav-enhanced-styles';
        style.textContent = `
            @keyframes navFadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
            
            .person-item:hover {
                background-color: #f8f9fa !important;
                transform: translateX(5px) !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
            }
            
            .person-item {
                transition: all 0.2s ease !important;
            }
            
            /* Стили для контейнера навигации */
            #tree-nav-container {
                scrollbar-width: thin;
                scrollbar-color: #aaa #f0f0f0;
            }
            
            #tree-nav-container::-webkit-scrollbar {
                width: 12px;
                height: 12px;
            }
            
            #tree-nav-container::-webkit-scrollbar-track {
                background: #f0f0f0;
                border-radius: 6px;
            }
            
            #tree-nav-container::-webkit-scrollbar-thumb {
                background: #aaa;
                border-radius: 6px;
                border: 2px solid #f0f0f0;
            }
            
            #tree-nav-container::-webkit-scrollbar-thumb:hover {
                background: #888;
            }
            
            /* Кнопки управления навигацией */
            .nav-control-btn {
                width: 100%;
                height: 40px;
                background: white;
                border: 2px solid #e0e0e0;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                color: #333;
                transition: all 0.2s;
            }
            
            .nav-control-btn:hover {
                background: #f5f5f5;
                border-color: #2196F3;
                color: #2196F3;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(33, 150, 243, 0.2);
            }
            
            .nav-control-btn:active {
                transform: translateY(0);
                box-shadow: none;
            }
            
            /* Адаптивность */
            @media (max-width: 1400px) {
                #nav-controls-panel {
                    left: 10px;
                    width: 160px;
                }
                
                #nav-selector, #nav-current, #nav-stats {
                    max-width: 280px;
                }
                
                #nav-selector.collapsed {
                    width: 180px !important;
                }
            }
            
            @media (max-width: 1200px) {
                #nav-controls-panel {
                    display: none;
                }
            }
            
            /* Анимации */
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .nav-highlight {
                animation: pulse 1s ease-in-out;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Запускаем ожидание FamilyTree
    console.log('Ожидание FamilyTree...');
    waitForFamilyTree();
    
})();
