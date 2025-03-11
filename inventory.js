// Databáze produktů pro Villa POS

// Inventář produktů pro každou lokaci
const inventoryItems = [
    // 1. Nealkoholické nápoje
    { name: 'Coca-Cola', price: 32, currency: 'CZK', image: 'images/cola.png', category: 'non-alcoholic' },
    { name: 'Sprite', price: 32, currency: 'CZK', image: 'images/sprite.png', category: 'non-alcoholic' },
    { name: 'Fanta', price: 32, currency: 'CZK', image: 'images/fanta.png', category: 'non-alcoholic' },
    { name: 'Red Bull', price: 59, currency: 'CZK', image: 'images/redbull.png', category: 'non-alcoholic' },
    
    // 2. Alkoholické nápoje
    { name: 'Malibu', price: 99, currency: 'CZK', image: 'images/malibu.png', category: 'alcoholic' },
    { name: 'Jack's Cola', price: 99, currency: 'CZK', image: 'images/jack.png', category: 'alcoholic' },
    { name: 'Moscow Mule', price: 99, currency: 'CZK', image: 'images/moscow.png', category: 'alcoholic' },
    { name: 'Gin Tonic', price: 99, currency: 'CZK', image: 'images/gin.png', category: 'alcoholic' },
    { name: 'Mojito', price: 99, currency: 'CZK', image: 'images/mojito.png', category: 'alcoholic' },
    { name: 'Prosecco', price: 390, currency: 'CZK', image: 'images/prosecco.png', category: 'alcoholic' },
    
    // 3. Piva
    { name: 'Budvar', price: 59, currency: 'CZK', image: 'images/budvar.png', category: 'beer' },
    { name: 'Sud 30 litrů', price: 125, currency: 'EUR', image: 'images/30keg.png', category: 'beer' },
    { name: 'Sud 50 litrů', price: 175, currency: 'EUR', image: 'images/50keg.png', category: 'beer' },
    { name: 'Budvar plechovka', price: 59, currency: 'CZK', image: 'images/budvar.png', category: 'beer' },
    
    // 4. Relax
    { name: 'Wellness balíček', price: 0, currency: 'EUR', image: 'images/wellness.png', category: 'relax', customPrice: true },
    { name: 'Grily', price: 20, currency: 'EUR', image: 'images/grill.png', category: 'relax' },
    { name: 'Plyny do ohňových stolů', price: 12, currency: 'EUR', image: 'images/Plyn.png', category: 'relax' }
];

// Vytvoření inventáře pro každou lokaci
const inventory = {
    'oh-yeah': [...inventoryItems],
    'amazing-pool': [...inventoryItems],
    'little-castle': [...inventoryItems]
};

// Funkce pro získání produktů podle kategorie
function getProductsByCategory(category, location = 'oh-yeah') {
    if (!inventory[location]) {
        return [];
    }
    
    if (category === 'all') {
        return inventory[location];
    }
    return inventory[location].filter(item => item.category === category);
}

// Funkce pro vyhledávání produktů podle názvu
function searchProducts(query, location = 'oh-yeah') {
    if (!inventory[location]) {
        return [];
    }
    
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return inventory[location];
    
    return inventory[location].filter(product => 
        product.name.toLowerCase().includes(searchTerm)
    );
}

// Funkce pro získání produktu podle indexu
function getProductByIndex(index, location = 'oh-yeah') {
    if (!inventory[location] || index < 0 || index >= inventory[location].length) {
        return null;
    }
    return inventory[location][index];
}

// Načtení uloženého inventáře z localStorage při startu
function initInventory() {
    const savedInventory = localStorage.getItem('villapos-inventory');
    if (savedInventory) {
        try {
            const parsedInventory = JSON.parse(savedInventory);
            if (parsedInventory && typeof parsedInventory === 'object') {
                // Kontrola struktury načteného inventáře
                if (parsedInventory['oh-yeah'] && parsedInventory['amazing-pool'] && parsedInventory['little-castle']) {
                    Object.assign(inventory, parsedInventory);
                }
            }
        } catch (e) {
            console.error('Chyba při načítání inventáře:', e);
        }
    }
}

// Inicializace inventáře při načtení
initInventory();