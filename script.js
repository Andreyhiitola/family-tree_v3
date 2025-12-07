class FamilyTree {
    constructor() {
        this.data = { people: [] };
        this.selectedPerson = null;
        this.treeData = null;
        this.svg = null;
        this.treeNodes = null;
        this.init();
    }

    async init() {
        console.log('Инициализация семейного дерева');
        await this.loadData();
        this.initUI();
        this.buildTree();
        this.updateStats();
    }

    async loadData() {
        try {
            const savedData = localStorage.getItem('familyTreeData');
            if (savedData) {
                this.data = JSON.parse(savedData);
                console.log('Данные загружены из LocalStorage');
            } else {
                // Создаем демо данные
                this.createDemoData();
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.createDemoData();
        }
    }

    createDemoData() {
        this.data = {
            people: [
                { 
                    id: '1', 
                    name: 'Иван', 
                    surname: 'Иванов', 
                    gender: 'M', 
                    birthDate: '1950-01-01', 
                    deathDate: '', 
                    fatherId: null, 
                    motherId: null 
                },
                { 
                    id: '2', 
                    name: 'Мария', 
                    surname: 'Иванова', 
                    gender: 'F', 
                    birthDate: '1955-02-02', 
                    deathDate: '', 
                    fatherId: null, 
                    motherId: null 
                },
                { 
                    id: '3', 
                    name: 'Алексей', 
                    surname: 'Иванов', 
                    gender: 'M', 
                    birthDate: '1980-03-03', 
                    deathDate: '', 
                    fatherId: '1', 
                    motherId: '2' 
                }
            ]
        };
        this.saveToLocalStorage();
        this.showNotification('Созданы демо данные', 'info');
    }

    saveToLocalStorage() {
        localStorage.setItem('familyTreeData', JSON.stringify(this.data));
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.className = `notification ${type}`;
            notification.style.display = 'block';
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
    }

    initUI() {
        this.setupSearch();
        this.setupButtons();
        this.initModals();
    }

    setupSearch() {
        const searchInput = document.getElementById('search');
        const searchResults = document.getElementById('search-results');
        
        if (!searchInput || !searchResults) return;
        
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Очищаем предыдущий таймаут
            clearTimeout(searchTimeout);
            
            if (query.length < 2) {
                searchResults.innerHTML = '';
                searchResults.style.display = 'none';
                return;
            }
            
            // Задержка перед поиском (дебаунс)
            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });
        
        // Поиск при нажатии Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query.length >= 2) {
                    this.performSearch(query);
                }
            }
        });
        
        // Закрытие результатов при клике вне
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }
    
    performSearch(query) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;
        
        const lowercaseQuery = query.toLowerCase().trim();
        
        // Поиск по имени, фамилии или ID
        const results = this.data.people.filter(person => {
            const fullName = `${person.name || ''} ${person.surname || ''}`.toLowerCase();
            const fullNameReversed = `${person.surname || ''} ${person.name || ''}`.toLowerCase();
            const personId = String(person.id || '').toLowerCase();
            
            return fullName.includes(lowercaseQuery) ||
                   fullNameReversed.includes(lowercaseQuery) ||
                   personId.includes(lowercaseQuery);
        });
        
        this.showSearchResults(results);
    }
    
    showSearchResults(results) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;
        
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-result-item no-results">
                    <i class="fas fa-search"></i>
                    <span>Ничего не найдено</span>
                </div>`;
            searchResults.style.display = 'block';
            return;
        }
        
        searchResults.innerHTML = results.map(person => `
            <div class="search-result-item" data-id="${String(person.id)}">
                <i class="fas fa-${person.gender === 'M' ? 'male' : 'female'} ${person.gender === 'M' ? 'male-icon' : 'female-icon'}"></i>
                <div class="search-result-info">
                    <div class="search-result-name">${person.name || ''} ${person.surname || ''}</div>
                    <div class="search-result-details">
                        <small>ID: ${String(person.id)}</small>
                        ${person.birthDate ? `<small>• Род. ${person.birthDate}</small>` : ''}
                    </div>
                </div>
                <i class="fas fa-chevron-right"></i>
            </div>
        `).join('');
        
        searchResults.style.display = 'block';
        
        // Обработчики кликов
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const personId = item.dataset.id;
                this.selectPerson(personId);
                this.buildTree(personId);
                
                // Очищаем поиск
                document.getElementById('search').value = '';
                searchResults.style.display = 'none';
            });
        });
    }

    setupButtons() {
        const buttons = [
            { id: 'add-person', handler: () => this.openAddPersonModal() },
            { id: 'edit-person', handler: () => this.openEditPersonModal() },
            { id: 'delete-person', handler: () => this.openDeleteModal() },
            { id: 'import-data', handler: () => this.importData() },
            { id: 'export-data', handler: () => this.exportData() },
            { id: 'reset-data', handler: () => this.resetData() }
        ];
        
        buttons.forEach(btn => {
            const button = document.getElementById(btn.id);
            if (button) {
                button.addEventListener('click', btn.handler);
            }
        });
    }

    initModals() {
        // Инициализация модального окна добавления/редактирования
        const personModal = document.getElementById('person-modal');
        if (personModal) {
            const closeBtn = personModal.querySelector('.close');
            const cancelBtn = document.getElementById('cancel-form');
            
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal('person-modal'));
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal('person-modal'));
            
            // Обработчик формы
            const personForm = document.getElementById('person-form');
            if (personForm) {
                personForm.addEventListener('submit', (e) => this.handlePersonFormSubmit(e));
            }
        }
        
        // Инициализация модального окна удаления
        const deleteModal = document.getElementById('delete-modal');
        if (deleteModal) {
            const closeBtn = deleteModal.querySelector('.close');
            const cancelBtn = document.getElementById('cancel-delete');
            const confirmBtn = document.getElementById('confirm-delete');
            
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal('delete-modal'));
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal('delete-modal'));
            if (confirmBtn) confirmBtn.addEventListener('click', () => this.deletePerson());
        }
        
        // Закрытие модальных окон при клике вне их
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    // Метод для импорта данных
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const newData = JSON.parse(event.target.result);
                    this.data = newData;
                    this.saveToLocalStorage();
                    this.buildTree();
                    this.updateStats();
                    this.showNotification('Данные успешно импортированы', 'success');
                } catch (error) {
                    console.error('Ошибка импорта:', error);
                    this.showNotification('Ошибка импорта данных. Проверьте формат файла.', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // Метод для экспорта данных
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'family-tree-data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        this.showNotification('Данные успешно экспортированы', 'success');
    }

    // Метод для сброса данных
    resetData() {
        if (confirm('Вы уверены, что хотите сбросить все данные? Это действие нельзя отменить.')) {
            localStorage.removeItem('familyTreeData');
            this.data = { people: [] };
            this.selectedPerson = null;
            this.treeData = null;
            this.createDemoData();
            this.showNotification('Данные сброшены, созданы демо данные', 'info');
        }
    }

    // Метод для открытия модального окна добавления человека
    openAddPersonModal() {
        const modal = document.getElementById('person-modal');
        if (!modal) return;
        
        document.getElementById('form-title').textContent = 'Добавить человека';
        document.getElementById('person-id').value = '';
        document.getElementById('person-form').reset();
        modal.style.display = 'block';
    }

    // Метод для открытия модального окна редактирования человека
    openEditPersonModal() {
        if (!this.selectedPerson) {
            this.showNotification('Сначала выберите человека на дереве', 'warning');
            return;
        }
        
        const person = this.data.people.find(p => p.id === this.selectedPerson);
        if (!person) return;
        
        const modal = document.getElementById('person-modal');
        if (!modal) return;
        
        document.getElementById('form-title').textContent = 'Редактировать человека';
        document.getElementById('person-id').value = person.id;
        document.getElementById('name').value = person.name || '';
        document.getElementById('surname').value = person.surname || '';
        document.getElementById('gender').value = person.gender || 'M';
        document.getElementById('birth-date').value = person.birthDate || '';
        document.getElementById('death-date').value = person.deathDate || '';
        document.getElementById('father-id').value = person.fatherId || '';
        document.getElementById('mother-id').value = person.motherId || '';
        
        modal.style.display = 'block';
    }

    // Метод для открытия модального окна удаления
    openDeleteModal() {
        if (!this.selectedPerson) {
            this.showNotification('Сначала выберите человека на дереве', 'warning');
            return;
        }
        
        const person = this.data.people.find(p => p.id === this.selectedPerson);
        if (!person) return;
        
        const modal = document.getElementById('delete-modal');
        if (!modal) return;
        
        document.getElementById('delete-person-name').textContent = `${person.name} ${person.surname}`;
        modal.style.display = 'block';
    }

    // Метод для закрытия модального окна
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Обработчик формы
    handlePersonFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const id = document.getElementById('person-id').value || Date.now().toString();
        const personData = {
            id: id,
            name: form.name.value.trim(),
            surname: form.surname.value.trim(),
            gender: form.gender.value,
            birthDate: form['birth-date'].value,
            deathDate: form['death-date'].value,
            fatherId: form['father-id'].value || null,
            motherId: form['mother-id'].value || null
        };
        
        // Проверка обязательных полей
        if (!personData.name || !personData.surname) {
            alert('Пожалуйста, заполните имя и фамилию');
            return;
        }
        
        // Ищем существующего человека или добавляем нового
        const existingIndex = this.data.people.findIndex(p => p.id === personData.id);
        if (existingIndex >= 0) {
            this.data.people[existingIndex] = personData;
            this.showNotification('Данные обновлены', 'success');
        } else {
            this.data.people.push(personData);
            this.showNotification('Человек добавлен', 'success');
        }
        
        this.saveToLocalStorage();
        this.buildTree();
        this.updateStats();
        this.closeModal('person-modal');
    }

    // Метод для удаления человека
    deletePerson() {
        if (!this.selectedPerson) return;
        
        this.data.people = this.data.people.filter(p => p.id !== this.selectedPerson);
        this.saveToLocalStorage();
        this.buildTree();
        this.updateStats();
        this.selectedPerson = null;
        this.showNotification('Человек удален', 'success');
        this.closeModal('delete-modal');
    }

    // Метод для выбора человека
    selectPerson(personId) {
        this.selectedPerson = personId;
        this.highlightSelectedNode();
    }

    buildTree(personId = null) {
        console.log('Построение дерева с D3.js');
        const treeContainer = document.getElementById('tree');
        if (!treeContainer) return;
        
        // Очищаем контейнер
        treeContainer.innerHTML = '';
        
        if (!window.d3) {
            treeContainer.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <h3><i class="fas fa-exclamation-triangle"></i> D3.js не загружена</h3>
                    <p>Проверьте подключение к интернету</p>
                    <button onclick="window.location.reload()" class="btn btn-primary">
                        <i class="fas fa-redo"></i> Обновить страницу
                    </button>
                </div>`;
            return;
        }
        
        if (this.data.people.length === 0) {
            treeContainer.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #666;">
                    <h3><i class="fas fa-tree"></i> Нет данных</h3>
                    <p>Добавьте людей в дерево</p>
                    <button onclick="window.familyTree.openAddPersonModal()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Добавить первого человека
                    </button>
                </div>`;
            return;
        }
        
        // Определяем корневого человека
        let rootPersonId = personId;
        if (!rootPersonId) {
            const rootPeople = this.data.people.filter(p => !p.fatherId && !p.motherId);
            if (rootPeople.length > 0) {
                rootPersonId = rootPeople[0].id;
            } else {
                rootPersonId = this.data.people[0].id;
            }
        }
        
        // Строим иерархию данных
        const treeData = this.buildHierarchy(rootPersonId);
        if (!treeData) {
            treeContainer.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <h3>Ошибка построения дерева</h3>
                </div>`;
            return;
        }
        
        // Размеры контейнера
        const width = treeContainer.clientWidth || 800;
        const height = treeContainer.clientHeight || 600;
        
        // Создаем SVG
        const svg = d3.select('#tree')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width/2}, 50)`);
        
        // Создаем макет дерева
        const treeLayout = d3.tree()
            .size([height - 100, width - 200]);
        
        // Создаем иерархию для D3
        const root = d3.hierarchy(treeData);
        const treeNodes = treeLayout(root);
        
        // Рисуем связи
        svg.selectAll('.link')
            .data(treeNodes.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x))
            .attr('fill', 'none')
            .attr('stroke', '#ccc')
            .attr('stroke-width', 2);
        
        // Рисуем узлы
        const node = svg.selectAll('.node')
            .data(treeNodes.descendants())
            .enter()
            .append('g')
            .attr('class', d => `node ${d.data.gender} ${d.data.id === this.selectedPerson ? 'selected' : ''}`)
            .attr('transform', d => `translate(${d.y},${d.x})`)
            .on('click', (event, d) => {
                this.selectPerson(d.data.id);
                this.highlightSelectedNode();
            });
        
        // Круги узлов
        node.append('circle')
            .attr('r', 25)
            .attr('fill', d => d.data.gender === 'M' ? '#4A90E2' : '#E24A8E')
            .attr('stroke', d => d.data.id === this.selectedPerson ? '#FFD700' : '#fff')
            .attr('stroke-width', d => d.data.id === this.selectedPerson ? 4 : 3);
        
        // Имена в узлах
        node.append('text')
            .attr('dy', '.31em')
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text(d => d.data.name.split(' ')[0]);
        
        // Полная информация при наведении
        node.append('title')
            .text(d => `${d.data.name}\n${d.data.gender === 'M' ? '♂ Мужской' : '♀ Женский'}`);
        
        // Сохраняем ссылки для обновления
        this.svg = svg;
        this.treeNodes = treeNodes;
        
        console.log('Дерево построено:', treeData);
    }
    
    buildHierarchy(personId, visited = new Set()) {
        if (visited.has(personId)) return null;
        visited.add(personId);
        
        const person = this.data.people.find(p => p.id === personId);
        if (!person) return null;
        
        const node = {
            id: person.id,
            name: `${person.name} ${person.surname}`,
            gender: person.gender,
            children: []
        };
        
        // Находим детей (у которых этот человек является отцом или матерью)
        const children = this.data.people.filter(p => 
            p.fatherId === personId || p.motherId === personId
        );
        
        for (const child of children) {
            const childNode = this.buildHierarchy(child.id, visited);
            if (childNode) {
                node.children.push(childNode);
            }
        }
        
        return node;
    }
    
    highlightSelectedNode() {
        if (!this.svg) return;
        
        // Обновляем выделение
        this.svg.selectAll('.node')
            .attr('class', d => `node ${d.data.gender} ${d.data.id === this.selectedPerson ? 'selected' : ''}`)
            .select('circle')
            .attr('stroke', d => d.data.id === this.selectedPerson ? '#FFD700' : '#fff')
            .attr('stroke-width', d => d.data.id === this.selectedPerson ? 4 : 3);
        
        // Показываем информацию о выбранном человеке
        if (this.selectedPerson) {
            const person = this.data.people.find(p => p.id === this.selectedPerson);
            if (person) {
                this.showNotification(`Выбран: ${person.name} ${person.surname}`, 'info');
            }
        }
    }

    updateStats() {
        const elements = {
            'person-count': this.data.people.length,
            'male-count': this.data.people.filter(p => p.gender === 'M').length,
            'female-count': this.data.people.filter(p => p.gender === 'F').length,
            'generation-count': this.calculateGenerations()
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    calculateGenerations() {
        if (this.data.people.length === 0) return 0;
        
        let maxDepth = 0;
        const visited = new Set();
        
        const calculateDepth = (personId, currentDepth) => {
            if (visited.has(personId)) return;
            visited.add(personId);
            
            maxDepth = Math.max(maxDepth, currentDepth);
            
            const person = this.data.people.find(p => p.id === personId);
            if (!person) return;
            
            // Находим детей
            const children = this.data.people.filter(p => 
                p.fatherId === personId || p.motherId === personId
            );
            
            for (const child of children) {
                calculateDepth(child.id, currentDepth + 1);
            }
        };
        
        // Начинаем с людей без родителей
        const rootPeople = this.data.people.filter(p => !p.fatherId && !p.motherId);
        if (rootPeople.length === 0) {
            // Если все имеют родителей, берем первого
            calculateDepth(this.data.people[0].id, 1);
        } else {
            for (const root of rootPeople) {
                calculateDepth(root.id, 1);
            }
        }
        
        return maxDepth;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.familyTree = new FamilyTree();
});
// ============================================
// ФУНКЦИИ ДЛЯ ПЕРЕСТРОЙКИ ГРАФИКА ПРИ ВЫБОРЕ ЧЕЛОВЕКА
// ============================================

// Глобальные переменные
let currentRootId = null;
let treeCache = new Map();

/**
 * Перестраивает дерево от выбранного человека
 * @param {string} personId - ID выбранного человека
 */
function rebuildTreeFromPerson(personId) {
  console.log('Перестраиваю дерево от человека:', personId);
  
  if (!window.peopleData || !window.peopleData.people) {
    console.error('Нет данных о людях');
    return;
  }
  
  // Находим выбранного человека
  const selectedPerson = window.peopleData.people.find(p => p.id === personId);
  if (!selectedPerson) {
    console.error('Человек не найден:', personId);
    return;
  }
  
  // Сохраняем текущий корень
  currentRootId = personId;
  
  // Строим новое дерево
  const newTreeData = buildTreeFromPerson(selectedPerson);
  
  // Очищаем текущий график
  clearTree();
  
  // Перестраиваем график
  if (typeof drawTree === 'function') {
    drawTree(newTreeData);
  } else {
    console.warn('Функция drawTree не найдена, вызываю buildTree');
    if (typeof buildTree === 'function') {
      buildTree([newTreeData]);
    }
  }
  
  // Обновляем информацию о текущем корне
  updateCurrentRootInfo(selectedPerson);
  
  // Добавляем обработчики на новые узлы
  setTimeout(addNodeClickHandlers, 100);
}

/**
 * Строит дерево от конкретного человека
 * @param {Object} person - Объект человека
 * @param {number} maxDepth - Максимальная глубина
 * @param {Set} visited - Посещенные узлы
 * @returns {Object} Структура дерева
 */
function buildTreeFromPerson(person, maxDepth = 3, visited = new Set()) {
  if (visited.has(person.id) || maxDepth <= 0) {
    return null;
  }
  visited.add(person.id);
  
  const treeNode = {
    id: person.id,
    name: `${person.name} ${person.surname}`,
    data: person,
    children: []
  };
  
  // Находим детей
  const children = window.peopleData.people.filter(p => 
    p.fatherId === person.id || p.motherId === person.id
  );
  
  treeNode.children = children
    .map(child => buildTreeFromPerson(child, maxDepth - 1, new Set(visited)))
    .filter(Boolean);
  
  return treeNode;
}

/**
 * Очищает текущее дерево
 */
function clearTree() {
  const container = document.getElementById('tree-container');
  if (container) {
    container.innerHTML = '';
  }
}

/**
 * Обновляет информацию о текущем корне
 * @param {Object} person - Объект человека
 */
function updateCurrentRootInfo(person) {
  let infoDiv = document.getElementById('current-root-info');
  
  if (!infoDiv) {
    infoDiv = document.createElement('div');
    infoDiv.id = 'current-root-info';
    infoDiv.className = 'current-root-info';
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
    `;
    document.body.appendChild(infoDiv);
  }
  
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
  
  // Добавляем обработчик для кнопки сброса
  document.getElementById('reset-tree-view').addEventListener('click', () => {
    resetToFullTree();
  });
}

