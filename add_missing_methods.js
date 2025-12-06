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
