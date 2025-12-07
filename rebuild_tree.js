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
