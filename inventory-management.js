// Správa skladu pro Villa POS

// Skladové zásoby - počet jednotek od každého produktu v každé lokaci
let stockLevels = {
    'oh-yeah': {},
    'amazing-pool': {},
    'little-castle': {}
};

// Historie prodejů
let salesHistory = [];

// Nastavení výchozích skladových zásob
function initializeStock() {
    // Načtení z localStorage, pokud existuje
    const savedStock = localStorage.getItem('villapos-stock');
    if (savedStock && savedStock !== "") {
        try {
            stockLevels = JSON.parse(savedStock);
            console.log("Skladové zásoby načteny z localStorage");
        } catch (e) {
            console.error("Chyba při načítání skladových zásob:", e);
            resetStockToDefault();
        }
    } else {
        resetStockToDefault();
    }
}

// Resetování skladových zásob na výchozí hodnoty
function resetStockToDefault() {
    console.log("Nastavuji výchozí skladové zásoby");
    
    // Pro každou lokaci a každý produkt nastavíme výchozí počet
    Object.keys(inventory).forEach(location => {
        stockLevels[location] = {};
        
        inventory[location].forEach((product, index) => {
            if (product.name !== '') {
                // Výchozí hodnota - 50 ks pro běžné položky, 5 ks pro dražší položky
                let defaultStock = product.price > 100 ? 5 : 50;
                
                // Nastavíme specifické hodnoty pro některé kategorie
                if (product.category === 'beer' && product.name.includes('Sud')) {
                    defaultStock = 2; // Méně sudů
                } else if (product.category === 'relax') {
                    defaultStock = 1; // Jen 1 ks položek typu relax
                }
                
                stockLevels[location][index] = defaultStock;
            }
        });
    });
    
    // Uložení do localStorage
    saveStockToStorage();
}

// Uložení skladových zásob do localStorage
function saveStockToStorage() {
    try {
        localStorage.setItem('villapos-stock', JSON.stringify(stockLevels));
    } catch (e) {
        console.error("Chyba při ukládání skladových zásob:", e);
    }
}

// Zobrazení skladových zásob v tabulce
function displayStockLevels() {
    const stockTableBody = document.getElementById('stock-table-body');
    if (!stockTableBody) return;
    
    // Získáme hodnoty filtrů
    const locationFilter = document.getElementById('inventory-location-filter')?.value || 'all';
    const categoryFilter = document.getElementById('inventory-category-filter')?.value || 'all';
    const searchInput = document.getElementById('inventory-search')?.value.trim().toLowerCase() || '';
    
    stockTableBody.innerHTML = '';
    
    // Získáme všechny produkty ze všech lokací
    Object.keys(inventory).forEach(location => {
        // Přeskočíme lokaci, pokud je filtrována
        if (locationFilter !== 'all' && locationFilter !== location) return;
        
        const items = inventory[location].filter(item => item.name !== '');
        
        items.forEach((item, index) => {
            // Aplikujeme filtry kategorie a vyhledávání
            if (categoryFilter !== 'all' && item.category !== categoryFilter) return;
            if (searchInput && !item.name.toLowerCase().includes(searchInput)) return;
            
            const stockLevel = stockLevels[location][index] || 0;
            const lowStock = stockLevel < 5;
            
            const row = document.createElement('tr');
            row.className = lowStock ? 'low-stock' : '';
            
            let locationName = 'Neznámá lokace';
            if (location === 'oh-yeah') locationName = 'Oh Yeah';
            else if (location === 'amazing-pool') locationName = 'Amazing Pool';
            else if (location === 'little-castle') locationName = 'Little Castle';
            
            let categoryName = 'Ostatní';
            if (item.category === 'non-alcoholic') categoryName = 'Nealko';
            else if (item.category === 'alcoholic') categoryName = 'Alkohol';
            else if (item.category === 'beer') categoryName = 'Piva';
            else if (item.category === 'relax') categoryName = 'Relax';
            
            row.innerHTML = `
                <td>${locationName}</td>
                <td>${item.name}</td>
                <td>${categoryName}</td>
                <td>${item.price} ${item.currency}</td>
                <td class="stock-level">${stockLevel}</td>
                <td>
                    <div class="stock-controls">
                        <button class="stock-decrease" data-location="${location}" data-index="${index}">-</button>
                        <input type="number" class="stock-input" data-location="${location}" data-index="${index}" value="${stockLevel}" min="0">
                        <button class="stock-increase" data-location="${location}" data-index="${index}">+</button>
                    </div>
                </td>
            `;
            stockTableBody.appendChild(row);
        });
    });
    
    // Přidání event listenerů
    document.querySelectorAll('.stock-decrease').forEach(button => {
        button.addEventListener('click', () => {
            const location = button.getAttribute('data-location');
            const index = parseInt(button.getAttribute('data-index'));
            decreaseStock(location, index);
        });
    });
    
    document.querySelectorAll('.stock-increase').forEach(button => {
        button.addEventListener('click', () => {
            const location = button.getAttribute('data-location');
            const index = parseInt(button.getAttribute('data-index'));
            increaseStock(location, index);
        });
    });
    
    document.querySelectorAll('.stock-input').forEach(input => {
        input.addEventListener('change', () => {
            const location = input.getAttribute('data-location');
            const index = parseInt(input.getAttribute('data-index'));
            updateStockDirectly(location, index, input.value);
        });
    });
    
    // Nastavení event listenerů pro filtry
    const locationFilterEl = document.getElementById('inventory-location-filter');
    const categoryFilterEl = document.getElementById('inventory-category-filter');
    const searchInputEl = document.getElementById('inventory-search');
    
    if (locationFilterEl) {
        locationFilterEl.addEventListener('change', displayStockLevels);
    }
    
    if (categoryFilterEl) {
        categoryFilterEl.addEventListener('change', displayStockLevels);
    }
    
    if (searchInputEl) {
        searchInputEl.addEventListener('input', displayStockLevels);
    }
}

