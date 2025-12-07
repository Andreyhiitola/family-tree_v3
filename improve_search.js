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
        
        const lowercaseQuery = query.toLowerCase();
        
        // Поиск по имени, фамилии или ID
        const results = this.data.people.filter(person => {
            const fullName = `${person.name} ${person.surname}`.toLowerCase();
            const fullNameReversed = `${person.surname} ${person.name}`.toLowerCase();
            
            return fullName.includes(lowercaseQuery) ||
                   fullNameReversed.includes(lowercaseQuery) ||
                   person.id.toLowerCase().includes(lowercaseQuery);
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
            <div class="search-result-item" data-id="${person.id}">
                <i class="fas fa-${person.gender === 'M' ? 'male' : 'female'} ${person.gender === 'M' ? 'male-icon' : 'female-icon'}"></i>
                <div class="search-result-info">
                    <div class="search-result-name">${person.name} ${person.surname}</div>
                    <div class="search-result-details">
                        <small>ID: ${person.id}</small>
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
                
                // Прокручиваем к выбранному узлу
                this.scrollToNode(personId);
            });
        });
    }
    
    scrollToNode(personId) {
        if (!this.svg || !personId) return;
        
        // Находим узел в данных дерева
        const findNode = (nodes) => {
            for (const node of nodes) {
                if (node.data.id === personId) return node;
                if (node.children) {
                    const found = findNode(node.children);
                    if (found) return found;
                }
            }
            return null;
        };
        
        if (this.treeNodes && this.treeNodes.descendants) {
            const targetNode = this.treeNodes.descendants().find(d => d.data.id === personId);
            if (targetNode) {
                // Прокрутка к узлу (упрощенная реализация)
                console.log('Найден узел для прокрутки:', targetNode);
            }
        }
    }
