class FamilyTree {
    constructor() {
        this.data = { people: [] };
        this.selectedPerson = null;
        this.treeData = null;
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
                { id: '1', name: 'Иван', surname: 'Иванов', gender: 'M', 
                  birthDate: '1950-01-01', deathDate: '', 
                  fatherId: null, motherId: null },
                { id: '2', name: 'Мария', surname: 'Иванова', gender: 'F', 
                  birthDate: '1955-02-02', deathDate: '', 
                  fatherId: null, motherId: null },
                { id: '3', name: 'Алексей', surname: 'Иванов', gender: 'M', 
                  birthDate: '1980-03-03', deathDate: '', 
                  fatherId: '1', motherId: '2' }
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
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            console.log('Поиск:', query);
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
        this.showNotification(`Выбран: ${personId}`, 'info');
    }

    buildTree() {
        console.log('Построение дерева');
        const treeContainer = document.getElementById('tree');
        if (!treeContainer) return;
        
        if (!window.d3) {
            treeContainer.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <h3>D3.js не загружена</h3>
                    <p>Проверьте подключение к интернету и обновите страницу</p>
                </div>`;
            return;
        }
        
        // Простое дерево для демонстрации
        treeContainer.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h3>Дерево загружено</h3>
                <p>Количество людей: ${this.data.people.length}</p>
                <div style="margin-top: 20px;">
                    ${this.data.people.map(p => 
                        `<div style="margin: 10px; padding: 10px; background: #f0f0f0; border-radius: 4px; cursor: pointer;" 
                              onclick="window.familyTree.selectPerson('${p.id}')">
                            ${p.name} ${p.surname} (${p.gender === 'M' ? '♂' : '♀'})
                        </div>`
                    ).join('')}
                </div>
            </div>`;
    }

    updateStats() {
        const elements = {
            'person-count': this.data.people.length,
            'male-count': this.data.people.filter(p => p.gender === 'M').length,
            'female-count': this.data.people.filter(p => p.gender === 'F').length,
            'generation-count': 1 // упрощенная версия
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.familyTree = new FamilyTree();
});
