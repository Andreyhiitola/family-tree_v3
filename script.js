class FamilyTree {
    constructor() {
        this.data = { people: [] };
        this.selectedPerson = null;
        this.treeData = null;
        this.zoom = null;
        this.svg = null;
        this.treeLayout = null;
        this.root = null;
        this.isModified = false;
        this.autoSaveTimer = null;
        
        this.init();
    }

    async init() {
        // Загрузка данных из LocalStorage или файла
        await this.loadData();
        
        // Инициализация интерфейса
        this.initUI();
        
        // Построение дерева
        this.buildTree();
        
        // Обновление статистики
        this.updateStats();
        
        // Запуск автосохранения
        this.startAutoSave();
    }

    async loadData() {
        try {
            // Сначала пробуем загрузить из LocalStorage
            const savedData = localStorage.getItem('familyTreeData');
            
            if (savedData) {
                this.data = JSON.parse(savedData);
                console.log('Данные загружены из LocalStorage:', this.data.people.length, 'человек');
                this.showNotification('Данные загружены из сохраненной версии', 'success');
            } else {
                // Если нет в LocalStorage, загружаем из файла
                const response = await fetch('data/family.json');
                if (!response.ok) throw new Error('Файл не найден');
                
                const fileData = await response.json();
                this.data.people = Array.isArray(fileData) ? fileData : fileData.people;
                this.saveToLocalStorage();
                console.log('Данные загружены из файла:', this.data.people.length, 'человек');
            }
            
            // Проверяем и добавляем недостающие поля
            this.data.people = this.data.people.map(person => ({
                id: person.id || this.generateId(),
                name: person.name || '',
                surname: person.surname || '',
                middlename: person.middlename || '',
                gender: person.gender || 'M',
                birthDate: person.birthDate || '',
                deathDate: person.deathDate || '',
                birthPlace: person.birthPlace || '',
                biography: person.biography || '',
                photo: person.photo || '',
                fatherId: person.fatherId || null,
                motherId: person.motherId || null,
                spouseId: person.spouseId || null
            }));
            
            // Обновляем время последнего сохранения
            this.updateLastSaveTime();
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            // Создаем демо данные
            this.createDemoData();
        }
    }

    createDemoData() {
        this.data.people = [
            {
                id: 1,
                name: "Иван",
                surname: "Петров",
                middlename: "Сидорович",
                gender: "M",
                birthDate: "1920-03-15",
                deathDate: "1995-05-10",
                birthPlace: "д. Ивановка",
                biography: "Участник Великой Отечественной войны.",
                photo: "",
                fatherId: null,
                motherId: null,
                spouseId: 2
            },
            {
                id: 2,
                name: "Мария",
                surname: "Петрова",
                middlename: "Ивановна",
                gender: "F",
                birthDate: "1925-07-22",
                deathDate: "2001-01-05",
                birthPlace: "г. Смоленск",
                biography: "Учительница начальных классов.",
                photo: "",
                fatherId: null,
                motherId: null,
                spouseId: 1
            }
        ];
        
        this.saveToLocalStorage();
        console.log('Созданы демо данные');
        this.showNotification('Созданы демо данные. Добавьте своих родственников!', 'info');
    }

    initUI() {
        // Поиск
        const searchInput = document.getElementById('search');
        const searchResults = document.getElementById('search-results');
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }
            
            const results = this.data.people.filter(person => 
                `${person.name} ${person.surname} ${person.middlename}`.toLowerCase().includes(query)
            );
            
            this.showSearchResults(results);
        });
        
        // Кнопки управления
        document.getElementById('reset-view').addEventListener('click', () => this.resetView());
        document.getElementById('add-person').addEventListener('click', () => this.openPersonForm());
        document.getElementById('import-excel').addEventListener('click', () => this.openImportModal());
        document.getElementById('export-excel').addEventListener('click', () => this.exportToExcel());
        document.getElementById('toggle-lines').addEventListener('click', () => this.toggleLines());
        document.getElementById('help-btn').addEventListener('click', () => this.showHelp());
        document.getElementById('save-data').addEventListener('click', () => this.manualSave());
        document.getElementById('show-data-table').addEventListener('click', () => this.showDataTable());
        document.getElementById('export-json').addEventListener('click', () => this.exportToJSON());
        document.getElementById('import-json').addEventListener('click', () => this.importFromJSON());
        document.getElementById('clear-data').addEventListener('click', () => this.clearData());
        
        // Кнопки навигации
        document.getElementById('show-ancestors').addEventListener('click', () => this.showAncestors());
        document.getElementById('show-descendants').addEventListener('click', () => this.showDescendants());
        document.getElementById('show-all-relatives').addEventListener('click', () => this.showAllRelatives());
        
        // Кнопки масштабирования
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('fit-tree').addEventListener('click', () => this.fitTree());
        
        // Кнопки действий с человеком
        document.getElementById('edit-person').addEventListener('click', () => this.openPersonForm(this.selectedPerson));
        document.getElementById('delete-person').addEventListener('click', () => this.openDeleteModal(this.selectedPerson));
        
        // Модальные окна
        this.initModals();
        
        // Drag and drop для импорта
        this.initDragAndDrop();
    }

    initModals() {
        // Модальное окно помощи
        const helpModal = document.getElementById('help-modal');
        const closeHelp = helpModal.querySelector('.close');
        
        document.getElementById('help-btn').addEventListener('click', () => {
            helpModal.style.display = 'block';
        });
        
        closeHelp.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
        
        // Модальное окно добавления/редактирования
        const personModal = document.getElementById('person-modal');
        const closePerson = personModal.querySelector('.close');
        const cancelForm = document.getElementById('cancel-form');
        
        document.getElementById('add-person').addEventListener('click', () => {
            personModal.style.display = 'block';
            document.getElementById('modal-title').innerHTML = '<i class="fas fa-user-plus"></i> Добавить нового человека';
            this.resetPersonForm();
        });
        
        closePerson.addEventListener('click', () => {
            personModal.style.display = 'none';
        });
        
        cancelForm.addEventListener('click', () => {
            personModal.style.display = 'none';
        });
        
        // Обработка формы
        document.getElementById('person-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePerson();
        });
        
        // Модальное окно импорта
        const importModal = document.getElementById('import-modal');
        const closeImport = importModal.querySelector('.close');
        
        document.getElementById('import-excel').addEventListener('click', () => {
            importModal.style.display = 'block';
        });
        
        closeImport.addEventListener('click', () => {
            importModal.style.display = 'none';
            this.resetImport();
        });
        
        // Кнопка выбора файла
        document.getElementById('browse-excel').addEventListener('click', () => {
            document.getElementById('excel-file').click();
        });
        
        // Загрузка шаблона
        document.getElementById('download-template').addEventListener('click', (e) => {
            e.preventDefault();
            this.downloadTemplate();
        });
        
        // Обработка выбора файла
        document.getElementById('excel-file').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });
        
        // Кнопки импорта
        document.getElementById('cancel-import').addEventListener('click', () => {
            importModal.style.display = 'none';
            this.resetImport();
        });
        
        document.getElementById('confirm-import').addEventListener('click', () => {
            this.confirmImport();
        });
        
        // Модальное окно таблицы данных
        const tableModal = document.getElementById('data-table-modal');
        const closeTable = tableModal.querySelector('.close');
        
        document.getElementById('show-data-table').addEventListener('click', () => {
            tableModal.style.display = 'block';
            this.renderDataTable();
        });
        
        closeTable.addEventListener('click', () => {
            tableModal.style.display = 'none';
        });
        
        // Кнопки таблицы
        document.getElementById('refresh-table').addEventListener('click', () => this.renderDataTable());
        document.getElementById('add-from-table').addEventListener('click', () => {
            tableModal.style.display = 'none';
            this.openPersonForm();
        });
        document.getElementById('export-table-excel').addEventListener('click', () => this.exportToExcel());
        
        // Модальное окно удаления
        const deleteModal = document.getElementById('delete-modal');
        const closeDelete = deleteModal.querySelector('.close');
        
        closeDelete.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
        
        document.getElementById('cancel-delete').addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
        
        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.deletePerson();
            deleteModal.style.display = 'none';
        });
        
        // Закрытие модальных окон при клике вне
        window.addEventListener('click', (e) => {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    if (modal.id === 'import-modal') {
                        this.resetImport();
                    }
                }
            });
        });
    }

    initDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('excel-file');
        
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });
    }

    buildTree(personId = null) {
        // Очищаем предыдущее дерево
        d3.select('#tree').html('');
        
        const width = document.getElementById('tree').clientWidth;
        const height = document.getElementById('tree').clientHeight;
        
        // Создаем SVG
        this.svg = d3.select('#tree')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .call(d3.zoom().scaleExtent([0.1, 3]).on('zoom', (event) => {
                this.svg.select('g').attr('transform', event.transform);
            }))
            .append('g')
            .attr('transform', `translate(${width / 2}, 50)`);
        
        // Строим иерархию данных
        this.createTreeStructure(personId);
        
        // Создаем дерево
        this.treeLayout = d3.tree().size([height - 100, width - 100]);
        
        // Применяем layout
        this.root = this.treeLayout(this.treeData);
        
        // Рисуем связи
        this.drawLinks();
        
        // Рисуем узлы
        this.drawNodes();
        
        // Обновляем счетчик поколений
        this.updateGenerationCount();
    }

    // ... (остальные методы из предыдущей версии остаются без изменений)
    // Методы для работы с данными, отрисовкой дерева, поиском родственников и т.д.

    openPersonForm(personId = null) {
        const modal = document.getElementById('person-modal');
        const form = document.getElementById('person-form');
        
        // Заполняем выпадающие списки
        this.populatePersonSelects(personId);
        
        if (personId) {
            // Редактирование существующего человека
            const person = this.data.people.find(p => p.id === personId);
            if (person) {
                document.getElementById('modal-title').innerHTML = `<i class="fas fa-edit"></i> Редактировать: ${person.name} ${person.surname}`;
                document.getElementById('form-id').value = person.id;
                document.getElementById('form-name').value = person.name || '';
                document.getElementById('form-surname').value = person.surname || '';
                document.getElementById('form-middlename').value = person.middlename || '';
                document.getElementById('form-gender').value = person.gender || 'M';
                document.getElementById('form-birthDate').value = person.birthDate || '';
                document.getElementById('form-deathDate').value = person.deathDate || '';
                document.getElementById('form-birthPlace').value = person.birthPlace || '';
                document.getElementById('form-biography').value = person.biography || '';
                document.getElementById('form-photo').value = person.photo || '';
                document.getElementById('form-father').value = person.fatherId || '';
                document.getElementById('form-mother').value = person.motherId || '';
                document.getElementById('form-spouse').value = person.spouseId || '';
            }
        } else {
            // Добавление нового человека
            document.getElementById('modal-title').innerHTML = '<i class="fas fa-user-plus"></i> Добавить нового человека';
            this.resetPersonForm();
        }
        
        modal.style.display = 'block';
    }

    resetPersonForm() {
        const form = document.getElementById('person-form');
        form.reset();
        document.getElementById('form-id').value = '';
    }

    populatePersonSelects(excludeId = null) {
        const fatherSelect = document.getElementById('form-father');
        const motherSelect = document.getElementById('form-mother');
        const spouseSelect = document.getElementById('form-spouse');
        
        // Очищаем опции, кроме первой
        [fatherSelect, motherSelect, spouseSelect].forEach(select => {
            while (select.options.length > 1) {
                select.remove(1);
            }
        });
        
        // Добавляем людей в списки
        this.data.people.forEach(person => {
            if (person.id === excludeId) return;
            
            const optionText = `${person.name} ${person.surname} (ID: ${person.id})`;
            const optionValue = person.id;
            
            // Для отца - только мужчины
            if (person.gender === 'M') {
                const option = new Option(optionText, optionValue);
                fatherSelect.add(option);
            }
            
            // Для матери - только женщины
            if (person.gender === 'F') {
                const option = new Option(optionText, optionValue);
                motherSelect.add(option);
            }
            
            // Для супруга(и) - противоположный пол
            const option = new Option(optionText, optionValue);
            spouseSelect.add(option);
        });
    }

    savePerson() {
        const form = document.getElementById('person-form');
        const formData = new FormData(form);
        const personId = parseInt(formData.get('id')) || this.generateId();
        
        const person = {
            id: personId,
            name: formData.get('name'),
            surname: formData.get('surname'),
            middlename: formData.get('middlename'),
            gender: formData.get('gender'),
            birthDate: formData.get('birthDate'),
            deathDate: formData.get('deathDate'),
            birthPlace: formData.get('birthPlace'),
            biography: formData.get('biography'),
            photo: formData.get('photo'),
            fatherId: formData.get('fatherId') || null,
            motherId: formData.get('motherId') || null,
            spouseId: formData.get('spouseId') || null
        };
        
        // Проверяем, существует ли уже человек с таким ID
        const existingIndex = this.data.people.findIndex(p => p.id === personId);
        
        if (existingIndex >= 0) {
            // Обновляем существующего
            this.data.people[existingIndex] = person;
            this.showNotification('Данные обновлены', 'success');
        } else {
            // Добавляем нового
            this.data.people.push(person);
            this.showNotification('Человек добавлен', 'success');
        }
        
        // Обновляем супружескую связь, если указан супруг
        if (person.spouseId) {
            const spouse = this.data.people.find(p => p.id === parseInt(person.spouseId));
            if (spouse && spouse.spouseId !== person.id) {
                spouse.spouseId = person.id;
            }
        }
        
        // Закрываем модальное окно
        document.getElementById('person-modal').style.display = 'none';
        
        // Помечаем данные как измененные
        this.markAsModified();
        
        // Перестраиваем дерево
        this.buildTree(this.selectedPerson);
        
        // Обновляем информацию, если редактировали выбранного человека
        if (this.selectedPerson === personId) {
            this.selectPerson(personId);
        }
        
        // Обновляем статистику
        this.updateStats();
    }

    generateId() {
        const maxId = this.data.people.reduce((max, person) => 
            Math.max(max, person.id || 0), 0);
        return maxId + 1;
    }

    openDeleteModal(personId) {
        const person = this.data.people.find(p => p.id === personId);
        if (!person) return;
        
        const modal = document.getElementById('delete-modal');
        const message = document.getElementById('delete-message');
        
        // Проверяем, есть ли у человека дети
        const hasChildren = this.data.people.some(p => 
            p.fatherId === personId || p.motherId === personId
        );
        
        let warning = '';
        if (hasChildren) {
            warning = '<br><br><strong>Внимание!</strong> У этого человека есть дети. При удалении связи с ними будут потеряны.';
        }
        
        message.innerHTML = `Вы действительно хотите удалить <strong>${person.name} ${person.surname}</strong>?${warning}`;
        modal.style.display = 'block';
        
        // Сохраняем ID для удаления
        this.personToDelete = personId;
    }

    deletePerson() {
        if (!this.personToDelete) return;
        
        const personId = this.personToDelete;
        
        // Удаляем человека
        this.data.people = this.data.people.filter(p => p.id !== personId);
        
        // Удаляем ссылки на этого человека у других
        this.data.people.forEach(person => {
            if (person.fatherId === personId) person.fatherId = null;
            if (person.motherId === personId) person.motherId = null;
            if (person.spouseId === personId) person.spouseId = null;
        });
        
        this.showNotification('Человек удален', 'success');
        
        // Сбрасываем выбранного человека, если удалили его
        if (this.selectedPerson === personId) {
            this.selectedPerson = null;
            document.getElementById('person-actions').style.display = 'none';
            const placeholder = document.querySelector('.info-placeholder');
            if (placeholder) placeholder.style.display = 'flex';
            const details = document.querySelector('.person-details');
            if (details) details.style.display = 'none';
        }
        
        // Помечаем данные как измененные
        this.markAsModified();
        
        // Перестраиваем дерево
        this.buildTree();
        
        // Обновляем статистику
        this.updateStats();
        
        // Сбрасываем ID для удаления
        this.personToDelete = null;
    }

    handleFileSelect(file) {
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                
                // Предпросмотр данных
                this.previewImportData(jsonData);
            } catch (error) {
                console.error('Ошибка чтения файла:', error);
                this.showNotification('Ошибка чтения файла', 'error');
            }
        };
        
        reader.onerror = () => {
            this.showNotification('Ошибка загрузки файла', 'error');
        };
        
        reader.readAsBinaryString(file);
    }

    previewImportData(data) {
        const previewTable = document.getElementById('preview-table');
        const tbody = previewTable.querySelector('tbody');
        const importPreview = document.getElementById('import-preview');
        const importSummary = document.getElementById('import-summary');
        
        // Очищаем таблицу
        tbody.innerHTML = '';
        
        // Показываем первые 10 строк для предпросмотра
        const previewRows = data.slice(0, 10);
        
        previewRows.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.ID || row.id || ''}</td>
                <td>${row.Имя || row.name || row.Name || ''}</td>
                <td>${row.Фамилия || row.surname || row.Surname || ''}</td>
                <td>${row.Отчество || row.middlename || row.Middlename || ''}</td>
                <td>${row.Пол || row.gender || row.Gender || ''}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // Статистика импорта
        const totalRows = data.length;
        const validRows = data.filter(row => row.Имя && row.Фамилия).length;
        
        importSummary.innerHTML = `
            <p><strong>Найдено записей:</strong> ${totalRows}</p>
            <p><strong>Валидных записей:</strong> ${validRows}</p>
            <p><strong>Новых записей:</strong> ${totalRows} (существующие данные будут заменены)</p>
        `;
        
        // Сохраняем данные для импорта
        this.importData = data;
        
        // Показываем предпросмотр
        importPreview.style.display = 'block';
    }

    confirmImport() {
        if (!this.importData || this.importData.length === 0) {
            this.showNotification('Нет данных для импорта', 'error');
            return;
        }
        
        try {
            // Преобразуем данные в наш формат
            const importedPeople = this.importData.map(row => ({
                id: row.ID || row.id || this.generateId(),
                name: row.Имя || row.name || row.Name || '',
                surname: row.Фамилия || row.surname || row.Surname || '',
                middlename: row.Отчество || row.middlename || row.Middlename || '',
                gender: (row.Пол || row.gender || row.Gender || 'M').toUpperCase(),
                birthDate: row.Дата_рождения || row.birthDate || row['Дата рождения'] || '',
                deathDate: row.Дата_смерти || row.deathDate || row['Дата смерти'] || '',
                birthPlace: row.Место_рождения || row.birthPlace || row['Место рождения'] || '',
                biography: row.Биография || row.biography || row.Biography || '',
                photo: row.Фото || row.photo || row.Photo || '',
                fatherId: row.ID_отца || row.fatherId || row['ID отца'] || null,
                motherId: row.ID_матери || row.motherId || row['ID матери'] || null,
                spouseId: row.ID_супруга || row.spouseId || row['ID супруга'] || null
            }));
            
            // Заменяем все данные
            this.data.people = importedPeople;
            
            // Закрываем модальное окно
            document.getElementById('import-modal').style.display = 'none';
            this.resetImport();
            
            // Помечаем данные как измененные
            this.markAsModified();
            
            // Перестраиваем дерево
            this.buildTree();
            
            // Обновляем статистику
            this.updateStats();
            
            this.showNotification(`Импортировано ${importedPeople.length} записей`, 'success');
            
        } catch (error) {
            console.error('Ошибка импорта:', error);
            this.showNotification('Ошибка импорта данных', 'error');
        }
    }

    resetImport() {
        document.getElementById('import-preview').style.display = 'none';
        document.getElementById('excel-file').value = '';
        this.importData = null;
    }

    downloadTemplate() {
        // Создаем шаблон Excel
        const templateData = [
            {
                'ID': '1',
                'Имя': 'Иван',
                'Фамилия': 'Петров',
                'Отчество': 'Сидорович',
                'Пол': 'М',
                'Дата рождения': '1920-03-15',
                'Дата смерти': '1995-05-10',
                'Место рождения': 'д. Ивановка',
                'ID_отца': '',
                'ID_матери': '',
                'ID_супруга': '2',
                'Биография': 'Участник Великой Отечественной войны',
                'Фото': 'photos/ivan.jpg'
            },
            {
                'ID': '2',
                'Имя': 'Мария',
                'Фамилия': 'Петрова',
                'Отчество': 'Ивановна',
                'Пол': 'Ж',
                'Дата рождения': '1925-07-22',
                'Дата смерти': '2001-01-05',
                'Место рождения': 'г. Смоленск',
                'ID_отца': '',
                'ID_матери': '',
                'ID_супруга': '1',
                'Биография': 'Учительница начальных классов',
                'Фото': 'photos/maria.jpg'
            }
        ];
        
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Шаблон");
        XLSX.writeFile(wb, "шаблон_семейное_древо.xlsx");
    }

    exportToExcel() {
        // Создаем рабочую книгу
        const ws = XLSX.utils.json_to_sheet(this.data.people.map(p => ({
            'ID': p.id,
            'Имя': p.name,
            'Фамилия': p.surname,
            'Отчество': p.middlename || '',
            'Пол': p.gender === 'M' ? 'М' : 'Ж',
            'Дата рождения': p.birthDate || '',
            'Дата смерти': p.deathDate || '',
            'Место рождения': p.birthPlace || '',
            'ID_отца': p.fatherId || '',
            'ID_матери': p.motherId || '',
            'ID_супруга': p.spouseId || '',
            'Биография': p.biography || '',
            'Фото': p.photo || ''
        })));
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Семейное древо");
        
        // Сохраняем файл
        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `семейное_древо_${date}.xlsx`);
        
        this.showNotification('Данные экспортированы в Excel', 'success');
    }

    exportToJSON() {
        const dataStr = JSON.stringify(this.data.people, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const date = new Date().toISOString().split('T')[0];
        saveAs(dataBlob, `семейное_древо_${date}.json`);
        
        this.showNotification('Данные экспортированы в JSON', 'success');
    }

    importFromJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    if (Array.isArray(importedData)) {
                        // Проверяем структуру данных
                        const isValid = importedData.every(item => 
                            item.id !== undefined && item.name && item.surname
                        );
                        
                        if (isValid) {
                            // Заменяем данные
                            this.data.people = importedData;
                            this.markAsModified();
                            this.buildTree();
                            this.updateStats();
                            this.showNotification(`Импортировано ${importedData.length} записей из JSON`, 'success');
                        } else {
                            this.showNotification('Неверный формат JSON файла', 'error');
                        }
                    } else {
                        this.showNotification('JSON должен содержать массив объектов', 'error');
                    }
                } catch (error) {
                    console.error('Ошибка парсинга JSON:', error);
                    this.showNotification('Ошибка чтения JSON файла', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    renderDataTable() {
        const table = document.getElementById('data-table');
        const tbody = table.querySelector('tbody');
        
        // Очищаем таблицу
        tbody.innerHTML = '';
        
        // Сортируем по ID
        const sortedPeople = [...this.data.people].sort((a, b) => a.id - b.id);
        
        sortedPeople.forEach(person => {
            const tr = document.createElement('tr');
            
            // Находим имена родственников по ID
            const father = person.fatherId ? this.data.people.find(p => p.id === person.fatherId) : null;
            const mother = person.motherId ? this.data.people.find(p => p.id === person.motherId) : null;
            const spouse = person.spouseId ? this.data.people.find(p => p.id === person.spouseId) : null;
            
            tr.innerHTML = `
                <td>${person.id}</td>
                <td>${person.name}</td>
                <td>${person.surname}</td>
                <td>${person.middlename || ''}</td>
                <td>${person.gender === 'M' ? 'Мужской' : 'Женский'}</td>
                <td>${person.birthDate || ''}</td>
                <td>${person.deathDate || ''}</td>
                <td>${father ? `${father.name} ${father.surname} (ID: ${father.id})` : ''}</td>
                <td>${mother ? `${mother.name} ${mother.surname} (ID: ${mother.id})` : ''}</td>
                <td>${spouse ? `${spouse.name} ${spouse.surname} (ID: ${spouse.id})` : ''}</td>
                <td class="actions-cell">
                    <button class="btn-small btn-edit" data-id="${person.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-small btn-danger btn-delete" data-id="${person.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Добавляем обработчики для кнопок действий
        tbody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const personId = parseInt(e.target.closest('button').dataset.id);
                document.getElementById('data-table-modal').style.display = 'none';
                this.openPersonForm(personId);
            });
        });
        
        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const personId = parseInt(e.target.closest('button').dataset.id);
                document.getElementById('data-table-modal').style.display = 'none';
                this.openDeleteModal(personId);
            });
        });
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('familyTreeData', JSON.stringify(this.data));
            this.isModified = false;
            this.updateLastSaveTime();
            console.log('Данные сохранены в LocalStorage');
        } catch (error) {
            console.error('Ошибка сохранения в LocalStorage:', error);
            this.showNotification('Ошибка сохранения данных', 'error');
        }
    }

    startAutoSave() {
        // Автосохранение каждые 30 секунд, если есть изменения
        this.autoSaveTimer = setInterval(() => {
            if (this.isModified) {
                this.saveToLocalStorage();
                this.showAutoSaveStatus('Сохранено', 'success');
            }
        }, 30000);
    }

    markAsModified() {
        this.isModified = true;
        this.showAutoSaveStatus('Изменения не сохранены', 'warning');
    }

    manualSave() {
        this.saveToLocalStorage();
        this.showNotification('Данные сохранены', 'success');
    }

    showAutoSaveStatus(message, type = 'info') {
        const status = document.getElementById('auto-save-status');
        status.textContent = message;
        status.className = 'save-status';
        
        if (type === 'success') {
            status.innerHTML = `<i class="fas fa-check"></i> ${message}`;
            status.style.background = '#d4edda';
            status.style.color = '#155724';
            
            // Через 3 секунды возвращаем обычный статус
            setTimeout(() => {
                if (status.textContent === message) {
                    status.innerHTML = '<i class="fas fa-save"></i> Автосохранение';
                    status.style.background = '';
                    status.style.color = '';
                }
            }, 3000);
        } else if (type === 'warning') {
            status.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
            status.style.background = '#fff3cd';
            status.style.color = '#856404';
        }
    }

    updateLastSaveTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const dateString = now.toLocaleDateString('ru-RU');
        
        document.getElementById('last-save').textContent = 
            `Сохранено: ${dateString} ${timeString}`;
    }

    clearData() {
        if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
            localStorage.removeItem('familyTreeData');
            this.data.people = [];
            this.selectedPerson = null;
            this.isModified = false;
            
            // Перестраиваем дерево
            this.buildTree();
            
            // Обновляем статистику
            this.updateStats();
            
            // Сбрасываем интерфейс
            this.resetView();
            
            this.showNotification('Все данные удалены', 'success');
        }
    }

    showNotification(message, type = 'info') {
        // Удаляем предыдущие уведомления
        const oldNotifications = document.querySelectorAll('.notification');
        oldNotifications.forEach(n => n.remove());
        
        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 5 секунд
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // ... (остальные методы из предыдущей версии остаются без изменений)
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.familyTree = new FamilyTree();
    
    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
        if (window.familyTree) {
            setTimeout(() => window.familyTree.buildTree(window.familyTree.selectedPerson), 100);
        }
    });
});