/**
 * Возвращает к полному дереву
 */
function resetToFullTree() {
  currentRootId = null;
  
  // Очищаем информацию о текущем корне
  const infoDiv = document.getElementById('current-root-info');
  if (infoDiv) {
    infoDiv.remove();
  }
  
  // Очищаем контейнер
  clearTree();
  
  // Перестраиваем полное дерево
  if (typeof buildFullTree === 'function') {
    buildFullTree();
  } else if (typeof buildTree === 'function') {
    buildTree(window.peopleData.people);
  }
  
  // Удаляем селектор, если есть
  const selector = document.getElementById('person-selector');
  if (selector) {
    selector.remove();
  }
  
  // Заново создаем селектор
  createPersonSelector();
}

// ============================================
// ПАНЕЛЬ ВЫБОРА ЧЕЛОВЕКА
// ============================================

/**
 * Создает панель для выбора человека
 */
function createPersonSelector() {
  // Удаляем старый селектор, если есть
  const oldSelector = document.getElementById('person-selector');
  if (oldSelector) {
    oldSelector.remove();
  }
  
  const selectorDiv = document.createElement('div');
  selectorDiv.id = 'person-selector';
  selectorDiv.className = 'person-selector';
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
  
  // Добавляем поиск
  document.getElementById('person-search').addEventListener('input', function(e) {
    updatePersonList(e.target.value);
  });
}