// Snížení skladových zásob
function decreaseStock(location, index) {
    if (!stockLevels[location]) {
        stockLevels[location] = {};
    }
    
    const currentStock = stockLevels[location][index] || 0;
    if (currentStock > 0) {
        stockLevels[location][index] = currentStock - 1;
        saveStockToStorage();
        displayStockLevels();
    }
}

// Zvýšení skladových zásob
function increaseStock(location, index) {
    if (!stockLevels[location]) {
        stockLevels[location] = {};
    }
    
    const currentStock = stockLevels[location][index] || 0;
    stockLevels[location][index] = currentStock + 1;
    saveStockToStorage();
    displayStockLevels();
}

// Přímá aktualizace skladových zásob
function updateStockDirectly(location, index, value) {
    if (!stockLevels[location]) {
        stockLevels[location] = {};
    }
    
    // Validace vstupu
    let newValue = parseInt(value);
    if (isNaN(newValue) || newValue < 0) {
        newValue = 0;
    }
    
    stockLevels[location][index] = newValue;
    saveStockToStorage();
    displayStockLevels();
}

// Změna stavu skladu při přidání do košíku
function updateStockOnCartAdd(location, index, quantity = 1) {
    if (!stockLevels[location]) {
        stockLevels[location] = {};
    }
    
    const currentStock = stockLevels[location][index] || 0;
    if (currentStock >= quantity) {
        stockLevels[location][index] = currentStock - quantity;
        saveStockToStorage();
        return true; // Úspěšně odebráno ze skladu
    } else {
        return false; // Nedostatek zásob
    }
}

// Vrácení položek zpět do skladu při odstranění z košíku
function returnStockOnCartRemove(location, index, quantity = 1) {
    if (!stockLevels[location]) {
        stockLevels[location] = {};
    }
    
    const currentStock = stockLevels[location][index] || 0;
    stockLevels[location][index] = currentStock + quantity;
    saveStockToStorage();
}

// Kontrola dostupnosti skladových zásob
function checkStockAvailability(location, index, quantity = 1) {
    if (!stockLevels[location]) {
        return false;
    }
    
    const currentStock = stockLevels[location][index] || 0;
    return currentStock >= quantity;
}

// Zaznamenání prodeje
function recordSale(saleData) {
    // Načtení historie z localStorage
    loadSalesHistory();
    
    // Přidání nového záznamu
    salesHistory.push({
        ...saleData,
        timestamp: new Date().toISOString()
    });
    
    // Uložení do localStorage
    saveSalesHistory();
}

// Nahrání historie prodejů z localStorage
function loadSalesHistory() {
    const savedHistory = localStorage.getItem('villapos-sales');
    if (savedHistory && savedHistory !== "") {
        try {
            salesHistory = JSON.parse(savedHistory);
        } catch (e) {
            console.error("Chyba při načítání historie prodejů:", e);
            salesHistory = [];
        }
    } else {
        salesHistory = [];
    }
}

// Uložení historie prodejů do localStorage
function saveSalesHistory() {
    try {
        // Omezíme velikost historie na posledních 1000 prodejů, abychom nepřekročili localStorage limit
        if (salesHistory.length > 1000) {
            salesHistory = salesHistory.slice(-1000);
        }
        
        localStorage.setItem('villapos-sales', JSON.stringify(salesHistory));
    } catch (e) {
        console.error("Chyba při ukládání historie prodejů:", e);
    }
}

