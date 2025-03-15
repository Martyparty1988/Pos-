/**
 * Třída pro správu uživatelského rozhraní
 */
class UI {
    constructor() {
        this.inventory = null;
        this.cart = null;
        this.statistics = null;
        this.storage = null;
        this.settings = {
            darkMode: false,
            language: 'cs',
            currency: 'CZK',
            taxRate: 21
        };
    }
    
    /**
     * Inicializace UI
     */
    initialize(inventory, cart, statistics, storage) {
        this.inventory = inventory;
        this.cart = cart;
        this.statistics = statistics;
        this.storage = storage;
        
        // Načtení nastavení
        this.loadSettingsFromStorage();
        
        // Aplikace uložených nastavení
        this.applySettings();
    }
    
    /**
     * Načtení nastavení z úložiště
     */
    loadSettingsFromStorage() {
        const savedSettings = this.storage.getSettings();
        if (savedSettings) {
            this.settings = { ...this.settings, ...savedSettings };
        }
    }
    
    /**
     * Aplikace nastavení
     */
    applySettings() {
        // Aplikace tmavého režimu
        if (this.settings.darkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('dark-mode-toggle').innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            document.getElementById('dark-mode-toggle').innerHTML = '<i class="fas fa-moon"></i>';
        }
        
        // Aplikace daňové sazby
        if (this.cart) {
            this.cart.taxRate = this.settings.taxRate / 100;
            this.cart.updateUI();
        }
    }
    
    /**
     * Přepnutí tmavého režimu
     */
    toggleDarkMode() {
        this.settings.darkMode = !this.settings.darkMode;
        this.storage.saveSettings(this.settings);
        this.applySettings();
    }
    
    /**
     * Vykreslení položek inventáře
     */
    renderItems(items) {
        const itemsContainer = document.getElementById('items-container');
        itemsContainer.innerHTML = '';
        
        if (items.length === 0) {
            itemsContainer.innerHTML = '<p class="no-items">Žádné položky nebyly nalezeny</p>';
            return;
        }
        
        items.forEach(item => {
            const itemElement = this.createItemElement(item);
            itemsContainer.appendChild(itemElement);
        });
    }
    
    /**
     * Vytvoření HTML elementu položky
     */
    createItemElement(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-card';
        itemDiv.dataset.id = item.id;
        
        // Přidání drag and drop funkcionality
        itemDiv.draggable = true;
        itemDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.id);
            itemDiv.classList.add('dragging');
        });
        
        itemDiv.addEventListener('dragend', () => {
            itemDiv.classList.remove('dragging');
        });
        
        // Obsah položky
        let badgeHtml = '';
        if (item.isNew) {
            badgeHtml = '<div class="item-badge badge-new">Novinka</div>';
        }
        
        let unavailableOverlay = '';
        if (!item.available) {
            unavailableOverlay = '<div class="item-unavailable">Nedostupné</div>';
        }
        
        itemDiv.innerHTML = `
            <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.name}" class="item-image">
            ${badgeHtml}
            ${unavailableOverlay}
            <div class="item-content">
                <h3 class="item-name">${item.name}</h3>
                <p class="item-description">${item.description}</p>
                <div class="item-footer">
                    <span class="item-price">${item.price} Kč</span>
                    <button class="add-to-cart" data-id="${item.id}"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        `;
        
        // Přidání event listeneru pro tlačítko přidat do košíku
        itemDiv.querySelector('.add-to-cart').addEventListener('click', (e) => {
            e.stopPropagation();
            if (item.available) {
                this.cart.addItem(item.id);
            } else {
                this.showNotification('Tato položka není momentálně dostupná', 'error');
            }
        });
        
        return itemDiv;
    }
    
    /**
     * Vykreslení košíku
     */
    renderCart(items) {
        const cartItems = document.getElementById('cart-items');
        const cartEmptyMessage = document.querySelector('.cart-empty-message');
        
        if (items.length === 0) {
            cartItems.innerHTML = '';
            cartEmptyMessage.style.display = 'block';
            return;
        }
        
        cartEmptyMessage.style.display = 'none';
        cartItems.innerHTML = '';
        
        items.forEach(item => {
            const itemElement = this.createCartItemElement(item);
            cartItems.appendChild(itemElement);
        });
    }
    
    /**
     * Vytvoření HTML elementu položky v košíku
     */
    createCartItemElement(item) {
        const li = document.createElement('li');
        li.className = `cart-item${item.isNew ? ' new' : ''}`;
        
        li.innerHTML = `
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price} Kč</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-button decrease" data-id="${item.id}">-</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-button increase" data-id="${item.id}">+</button>
            </div>
            <div class="cart-item-total">${item.price * item.quantity} Kč</div>
            <button class="cart-item-remove" data-id="${item.id}"><i class="fas fa-times"></i></button>
        `;
        
        // Event listenery pro tlačítka
        li.querySelector('.decrease').addEventListener('click', () => {
            this.cart.updateQuantity(item.id, item.quantity - 1);
        });
        
        li.querySelector('.increase').addEventListener('click', () => {
            this.cart.updateQuantity(item.id, item.quantity + 1);
        });
        
        li.querySelector('.cart-item-remove').addEventListener('click', () => {
            this.cart.removeItem(item.id);
        });
        
        return li;
    }
    
    /**
     * Zobrazení našeptávače vyhledávání
     */
    displaySearchSuggestions(suggestions, query) {
        const suggestionsContainer = document.getElementById('search-suggestions');
        
        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        suggestionsContainer.innerHTML = '';
        suggestions.forEach(item => {
            const suggestion = document.createElement('div');
            suggestion.className = 'search-suggestion';
            
            // Zvýraznění hledaného textu
            const regex = new RegExp(query, 'gi');
            const highlightedName = item.name.replace(regex, match => `<strong>${match}</strong>`);
            
            suggestion.innerHTML =