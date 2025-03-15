/**
 * Hlavní aplikační soubor
 */
document.addEventListener('DOMContentLoaded', () => {
    // Inicializace aplikace
    console.log('Villa POS se načítá...');
    
    // Komponenty aplikace
    const ui = new UI();
    const storage = new Storage();
    const cart = new Cart(storage, ui);
    const inventory = new Inventory(storage, ui, cart);
    const statistics = new Statistics(storage, ui);
    
    // Načtení dat
    storage.initialize();
    
    // Nastavení UI
    ui.initialize(inventory, cart, statistics, storage);
    
    // Zobrazení produktů
    inventory.displayItems();
    
    // Nastavení event listenerů
    setupEventListeners(ui, inventory, cart, statistics, storage);
    
    console.log('Villa POS je připraven k použití.');
});

/**
 * Nastavení globálních event listenerů
 */
function setupEventListeners(ui, inventory, cart, statistics, storage) {
    // Přepínání tmavého režimu
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('click', () => {
        ui.toggleDarkMode();
    });
    
    // Kategorie
    const categoryList = document.getElementById('category-list');
    categoryList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const category = e.target.dataset.category;
            ui.setActiveCategory(e.target);
            inventory.filterByCategory(category);
        }
    });
    
    // Vyhledávání
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 2) {
            const suggestions = inventory.searchItems(query);
            ui.displaySearchSuggestions(suggestions, query);
        } else {
            ui.hideSearchSuggestions();
        }
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            inventory.filterBySearch(query);
            ui.hideSearchSuggestions();
        }
    });
    
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        inventory.filterBySearch(query);
        ui.hideSearchSuggestions();
    });
    
    // Filtrování
    const filterAvailability = document.getElementById('filter-availability');
    filterAvailability.addEventListener('change', () => {
        applyFilters(inventory);
    });
    
    const filterPrice = document.getElementById('filter-price');
    filterPrice.addEventListener('input', () => {
        const priceValue = document.getElementById('price-value');
        priceValue.textContent = `${filterPrice.value} Kč`;
    });
    
    filterPrice.addEventListener('change', () => {
        applyFilters(inventory);
    });
    
    const resetFilters = document.getElementById('reset-filters');
    resetFilters.addEventListener('click', () => {
        ui.resetFilters();
        inventory.resetFilters();
    });
    
    // Statistiky
    const statisticsButton = document.getElementById('statistics-button');
    statisticsButton.addEventListener('click', () => {
        statistics.loadData();
        ui.openModal('statistics-modal');
    });
    
    const periodButtons = document.querySelectorAll('.period-button');
    periodButtons.forEach(button => {
        button.addEventListener('click', () => {
            const period = button.dataset.period;
            ui.setActivePeriod(button);
            statistics.updatePeriod(period);
        });
    });
    
    const exportPdfButton = document.getElementById('export-pdf');
    exportPdfButton.addEventListener('click', () => {
        statistics.exportPDF();
    });
    
    const exportCsvButton = document.getElementById('export-csv');
    exportCsvButton.addEventListener('click', () => {
        statistics.exportCSV();
    });
    
    // Nastavení
    const settingsButton = document.getElementById('settings-button');
    settingsButton.addEventListener('click', () => {
        ui.loadSettings();
        ui.openModal('settings-modal');
    });
    
    const saveSettingsButton = document.getElementById('save-settings');
    saveSettingsButton.addEventListener('click', () => {
        ui.saveSettings();
        ui.closeModal('settings-modal');
    });
    
    // Export a import dat
    const exportDataButton = document.getElementById('export-data');
    exportDataButton.addEventListener('click', () => {
        storage.exportData();
    });
    
    const importDataButton = document.getElementById('import-data');
    importDataButton.addEventListener('click', () => {
        ui.triggerFileUpload(storage.importData.bind(storage));
    });
    
    const clearDataButton = document.getElementById('clear-data');
    clearDataButton.addEventListener('click', () => {
        if (confirm('Oprav