// navigation_fixed.js - Исправленная навигация с правильным скроллом

(function() {
    'use strict';
    
    console.log('=== ИСПРАВЛЕННАЯ НАВИГАЦИЯ ПО ДЕРЕВУ ===');
    
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
        console.log('Инициализация навигации...');
        
        // Добавляем стили
        addFixedStyles();
        
        // 1. Создаем панели
        createPanels();
        
        // 2. Создаем элементы управления навигацией
        createNavigationControls();
        
        // 3. Обновляем данные
        updateAllPanels();
        
        // 4. Настраиваем дерево с правильным скроллом
        setupTreeWithProperScroll();
        
        // 5. Добавляем обработчики
        setupHandlers();
        
        console.log('Навигация готова');
    }
    
    function setupTreeWithProperScroll() {
        const treeContainer = document.getElementById('tree');
        if (!treeContainer) return;
        
        // Создаем правильную структуру для скролла
        const scrollWrapper = document.createElement('div');
        scrollWrapper.id = 'tree-scroll-wrapper';
        scrollWrapper.style.cssText = `
            width: 100%;
            height: 70vh;
            overflow: auto;
            position: relative;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            margin-top: 10px;
            background: #f9f9f9;
        `;
        
        // Создаем контейнер для содержимого
        const contentContainer = document.createElement('div');
        contentContainer.id = 'tree-content-container';
        contentContainer.style.cssText = `
            position: relative;
            min-width: 100%;
            min-height: 100%;
            display: inline-block;
        `;
        
        // Создаем трансформируемый враппер
        const transformWrapper = document.createElement('div');
        transformWrapper.id = 'tree-transform-wrapper';
        transformWrapper.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform-origin: 0 0;
            transform: translate(-50%, -50%) scale(1);
            transition: transform 0.3s ease;
        `;
        
        // Перемещаем дерево в новую структуру
        treeContainer.parentNode.insertBefore(scrollWrapper, treeContainer);
        scrollWrapper.appendChild(contentContainer);
        contentContainer.appendChild(transformWrapper);
        transformWrapper.appendChild(treeContainer);
        
        // Добавляем информационную панель
        const infoPanel = document.createElement('div');
        infoPanel.id = 'tree-nav-info';
        infoPanel.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <div style="display: flex; gap: 15px; align-items: center;">
                    <span id="nav-scale-info" style="font-weight: bold; color: #2196F3;">Масштаб: 100%</span>
                    <span id="nav-position-info" style="color: #666;">Позиция: 0, 0</span>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button id="nav-fit-tree" title="Вписать дерево" style="padding: 4px 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Вписать
                    </button>
                    <button id="nav-reset-view" title="Сбросить вид" style="padding: 4px 8px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Сбросить
                    </button>
                </div>
            </div>
        `;
        
        infoPanel.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.95);
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 100;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border: 1px solid #ddd;
            backdrop-filter: blur(5px);
            min-width: 300px;
            text-align: center;
        `;
        
        scrollWrapper.appendChild(infoPanel);
        
        // Обновляем дерево после перестановки
        setTimeout(() => {
            if (window.familyTree && typeof window.familyTree.buildTree === 'function') {
                window.familyTree.buildTree();
                setTimeout(() => {
                    // После построения дерева центрируем его
                    centerTree();
                }, 300);
            }
        }, 100);
        
        // Инициализируем навигационные события
        initNavigationEvents(scrollWrapper, transformWrapper, contentContainer);
    }
    
    function initNavigationEvents(scrollWrapper, transformWrapper, contentContainer) {
        // 1. Масштабирование колесиком мыши
        scrollWrapper.addEventListener('wheel', function(e) {
            if (!zoomEnabled) return;
            
            e.preventDefault();
            
            // Получаем текущие координаты курсора относительно контейнера
            const rect = scrollWrapper.getBoundingClientRect();
            const mouseX = e.clientX - rect.left + scrollWrapper.scrollLeft;
            const mouseY = e.clientY - rect.top + scrollWrapper.scrollTop;
            
            // Вычисляем старые координаты точки под курсором
            const oldX = (mouseX - translateX) / scale;
            const oldY = (mouseY - translateY) / scale;
            
            // Изменяем масштаб
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(minScale, Math.min(maxScale, scale * delta));
            
            // Вычисляем новые координаты трансформации
            scale = newScale;
            translateX = mouseX - oldX * scale;
            translateY = mouseY - oldY * scale;
            
            updateTreeTransform(transformWrapper);
            updateContentSize(contentContainer, scale);
            updateNavigationInfo();
            
            // Прокручиваем к точке под курсором
            scrollWrapper.scrollLeft = mouseX - rect.width / 2;
            scrollWrapper.scrollTop = mouseY - rect.height / 2;
            
        }, { passive: false });
        
        // 2. Перетаскивание для панорамирования
        let isPanning = false;
        let panStartX, panStartY;
        let scrollStartX, scrollStartY;
        
        transformWrapper.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return;
            
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            scrollStartX = scrollWrapper.scrollLeft;
            scrollStartY = scrollWrapper.scrollTop;
            
            transformWrapper.style.cursor = 'grabbing';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isPanning) return;
            
            const deltaX = e.clientX - panStartX;
            const deltaY = e.clientY - panStartY;
            
            scrollWrapper.scrollLeft = scrollStartX - deltaX;
            scrollWrapper.scrollTop = scrollStartY - deltaY;
        });
        
        document.addEventListener('mouseup', function() {
            if (isPanning) {
                isPanning = false;
                transformWrapper.style.cursor = 'grab';
            }
        });
        
        // 3. События для сенсорных устройств
        let touchStartX, touchStartY;
        let touchScrollStartX, touchScrollStartY;
        
        transformWrapper.addEventListener('touchstart', function(e) {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchScrollStartX = scrollWrapper.scrollLeft;
                touchScrollStartY = scrollWrapper.scrollTop;
                e.preventDefault();
            }
        }, { passive: false });
        
        transformWrapper.addEventListener('touchmove', function(e) {
            if (e.touches.length === 1) {
                const deltaX = e.touches[0].clientX - touchStartX;
                const deltaY = e.touches[0].clientY - touchStartY;
                
                scrollWrapper.scrollLeft = touchScrollStartX - deltaX;
                scrollWrapper.scrollTop = touchScrollStartY - deltaY;
                e.preventDefault();
            }
        }, { passive: false });
        
        // 4. Кнопки управления
        document.getElementById('nav-fit-tree').addEventListener('click', function() {
            fitTreeToView(scrollWrapper, transformWrapper, contentContainer);
        });
        
        document.getElementById('nav-reset-view').addEventListener('click', function() {
            resetTreeView(transformWrapper, contentContainer, scrollWrapper);
        });
        
        // Устанавливаем начальный курсор
        transformWrapper.style.cursor = 'grab';
        
        // 5. Обновление позиции при скролле
        scrollWrapper.addEventListener('scroll', function() {
            updateNavigationInfo();
        });
    }
    
    function updateTreeTransform(wrapper) {
        wrapper.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
    
    function updateContentSize(contentContainer, newScale) {
        const tree = document.querySelector('#tree svg');
        if (!tree) return;
        
        const rect = tree.getBoundingClientRect();
        contentContainer.style.minWidth = `${rect.width * newScale + 200}px`;
        contentContainer.style.minHeight = `${rect.height * newScale + 200}px`;
    }
    
    function centerTree() {
        const scrollWrapper = document.getElementById('tree-scroll-wrapper');
        const contentContainer = document.getElementById('tree-content-container');
        const transformWrapper = document.getElementById('tree-transform-wrapper');
        
        if (!scrollWrapper || !contentContainer || !transformWrapper) return;
        
        const tree = document.querySelector('#tree svg');
        if (!tree) return;
        
        const treeRect = tree.getBoundingClientRect();
        const wrapperRect = scrollWrapper.getBoundingClientRect();
        
        // Устанавливаем начальный масштаб для вписывания
        const scaleX = wrapperRect.width / treeRect.width;
        const scaleY = wrapperRect.height / treeRect.height;
        scale = Math.min(scaleX, scaleY, 1) * 0.8;
        
        // Центрируем
        translateX = 0;
        translateY = 0;
        
        updateTreeTransform(transformWrapper);
        updateContentSize(contentContainer, scale);
        updateNavigationInfo();
        
        // Прокручиваем к центру
        scrollWrapper.scrollLeft = (contentContainer.scrollWidth - wrapperRect.width) / 2;
        scrollWrapper.scrollTop = (contentContainer.scrollHeight - wrapperRect.height) / 2;
    }
    
    function fitTreeToView(scrollWrapper, transformWrapper, contentContainer) {
        const tree = document.querySelector('#tree svg');
        if (!tree) return;
        
        const treeRect = tree.getBoundingClientRect();
        const wrapperRect = scrollWrapper.getBoundingClientRect();
        
        // Вычисляем оптимальный масштаб
        const scaleX = wrapperRect.width / treeRect.width;
        const scaleY = wrapperRect.height / treeRect.height;
        scale = Math.min(scaleX, scaleY, 1) * 0.9;
        
        // Центрируем
        translateX = 0;
        translateY = 0;
        
        updateTreeTransform(transformWrapper);
        updateContentSize(contentContainer, scale);
        updateNavigationInfo();
        
        // Центрируем скролл
        scrollWrapper.scrollLeft = (contentContainer.scrollWidth - wrapperRect.width) / 2;
        scrollWrapper.scrollTop = (contentContainer.scrollHeight - wrapperRect.height) / 2;
        
        showMessage('Дерево вписано в окно', 'success');
    }
    
    function resetTreeView(transformWrapper, contentContainer, scrollWrapper) {
        scale = 1;
        translateX = 0;
        translateY = 0;
        
        updateTreeTransform(transformWrapper);
        updateContentSize(contentContainer, scale);
        updateNavigationInfo();
        
        // Центрируем скролл
        if (scrollWrapper) {
            scrollWrapper.scrollLeft = (contentContainer.scrollWidth - scrollWrapper.clientWidth) / 2;
            scrollWrapper.scrollTop = (contentContainer.scrollHeight - scrollWrapper.clientHeight) / 2;
        }
        
        showMessage('Вид сброшен', 'info');
    }
    
    function updateNavigationInfo() {
        const scrollWrapper = document.getElementById('tree-scroll-wrapper');
        const scaleInfo = document.getElementById('nav-scale-info');
        const positionInfo = document.getElementById('nav-position-info');
        
        if (scaleInfo) {
            scaleInfo.textContent = `Масштаб: ${Math.round(scale * 100)}%`;
        }
        
        if (positionInfo && scrollWrapper) {
            positionInfo.textContent = `Прокрутка: ${scrollWrapper.scrollLeft}, ${scrollWrapper.scrollTop}`;
        }
    }
    
    // ==================== ОСТАЛЬНЫЕ ФУНКЦИИ ====================
    
    function createNavigationControls() {
        // Упрощенная панель управления
        const controlsPanel = document.createElement('div');
        controlsPanel.id = 'nav-controls';
        controlsPanel.innerHTML = `
            <div style="text-align: center; margin-bottom: 10px; color: #333; font-weight: bold; font-size: 12px;">
                Управление деревом
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;">
                <button class="nav-btn" data-action="zoom-in" title="Увеличить">+</button>
                <button class="nav-btn" data-action="reset-view" title="Сбросить">⟳</button>
                <button class="nav-btn" data-action="zoom-out" title="Уменьшить">-</button>
                <button class="nav-btn" data-action="pan-up" title="Вверх">↑</button>
                <button class="nav-btn" data-action="fit-tree" title="Вписать">⎙</button>
                <button class="nav-btn" data-action="pan-down" title="Вниз">↓</button>
                <button class="nav-btn" data-action="pan-left" title="Влево">←</button>
                <button class="nav-btn" data-action="center" title="Центрировать">◎</button>
                <button class="nav-btn" data-action="pan-right" title="Вправо">→</button>
            </div>
        `;
        
        controlsPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 20px;
            transform: translateY(-50%);
            width: 150px;
            background: rgba(255, 255, 255, 0.95);
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 9997;
            border: 1px solid #ddd;
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(controlsPanel);
        
        // Обработчики кнопок
        controlsPanel.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.dataset.action;
                handleNavigationAction(action);
            });
        });
    }
    
    function handleNavigationAction(action) {
        const scrollWrapper = document.getElementById('tree-scroll-wrapper');
        const transformWrapper = document.getElementById('tree-transform-wrapper');
        const contentContainer = document.getElementById('tree-content-container');
        
        if (!scrollWrapper || !transformWrapper || !contentContainer) return;
        
        const step = 100;
        const zoomStep = 0.2;
        
        switch(action) {
            case 'zoom-in':
                scale = Math.min(maxScale, scale + zoomStep);
                break;
            case 'zoom-out':
                scale = Math.max(minScale, scale - zoomStep);
                break;
            case 'pan-up':
                scrollWrapper.scrollTop -= step;
                break;
            case 'pan-down':
                scrollWrapper.scrollTop += step;
                break;
            case 'pan-left':
                scrollWrapper.scrollLeft -= step;
                break;
            case 'pan-right':
                scrollWrapper.scrollLeft += step;
                break;
            case 'center':
                scrollWrapper.scrollLeft = (contentContainer.scrollWidth - scrollWrapper.clientWidth) / 2;
                scrollWrapper.scrollTop = (contentContainer.scrollHeight - scrollWrapper.clientHeight) / 2;
                break;
            case 'reset-view':
                resetTreeView(transformWrapper, contentContainer, scrollWrapper);
                return;
            case 'fit-tree':
                fitTreeToView(scrollWrapper, transformWrapper, contentContainer);
                return;
        }
        
        updateTreeTransform(transformWrapper);
        updateContentSize(contentContainer, scale);
        updateNavigationInfo();
    }
    
    // Панели интерфейса (упрощенные версии)
    function createPanels() {
        createPersonSelector();
        createCurrentRootPanel();
        createStatisticsPanel();
    }
    
    function createPersonSelector() {
        const panel = document.createElement('div');
        panel.id = 'nav-selector';
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #2196F3; color: white; border-radius: 4px; cursor: pointer;">
                <h4 style="margin: 0; font-size: 14px;">🔍 Поиск человека</h4>
                <button id="nav-toggle-btn" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">−</button>
            </div>
            <div id="nav-content" style="padding: 15px; background: white; display: block;">
                <input type="text" id="nav-search" placeholder="Введите имя..." 
                       style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px;">
                <div id="nav-list" style="max-height: 250px; overflow-y: auto; border: 1px solid #eee; padding: 5px;"></div>
            </div>
        `;
        
        panel.style.cssText = `
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
        
        document.body.appendChild(panel);
    }
    
    function createCurrentRootPanel() {
        const panel = document.createElement('div');
        panel.id = 'nav-current';
        panel.innerHTML = `
            <div style="background: #4CAF50; color: white; padding: 10px; border-radius: 4px 4px 0 0;">
                <h4 style="margin: 0; font-size: 14px;">🌳 Текущий корень</h4>
            </div>
            <div style="padding: 15px; background: white;">
                <div id="nav-root-info" style="padding: 10px; background: #f9f9f9; border-radius: 4px; margin-bottom: 10px;">
                    Полное дерево
                </div>
                <button id="nav-reset-btn" style="width: 100%; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Показать всё дерево
                </button>
            </div>
        `;
        
        panel.style.cssText = `
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
        
        document.body.appendChild(panel);
    }
    
    function createStatisticsPanel() {
        const panel = document.createElement('div');
        panel.id = 'nav-stats';
        panel.innerHTML = `
            <div style="background: #9C27B0; color: white; padding: 10px; border-radius: 4px 4px 0 0;">
                <h4 style="margin: 0; font-size: 14px;">📊 Статистика</h4>
            </div>
            <div style="padding: 15px; background: white;">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
                    <div>
                        <div style="font-size: 11px; color: #666;">Всего</div>
                        <div id="nav-total" style="font-size: 24px; font-weight: bold;">0</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #666;">Мужчин</div>
                        <div id="nav-males" style="font-size: 24px; font-weight: bold; color: #2196F3;">0</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #666;">Женщин</div>
                        <div id="nav-females" style="font-size: 24px; font-weight: bold; color: #E91E63;">0</div>
                    </div>
                </div>
            </div>
        `;
        
        panel.style.cssText = `
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
        
        list.innerHTML = filtered.map(person => `
            <div class="person-item" data-id="${person.id}" 
                 style="padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;
                        background: ${person.gender === 'M' ? '#e3f2fd' : '#fce4ec'};">
                <strong>${person.name} ${person.surname}</strong><br>
                <small>ID: ${person.id}</small>
            </div>
        `).join('');
        
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
        
        document.getElementById('nav-total').textContent = total;
        document.getElementById('nav-males').textContent = males;
        document.getElementById('nav-females').textContent = females;
    }
    
    function selectPerson(personId) {
        if (!window.familyTree || !window.familyTree.data) return;
        
        const person = window.familyTree.data.people.find(p => p.id === personId);
        if (!person) return;
        
        if (typeof window.familyTree.selectPerson === 'function') {
            window.familyTree.selectPerson(personId);
        }
        
        if (typeof window.familyTree.buildTree === 'function') {
            window.familyTree.buildTree(personId);
        }
        
        updateCurrentRoot(person);
        centerOnPerson(personId);
        showMessage(`Дерево перестроено от ${person.name} ${person.surname}`, 'success');
    }
    
    function centerOnPerson(personId) {
        setTimeout(() => {
            const scrollWrapper = document.getElementById('tree-scroll-wrapper');
            const contentContainer = document.getElementById('tree-content-container');
            
            if (scrollWrapper && contentContainer) {
                // Прокручиваем к центру после перестроения дерева
                scrollWrapper.scrollLeft = (contentContainer.scrollWidth - scrollWrapper.clientWidth) / 2;
                scrollWrapper.scrollTop = (contentContainer.scrollHeight - scrollWrapper.clientHeight) / 2;
            }
        }, 300);
    }
    
    function updateCurrentRoot(person) {
        const rootInfo = document.getElementById('nav-root-info');
        if (!rootInfo) return;
        
        if (person) {
            rootInfo.innerHTML = `
                <strong>${person.name} ${person.surname}</strong><br>
                <small>${person.gender === 'M' ? '♂ Мужской' : '♀ Женский'}</small>
            `;
        } else {
            rootInfo.innerHTML = 'Полное дерево';
        }
    }
    
    function resetToFullTree() {
        if (typeof window.familyTree.buildTree === 'function') {
            window.familyTree.buildTree();
        }
        
        updateCurrentRoot(null);
        centerTree();
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
        
        // Сворачивание панели
        const toggleBtn = document.getElementById('nav-toggle-btn');
        const panelContent = document.getElementById('nav-content');
        
        if (toggleBtn && panelContent) {
            toggleBtn.addEventListener('click', function() {
                if (panelContent.style.display === 'none') {
                    panelContent.style.display = 'block';
                    this.textContent = '−';
                } else {
                    panelContent.style.display = 'none';
                    this.textContent = '+';
                }
            });
        }
        
        // Сброс дерева
        document.getElementById('nav-reset-btn').addEventListener('click', resetToFullTree);
        
        // Горячие клавиши
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                const search = document.getElementById('nav-search');
                if (search) {
                    search.focus();
                    search.select();
                }
            }
            
            if (e.key === 'Escape') {
                resetToFullTree();
            }
            
            if (e.key === 'F2') {
                const panel = document.getElementById('nav-selector');
                const content = document.getElementById('nav-content');
                const btn = document.getElementById('nav-toggle-btn');
                if (panel && content && btn) {
                    if (content.style.display === 'none') {
                        content.style.display = 'block';
                        btn.textContent = '−';
                    } else {
                        content.style.display = 'none';
                        btn.textContent = '+';
                    }
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
            padding: 12px 24px;
            border-radius: 6px;
            z-index: 100000;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            animation: fadeInOut 2s;
        `;
        
        document.body.appendChild(msg);
        
        setTimeout(() => {
            msg.style.opacity = '0';
            msg.style.transition = 'opacity 0.5s';
            setTimeout(() => msg.remove(), 500);
        }, 2000);
    }
    
    function addFixedStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
            
            #tree-scroll-wrapper {
                scrollbar-width: thin;
                scrollbar-color: #888 #f1f1f1;
            }
            
            #tree-scroll-wrapper::-webkit-scrollbar {
                width: 12px;
                height: 12px;
            }
            
            #tree-scroll-wrapper::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 6px;
            }
            
            #tree-scroll-wrapper::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 6px;
            }
            
            #tree-scroll-wrapper::-webkit-scrollbar-thumb:hover {
                background: #555;
            }
            
            .nav-btn {
                width: 40px;
                height: 40px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 6px;
                cursor: pointer;
                font-size: 18px;
                transition: all 0.2s;
            }
            
            .nav-btn:hover {
                background: #f0f0f0;
                transform: translateY(-2px);
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            
            .person-item:hover {
                background-color: #e0e0e0 !important;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Запускаем ожидание FamilyTree
    console.log('Ожидание FamilyTree...');
    waitForFamilyTree();
    
})();
