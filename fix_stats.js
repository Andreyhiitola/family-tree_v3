    updateStats() {
        const personCountElement = document.getElementById('person-count');
        if (personCountElement) {
            personCountElement.textContent = this.data.people.length;
        }
        
        const maleCount = this.data.people.filter(p => p.gender === 'M').length;
        const femaleCount = this.data.people.filter(p => p.gender === 'F').length;
        
        const maleCountElement = document.getElementById('male-count');
        if (maleCountElement) {
            maleCountElement.textContent = maleCount;
        }
        
        const femaleCountElement = document.getElementById('female-count');
        if (femaleCountElement) {
            femaleCountElement.textContent = femaleCount;
        }
    }

    updateGenerationCount() {
        if (!this.root) return;
        
        const generations = new Set();
        this.root.each(d => {
            generations.add(d.depth);
        });
        
        const generationCountElement = document.getElementById('generation-count');
        if (generationCountElement) {
            generationCountElement.textContent = generations.size;
        }
    }