/**
 * Обновляет список людей
 * @param {string} searchTerm - Поисковый запрос
 */
function updatePersonList(searchTerm = '') {
  if (!window.peopleData || !window.peopleData.people) {
    console.error('Нет данных для отображения списка');
    return;
  }
  
  const personList = document.getElementById('person-list');
  if (!personList) return;
  
  const filteredPeople = window.peopleData.people.filter(person => {
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
  
  // Добавляем обработчики кликов
  document.querySelectorAll('.person-item').forEach(item => {
    item.addEventListener('click', function() {
      const personId = this.dataset.personId;
      
      // Визуальная обратная связь
      this.style.background = '#e0e0e0';
      this.style.transform = 'scale(0.98)';
      setTimeout(() => {
        this.style.background = this.dataset.personId === currentRootId ? '#4CAF50' : 
                               window.peopleData.people.find(p => p.id === personId).gender === 'M' ? '#e6f3ff' : '#ffe6f2';
        this.style.transform = 'scale(1)';
      }, 200);
      
      rebuildTreeFromPerson(personId);
    });
  });
}

// ============================================
// ОБРАБОТЧИКИ СОБЫТИЙ ДЛЯ УЗЛОВ
// ============================================

/**
 * Добавляет обработчики кликов на узлы дерева
 */
function addNodeClickHandlers() {
  // Используем делегирование событий для динамических элементов
  document.addEventListener('click', function(event) {
    // Проверяем разные возможные селекторы для узлов
    const selectors = ['.node', '[data-person-id]', 'circle', 'g[transform]'];
    let nodeElement = null;
    
    for (const selector of selectors) {
      nodeElement = event.target.closest(selector);
      if (nodeElement) break;
    }
    
    if (nodeElement) {
      // Получаем ID человека
      const personId = nodeElement.dataset.personId || 
                      nodeElement.closest('[data-person-id]')?.dataset.personId ||
                      getPersonIdFromElement(nodeElement);
      
      if (personId) {
        event.preventDefault();
        event.stopPropagation();
        rebuildTreeFromPerson(personId);
      }
    }
  }, true); // Используем capture phase для перехвата всех кликов
  
  // Также добавляем обработчики напрямую к узлам D3, если они есть
  setTimeout(() => {
    d3.selectAll('.node')
      .on('click', function(event, d) {
        event.preventDefault();
        event.stopPropagation();
        
        if (d.data && d.data.id) {
          rebuildTreeFromPerson(d.data.id);
        }
      })
      .style('cursor', 'pointer');
  }, 500);
}

/**
 * Извлекает ID человека из элемента
 * @param {Element} element - DOM элемент
 * @returns {string|null} ID человека
 */
function getPersonIdFromElement(element) {
  // Пытаемся найти ID разными способами
  if (element.__data__ && element.__data__.data && element.__data__.data.id) {
    return element.__data__.data.id;
  }
  
  // Проверяем текст элемента
  const text = element.textContent || element.innerText;
  if (text && window.peopleData) {
    const person = window.peopleData.people.find(p => 
      text.includes(p.name) || text.includes(p.surname)
    );
    return person ? person.id : null;
  }
  
  return null;
}

// ============================================
// УЛУЧШЕННАЯ ВЕРСИЯ С НАСТРОЙКАМИ
// ============================================

/**
 * Перестраивает дерево с настройками
 * @param {string} personId - ID человека
 * @param {Object} options - Настройки отображения
 */
function rebuildTreeWithOptions(personId, options = {}) {
  const defaultOptions = {
    maxDepth: 3,
    showParents: true,
    showChildren: true,
    showSpouses: false,
    compactView: false
  };
  
  const settings = { ...defaultOptions, ...options };
  
  // Ключ для кэша
  const cacheKey = `${personId}_${JSON.stringify(settings)}`;
  
  // Проверяем кэш
  if (treeCache.has(cacheKey)) {
    console.log('Использую кэшированное дерево');
    const cachedTree = treeCache.get(cacheKey);
    clearTree();
    if (typeof drawTree === 'function') {
      drawTree(cachedTree);
    }
    return;
  }
  
  // Строим дерево
  const treeData = buildTreeWithSettings(personId, settings);
  
  // Сохраняем в кэш
  treeCache.set(cacheKey, treeData);
  
  // Очищаем и рисуем
  clearTree();
  if (typeof drawTree === 'function') {
    drawTree(treeData);
  }
  
  // Создаем панель управления
  createSettingsPanel(personId, settings);
}

/**
 * Строит дерево с настройками
 * @param {string} personId - ID человека
 * @param {Object} settings - Настройки
 * @returns {Object} Структура дерева
 */
function buildTreeWithSettings(personId, settings) {
  const person = window.peopleData.people.find(p => p.id === personId);
  if (!person) return null;
  
  const treeNode = {
    id: person.id,
    name: `${person.name} ${person.surname}`,
    data: person,
    children: []
  };
  
  // Добавляем родителей
  if (settings.showParents) {
    const parents = [];
    if (person.fatherId) {
      const father = window.peopleData.people.find(p => p.id === person.fatherId);
      if (father) parents.push(father);
    }
    if (person.motherId) {
      const mother = window.peopleData.people.find(p => p.id === person.motherId);
      if (mother) parents.push(mother);
    }
    
    if (parents.length > 0) {
      treeNode.parents = parents.map(p => 
        buildTreeWithSettings(p.id, { ...settings, maxDepth: settings.maxDepth - 1 })
      ).filter(Boolean);
    }
  }
  
  // Добавляем детей
  if (settings.showChildren && settings.maxDepth > 0) {
    const children = window.peopleData.people.filter(p => 
      p.fatherId === personId || p.motherId === personId
    );
    
    treeNode.children = children.map(child => 
      buildTreeWithSettings(child.id, { ...settings, maxDepth: settings.maxDepth - 1 })
    ).filter(Boolean);
  }
  
  return treeNode;
}

/**
 * Создает панель настроек
 * @param {string} personId - ID текущего человека
 * @param {Object} settings - Текущие настройки
 */
function createSettingsPanel(personId, settings) {
  let panel = document.getElementById('tree-settings-panel');
  
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'tree-settings-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
      max-width: 300px;
      border: 2px solid #FF9800;
    `;
    document.body.appendChild(panel);
  }
  
  const person = window.peopleData.people.find(p => p.id === personId);
  
  panel.innerHTML = `
    <h4 style="margin-top: 0; color: #333;">Настройки отображения</h4>
    <p style="margin: 5px 0; font-size: 14px;">Текущий: <strong>${person?.name || ''} ${person?.surname || ''}</strong></p>
    
    <div style="margin: 10px 0;">
      <label style="display: block; margin: 5px 0;">
        <input type="checkbox" id="show-parents" ${settings.showParents ? 'checked' : ''}>
        Показывать родителей
      </label>
      <label style="display: block; margin: 5px 0;">
        <input type="checkbox" id="show-children" ${settings.showChildren ? 'checked' : ''}>
        Показывать детей
      </label>
      <label style="display: block; margin: 5px 0;">
        <input type="checkbox" id="compact-view" ${settings.compactView ? 'checked' : ''}>
        Компактный вид
      </label>
      
      <div style="margin: 15px 0;">
        <label style="display: block; margin-bottom: 5px;">
          Глубина отображения: <span id="depth-value">${settings.maxDepth}</span>
        </label>
        <input type="range" id="tree-depth" min="1" max="5" value="${settings.maxDepth}" 
               style="width: 100%;">
      </div>
    </div>
    
    <button id="apply-settings" class="btn btn-sm btn-primary" style="width: 100%;">
      Применить настройки
    </button>
    <button id="reset-tree" class="btn btn-sm btn-secondary" style="width: 100%; margin-top: 5px;">
      Показать всё дерево
    </button>
  `;
  
  // Обработчики
  document.getElementById('apply-settings').addEventListener('click', () => {
    const newSettings = {
      maxDepth: parseInt(document.getElementById('tree-depth').value),
      showParents: document.getElementById('show-parents').checked,
      showChildren: document.getElementById('show-children').checked,
      compactView: document.getElementById('compact-view').checked
    };
    
    rebuildTreeWithOptions(personId, newSettings);
  });
  
  document.getElementById('tree-depth').addEventListener('input', (e) => {
    document.getElementById('depth-value').textContent = e.target.value;
  });
  
  document.getElementById('reset-tree').addEventListener('click', resetToFullTree);
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

/**
 * Инициализирует функционал перестройки дерева
 */
function initTreeNavigation() {
  console.log('Инициализация навигации по дереву...');
  
  // Ждем загрузки данных
  if (!window.peopleData) {
    console.warn('Данные еще не загружены, откладываю инициализацию');
    setTimeout(initTreeNavigation, 500);
    return;
  }
  
  // 1. Создаем панель выбора человека
  createPersonSelector();
  
  // 2. Добавляем обработчики кликов на узлы
  addNodeClickHandlers();
  
  // 3. Добавляем глобальные горячие клавиши
  document.addEventListener('keydown', function(e) {
    // Ctrl+F - фокус на поиск
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      const searchInput = document.getElementById('person-search');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
    
    // Escape - сброс к полному дереву
    if (e.key === 'Escape') {
      resetToFullTree();
    }
    
    // S - показать/скрыть панель выбора
    if (e.key === 's' && e.altKey) {
      e.preventDefault();
      const selector = document.getElementById('person-selector');
      if (selector) {
        selector.style.display = selector.style.display === 'none' ? 'block' : 'none';
      }
    }
  });
  
  // 4. Обновляем статистику
  updateStatistics();
  
  console.log('Навигация по дереву инициализирована');
}

/**
 * Обновляет статистику
 */
function updateStatistics() {
  if (!window.peopleData) return;
  
  let statsDiv = document.getElementById('tree-statistics');
  
  if (!statsDiv) {
    statsDiv = document.createElement('div');
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
  }
  
  const total = window.peopleData.people.length;
  const males = window.peopleData.people.filter(p => p.gender === 'M').length;
  const females = window.peopleData.people.filter(p => p.gender === 'F').length;
  
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

// ============================================
// CSS СТИЛИ ДЛЯ УЛУЧШЕНИЯ ВИЗУАЛИЗАЦИИ
// ============================================

function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Анимация при выборе узла */
    .node.selected circle {
      stroke: #FF9800 !important;
      stroke-width: 3px !important;
      animation: pulse 1.5s infinite;
    }
    
    /* Эффект при наведении на узел */
    .node:hover circle {
      stroke: #333 !important;
      stroke-width: 2px !important;
      transform: scale(1.1);
      transition: transform 0.2s ease;
    }
    
    /* Эффект при наведении на элемент списка */
    .person-item:hover {
      background-color: #f0f0f0 !important;
      transform: translateX(5px);
      transition: all 0.2s ease;
    }
    
    /* Анимация пульсации */
    @keyframes pulse {
      0% { stroke-width: 3px; }
      50% { stroke-width: 5px; }
      100% { stroke-width: 3px; }
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
    
    .btn-primary {
      color: #fff;
      background-color: #337ab7;
      border-color: #2e6da4;
    }
    
    .btn-primary:hover {
      background-color: #286090;
      border-color: #204d74;
    }
    
    .btn-secondary {
      color: #333;
      background-color: #fff;
      border-color: #ccc;
    }
    
    .btn-secondary:hover {
      background-color: #e6e6e6;
      border-color: #adadad;
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

// ============================================
// ТОЧКА ВХОДА
// ============================================

// Ждем полной загрузки страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    // Добавляем CSS стили
    addStyles();
    
    // Запускаем инициализацию с задержкой, чтобы все скрипты успели загрузиться
    setTimeout(() => {
      // Проверяем, есть ли данные
      if (window.peopleData && window.peopleData.people) {
        initTreeNavigation();
      } else {
        console.log('Ожидаю загрузки данных...');
        const checkInterval = setInterval(() => {
          if (window.peopleData && window.peopleData.people) {
            clearInterval(checkInterval);
            initTreeNavigation();
          }
        }, 500);
      }
    }, 1000);
  });
} else {
  // Если страница уже загружена
  addStyles();
  setTimeout(() => {
    if (window.peopleData && window.peopleData.people) {
      initTreeNavigation();
    } else {
      console.log('Ожидаю загрузки данных...');
      const checkInterval = setInterval(() => {
        if (window.peopleData && window.peopleData.people) {
          clearInterval(checkInterval);
          initTreeNavigation();
        }
      }, 500);
    }
  }, 1000);
}

// Экспортируем функции в глобальную область видимости
window.rebuildTreeFromPerson = rebuildTreeFromPerson;
window.resetToFullTree = resetToFullTree;
window.createPersonSelector = createPersonSelector;
window.updatePersonList = updatePersonList;

// ===== ОТЛАДОЧНЫЙ КОД =====
console.log("script.js загружен полностью");

// Проверяем наличие элементов через 2 секунды
setTimeout(() => {
    console.log("Проверка состояния через 2 секунды:");
    console.log("FamilyTree:", window.familyTree ? "существует" : "не существует");
    console.log("Tree container:", document.getElementById("tree"));
    console.log("SVG в дереве:", document.querySelector("#tree svg") ? "есть" : "нет");
    
    // Если дерево пустое, пробуем перестроить
    if (window.familyTree && !document.querySelector("#tree svg")) {
        console.log("Дерево пустое, пробую перестроить...");
        window.familyTree.buildTree();
    }
}, 2000);