// Export skladových zásob do CSV
function exportStockToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Hlavička CSV
    csvContent += "Lokace,Produkt,Kategorie,Cena,Měna,Skladem\n";
    
    // Data
    Object.keys(inventory).forEach(location => {
        const items = inventory[location].filter(item => item.name !== '');
        
        items.forEach((item, index) => {
            const stockLevel = stockLevels[location][index] || 0;
            
            let locationName = '';
            if (location === 'oh-yeah') locationName = 'Oh Yeah';
            else if (location === 'amazing-pool') locationName = 'Amazing Pool';
            else if (location === 'little-castle') locationName = 'Little Castle';
            
            let categoryName = '';
            if (item.category === 'non-alcoholic') categoryName = 'Nealko';
            else if (item.category === 'alcoholic') categoryName = 'Alkohol';
            else if (item.category === 'beer') categoryName = 'Piva';
            else if (item.category === 'relax') categoryName = 'Relax';
            
            csvContent += `"${locationName}","${item.name}","${categoryName}",${item.price},"${item.currency}",${stockLevel}\n`;
        });
    });
    
    // Vytvoření a stažení CSV souboru
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `villa-stock-${formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Formátování data pro použití v názvech souborů
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Export historie prodejů do CSV
function exportSalesToCSV() {
    // Načtení historie
    loadSalesHistory();
    
    if (salesHistory.length === 0) {
        alert('Žádná historie prodejů k exportu.');
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Hlavička CSV
    csvContent += "Datum,Číslo účtenky,Lokace,Celkem CZK,Celkem EUR,Počet položek\n";
    
    // Data
    salesHistory.forEach(sale => {
        const date = new Date(sale.timestamp);
        const formattedDate = date.toLocaleString('cs-CZ');
        
        let locationName = '';
        if (sale.location === 'oh-yeah') locationName = 'Oh Yeah';
        else if (sale.location === 'amazing-pool') locationName = 'Amazing Pool';
        else if (sale.location === 'little-castle') locationName = 'Little Castle';
        
        csvContent += `"${formattedDate}","${sale.receiptNumber}","${locationName}",${sale.totalCZK.toFixed(2)},${sale.totalEUR.toFixed(2)},${sale.itemCount}\n`;
    });
    
    // Vytvoření a stažení CSV souboru
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `villa-sales-${formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Generování statistik prodejů
function generateSalesStats(dateFrom = null, dateTo = null) {
    // Načtení historie
    loadSalesHistory();
    
    const statsContainer = document.getElementById('sales-stats-container');
    if (!statsContainer) return;
    
    if (salesHistory.length === 0) {
        statsContainer.innerHTML = '<p>Žádná data pro zobrazení statistik.</p>';
        return;
    }
    
    // Filtrování podle data, pokud jsou data zadaná
    let filteredSales = [...salesHistory];
    if (dateFrom && dateTo) {
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Nastavíme konec dne
        
        filteredSales = salesHistory.filter(sale => {
            const saleDate = new Date(sale.timestamp);
            return saleDate >= fromDate && saleDate <= toDate;
        });
    }
    
    if (filteredSales.length === 0) {
        statsContainer.innerHTML = '<p>Žádná data pro vybrané období.</p>';
        return;
    }
    
    // Základní statistiky
    const totalSales = filteredSales.length;
    const totalCZK = filteredSales.reduce((sum, sale) => sum + sale.totalCZK, 0);
    const totalEUR = filteredSales.reduce((sum, sale) => sum + sale.totalEUR, 0);
    const totalItems = filteredSales.reduce((sum, sale) => sum + sale.itemCount, 0);
    
    // Statistiky podle lokací
    const locationStats = {};
    filteredSales.forEach(sale => {
        if (!locationStats[sale.location]) {
            locationStats[sale.location] = {
                count: 0,
                totalCZK: 0,
                totalEUR: 0,
                itemCount: 0
            };
        }
        
        locationStats[sale.location].count++;
        locationStats[sale.location].totalCZK += sale.totalCZK;
        locationStats[sale.location].totalEUR += sale.totalEUR;
        locationStats[sale.location].itemCount += sale.itemCount;
    });
    
    // Statistiky podle dnů
    const dailyStats = {};
    filteredSales.forEach(sale => {
        const date = new Date(sale.timestamp);
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        if (!dailyStats[dateString]) {
            dailyStats[dateString] = {
                count: 0,
                totalCZK: 0,
                totalEUR: 0,
                itemCount: 0
            };
        }
        
        dailyStats[dateString].count++;
        dailyStats[dateString].totalCZK += sale.totalCZK;
        dailyStats[dateString].totalEUR += sale.totalEUR;
        dailyStats[dateString].itemCount += sale.itemCount;
    });
    
    // Seřazení dnů chronologicky
    const sortedDays = Object.keys(dailyStats).sort();
    
    // Zobrazení statistik
    let statsHTML = `
        <div class="stats-overview">
            <h3>Celkové statistiky prodejů</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${totalSales}</div>
                    <div class="stat-label">Celkem prodejů</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalCZK.toFixed(2)} CZK</div>
                    <div class="stat-label">Celkové tržby (CZK)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalEUR.toFixed(2)} EUR</div>
                    <div class="stat-label">Celkové tržby (EUR)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalItems}</div>
                    <div class="stat-label">Celkem prodaných položek</div>
                </div>
            </div>
        </div>
        
        <div class="stats-by-location">
            <h3>Statistiky podle lokací</h3>
            <div class="location-stats-grid">
    `;
    
    Object.keys(locationStats).forEach(location => {
        let locationName = 'Neznámá lokace';
        if (location === 'oh-yeah') locationName = 'Oh Yeah';
        else if (location === 'amazing-pool') locationName = 'Amazing Pool';
        else if (location === 'little-castle') locationName = 'Little Castle';
        
        statsHTML += `
            <div class="location-stat-card">
                <h4>${locationName}</h4>
                <div class="location-stats">
                    <div class="stat-item">
                        <span class="stat-label">Počet prodejů:</span>
                        <span class="stat-value">${locationStats[location].count}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Tržby (CZK):</span>
                        <span class="stat-value">${locationStats[location].totalCZK.toFixed(2)} CZK</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Tržby (EUR):</span>
                        <span class="stat-value">${locationStats[location].totalEUR.toFixed(2)} EUR</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Prodané položky:</span>
                        <span class="stat-value">${locationStats[location].itemCount}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    statsHTML += `
            </div>
        </div>
        
        <div class="stats-daily">
            <h3>Denní přehled prodejů</h3>
            <div class="daily-stats-container">
                <table class="daily-stats-table">
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Počet prodejů</th>
                            <th>Tržby (CZK)</th>
                            <th>Tržby (EUR)</th>
                            <th>Prodané položky</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    sortedDays.forEach(day => {
        const stats = dailyStats[day];
        const dateParts = day.split('-');
        const formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
        
        statsHTML += `
            <tr>
                <td>${formattedDate}</td>
                <td>${stats.count}</td>
                <td>${stats.totalCZK.toFixed(2)} CZK</td>
                <td>${stats.totalEUR.toFixed(2)} EUR</td>
                <td>${stats.itemCount}</td>
            </tr>
        `;
    });
    
    statsHTML += `
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="sales-history">
            <h3>Historie prodejů</h3>
            <table class="sales-table">
                <thead>
                    <tr>
                        <th>Datum</th>
                        <th>Číslo účtenky</th>
                        <th>Lokace</th>
                        <th>Celkem CZK</th>
                        <th>Celkem EUR</th>
                        <th>Položek</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Seřadíme historii od nejnovějších
    const sortedHistory = [...filteredSales].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // Zobrazíme posledních 20 prodejů
    sortedHistory.slice(0, 20).forEach(sale => {
        const date = new Date(sale.timestamp);
        const formattedDate = date.toLocaleString('cs-CZ');
        
        let locationName = 'Neznámá lokace';
        if (sale.location === 'oh-yeah') locationName = 'Oh Yeah';
        else if (sale.location === 'amazing-pool') locationName = 'Amazing Pool';
        else if (sale.location === 'little-castle') locationName = 'Little Castle';
        
        statsHTML += `
            <tr>
                <td>${formattedDate}</td>
                <td>${sale.receiptNumber}</td>
                <td>${locationName}</td>
                <td>${sale.totalCZK.toFixed(2)} CZK</td>
                <td>${sale.totalEUR.toFixed(2)} EUR</td>
                <td>${sale.itemCount}</td>
            </tr>
        `;
    });
    
    statsHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    statsContainer.innerHTML = statsHTML;
}

// Přidání nové položky do inventáře
function addNewItem(itemData) {
    const { name, price, currency, category, location, customPrice, stock } = itemData;
    
    if (!name || price === undefined) {
        alert('Název a cena jsou povinné údaje!');
        return false;
    }
    
    const newItem = {
        name,
        price: parseFloat(price),
        currency,
        category,
        image: `images/${name.toLowerCase().replace(/\s+/g, '')}.png`,
        customPrice: customPrice || false
    };
    
    // Přidání do všech lokací nebo jen do vybrané
    if (location === 'all') {
        Object.keys(inventory).forEach(loc => {
            inventory[loc].push({...newItem});
            // Nastavení počátečního stavu skladu
            const index = inventory[loc].length - 1;
            stockLevels[loc][index] = parseInt(stock) || 0;
        });
    } else {
        if (!inventory[location]) {
            inventory[location] = [];
        }
        inventory[location].push(newItem);
        // Nastavení počátečního stavu skladu
        const index = inventory[location].length - 1;
        stockLevels[location][index] = parseInt(stock) || 0;
    }
    
    // Uložení změn
    saveInventoryToStorage();
    saveStockToStorage();
    
    return true;
}

// Úprava existující položky v inventáři
function updateItem(location, index, itemData) {
    const { name, price, currency, category, customPrice, stock } = itemData;
    
    if (!inventory[location] || !inventory[location][index]) {
        alert('Položka nebyla nalezena!');
        return false;
    }
    
    if (!name || price === undefined) {
        alert('Název a cena jsou povinné údaje!');
        return false;
    }
    
    // Aktualizace položky
    inventory[location][index] = {
        name,
        price: parseFloat(price),
        currency,
        category,
        image: `images/${name.toLowerCase().replace(/\s+/g, '')}.png`,
        customPrice: customPrice || false
    };
    
    // Aktualizace stavu skladu
    if (stock !== undefined) {
        stockLevels[location][index] = parseInt(stock) || 0;
    }
    
    // Uložení změn
    saveInventoryToStorage();
    saveStockToStorage();
    
    return true;
}

// Odstranění položky z inventáře
function removeItem(location, index) {
    if (!inventory[location] || !inventory[location][index]) {
        alert('Položka nebyla nalezena!');
        return false;
    }
    
    // Odstranění položky
    inventory[location].splice(index, 1);
    
    // Odstranění ze skladu
    if (stockLevels[location][index]) {
        delete stockLevels[location][index];
    }
    
    // Přeindexování zásob
    const newStockLevels = {};
    Object.keys(stockLevels[location]).forEach(oldIndex => {
        const numIndex = parseInt(oldIndex);
        if (numIndex > index) {
            newStockLevels[numIndex - 1] = stockLevels[location][oldIndex];
        } else if (numIndex < index) {
            newStockLevels[numIndex] = stockLevels[location][oldIndex];
        }
    });
    
    stockLevels[location] = newStockLevels;
    
    // Uložení změn
    saveInventoryToStorage();
    saveStockToStorage();
    
    return true;
}

// Uložení inventáře do localStorage
function saveInventoryToStorage() {
    try {
        localStorage.setItem('villapos-inventory', JSON.stringify(inventory));
    } catch (e) {
        console.error('Chyba při ukládání inventáře:', e);
    }
}

// Načtení inventáře z localStorage
function loadInventoryFromStorage() {
    try {
        const savedInventory = localStorage.getItem('villapos-inventory');
        if (savedInventory && savedInventory !== "") {
            const parsedInventory = JSON.parse(savedInventory);
            
            // Kontrola struktury
            if (typeof parsedInventory === 'object' && parsedInventory !== null) {
                inventory = parsedInventory;
                return true;
            }
        }
    } catch (e) {
        console.error('Chyba při načítání inventáře:', e);
    }
    
    return false;
}

// Inicializace modulu správy skladu
function initInventoryManagement() {
    // Načtení dat
    loadInventoryFromStorage();
    initializeStock();
    loadSalesHistory();
    
    // Zobrazení dat
    displayStockLevels();
    
    // Event listenery pro tlačítka
    const resetStockBtn = document.getElementById('reset-stock-btn');
    if (resetStockBtn) {
        resetStockBtn.addEventListener('click', () => {
            if (confirm('Opravdu chcete resetovat všechny skladové zásoby na výchozí hodnoty?')) {
                resetStockToDefault();
                displayStockLevels();
            }
        });
    }
    
    const exportStockBtn = document.getElementById('export-stock-btn');
    if (exportStockBtn) {
        exportStockBtn.addEventListener('click', exportStockToCSV);
    }
    
    const exportSalesBtn = document.getElementById('export-sales-btn');
    if (exportSalesBtn) {
        exportSalesBtn.addEventListener('click', exportSalesToCSV);
    }
    
    // Tlačítko pro přidání nové položky
    const addItemBtn = document.getElementById('add-item-btn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            // Reset formuláře
            const itemForm = document.getElementById('item-form');
            if (itemForm) itemForm.reset();
            
            // Nastavení rež
