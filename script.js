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
