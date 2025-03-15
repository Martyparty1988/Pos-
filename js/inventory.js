/**
 * Třída pro správu inventáře a položek
 */
class Inventory {
    constructor(storage, ui, cart) {
        this.storage = storage;
        this.ui = ui;
        this.cart = cart;
        this.items = [];
        this.filteredItems = [];
        this.currentCategory = 'all';
        this.currentSearchQuery = '';
        this.filters = {
            availability: 'all',
            maxPrice: 10000
        };
    }
    
    /**
     * Načtení položek z úložiště
     */
    loadItems() {
        this.items = this.storage.getItems();
        this.filteredItems = [...this.items];
        return this.items;
    }
    
    /**
     * Zobrazení položek v UI
     */
    displayItems() {
        const items = this.loadItems();
        if (items.length === 0) {
            this.addSampleItems();
            this.loadItems();
        }
        
        this.ui.renderItems(this.filteredItems);
    }
    
    /**
     * Přidání vzorových položek při prvním spuštění
     */
    addSampleItems() {
        const sampleItems = [
            {
                id: 'room-101',
                name: 'Pokoj 101',
                description: 'Dvoulůžkový pokoj s výhledem na moře',
                price: 2500,
                category: 'rooms',
                image: 'images/room-101.jpg',
                available: true,
                isNew: false
            },
            {
                id: 'room-102',
                name: 'Pokoj 102',
                description: 'Jednolůžkový pokoj standard',
                price: 1800,
                category: 'rooms',
                image: 'images/room-102.jpg',
                available: true,
                isNew: true
            },
            {
                id: 'room-103',
                name: 'Apartmán 103',
                description: 'Luxusní apartmán s terasou',
                price: 4500,
                category: 'rooms',
                image: 'images/room-103.jpg',
                available: false,
                isNew: false
            },
            {
                id: 'service-massage',
                name: 'Masáž',
                description: '60 minut relaxační masáže',
                price: 1200,
                category: 'services',
                image: 'images/massage.jpg',
                available: true,
                isNew: false
            },
            {
                id: 'service-spa',
                name: 'Vstup do wellness',
                description: 'Celodenní vstup do wellness a sauny',
                price: 800,
                category: 'services',
                image: 'images/spa.jpg',
                available: true,
                isNew: false
            },
            {
                id: 'food-breakfast',
                name: 'Snídaně',
                description: 'Kontinentální snídaně',
                price: 250,
                category: 'food',
                image: 'images/breakfast.jpg',
                available: true,
                isNew: false
            },
            {
                id: 'food-dinner',
                name: 'Večeře',
                description: 'Tříchodové menu dle denní nabídky',
                price: 450,
                category: 'food',
                image: 'images/dinner.jpg',
                available: true,
                isNew: false
            },
            {
                id: 'drink-wine',
                name: 'Víno',
                description: 'Láhev kvalitního místního vína',
                price: 480,
                category: 'drinks',
                image: 'images/wine.jpg',
                available: true,
                isNew: true
            },
            {
                id: 'drink-cocktail',
                name: 'Koktejl',
                description: 'Míchaný nápoj dle výběru',
                price: 180,
                category: 'drinks',
                image: 'images/cocktail.jpg',
                available: true,
                isNew: false
            },
            {
                id: 'extra-flowers',
                name: 'Květiny',
                description: 'Čerstvá kytice na pokoj',
                price: 350,
                category: 'extras',
                image: 'images/flowers.jpg',
                available: true,
                isNew: false
            },
            {
                id: 'extra-champagne',
                name: 'Šampaňské',
                description: 'Láhev šampaňského s jahodami',
                price: 950,
                category: 'extras',
                image: 'images/champagne.jpg',
                available: true,
                isNew: false
            },
            {
                id: 'extra-transfer',
                name: 'Transfer na letiště',
                description: 'Soukromý odvoz na letiště',
                price: 1500,
                category: 'extras',
                image: 'images/transfer.jpg',
                available: true,
                isNew: false
            }
        ];
        
        sampleItems.forEach(item => {
            this.storage.addItem(item);
        });
    }
    
    /**
     * Získání položky podle ID
     */
    getItemById(id) {
        return this.items.find(item => item.id === id);
    }
    
    /**
     * Filtrování podle kategorie
     */
    filterByCategory(category) {
        this.currentCategory = category;
        this.applyAllFilters();
    }
    
    /**
     * Filtrování podle vyhledávacího dotazu
     */
    filterBySearch(query) {
        this.currentSearchQuery = query;
        this.applyAllFilters();
    }
    
    /**
     * Aplikování filtrů dostupnosti a ceny
     */
    applyFilters(availability, maxPrice) {
        this.filters.availability = availability;
        this.filters.maxPrice = maxPrice;
        this.applyAllFilters();
    }
    
    /**
     * Aplikování všech aktuálních filtrů
     */
    applyAllFilters() {
        // Začneme se všemi položkami
        let result = [...this.items];
        
        // Filtr podle kategorie
        if (this.currentCategory !== 'all') {
            result = result.filter(item => item.category === this.currentCategory);
        }
        
        // Filtr podle vyhledávání
        if (this.currentSearchQuery) {
            const query = this.currentSearchQuery.toLowerCase();
            result = result.filter(item => 
                item.name.toLowerCase().includes(query) || 
                item.description.toLowerCase().includes(query)
            );
        }
        
        // Filtr podle dostupnosti
        if (this.filters.availability === 'available') {
            result = result.filter(item => item.available);
        } else if (this.filters.availability === 'unavailable') {
            result = result.filter(item => !item.available);
        }
        
        // Filtr podle ceny
        if (this.filters.maxPrice) {
            result = result.filter(item => item.price <= this.filters.maxPrice);
        }
        
        this.filteredItems = result;
        this.ui.renderItems(this.filteredItems);
    }
    
    /**
     * Reset všech filtrů
     */
    resetFilters() {
        this.currentCategory = 'all';
        this.currentSearchQuery = '';
        this.filters = {
            availability: 'all',
            maxPrice: 10000
        };
        this.filteredItems = [...this.items];
        this.ui.renderItems(this.filteredItems);
    }
    
    /**
     * Vyhledávání položek pro našeptávač
     */
    searchItems(query) {
        query = query.toLowerCase();
        return this.items.filter(item => 
            item.name.toLowerCase().includes(query) || 
            item.description.toLowerCase().includes(query)
        ).slice(0, 5); // Vrátí max 5 výsledků pro našeptávač
    }
    
    /**
     * Přidání nové položky
     */
    addItem(item) {
        this.storage.addItem(item);
        this.loadItems();
        this.applyAllFilters();
    }
    
    /**
     * Aktualizace položky
     */
    updateItem(id, updatedItem) {
        this.storage.updateItem(id, updatedItem);
        this.loadItems();
        this.applyAllFilters();
    }
    
    /**
     * Odstranění položky
     */
    removeItem(id) {
        this.storage.removeItem(id);
        this.loadItems();
        this.applyAllFilters();
    }
    
    /**
     * Změna dostupnosti položky
     */
    toggleItemAvailability(id) {
        const item = this.getItemById(id);
        if (item) {
            item.available = !item.available;
            this.storage.updateItem(id, item);
            this.loadItems();
            this.applyAllFilters();
        }
    }
}