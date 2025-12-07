    performSearch(query) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;
        
        const lowercaseQuery = query.toLowerCase();
        
        // Поиск по имени, фамилии или ID
        const results = this.data.people.filter(person => {
            const fullName = `${person.name} ${person.surname}`.toLowerCase();
            const fullNameReversed = `${person.surname} ${person.name}`.toLowerCase();
            const personId = String(person.id).toLowerCase();
            
            return fullName.includes(lowercaseQuery) ||
                   fullNameReversed.includes(lowercaseQuery) ||
                   personId.includes(lowercaseQuery);
        });
        
        this.showSearchResults(results);
    }
