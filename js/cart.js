/**
 * Třída pro správu košíku
 */
class Cart {
    constructor(storage, ui) {
        this.storage = storage;
        this.ui = ui;
        this.items = [];
        this.taxRate = 0.21; // 21% DPH
        
        // Načtení uložených položek v košíku
        this.loadCart();
    }
    
    /**
     * Načtení košíku z localStorage
     */
    loadCart() {
        this.items = this.storage.getCart();
        this.updateUI();
    }
    
    /**
     * Uložení košíku do localStorage
     */
    saveCart() {
        this.storage.saveCart(this.items);
    }
    
    /**
     * Aktualizace UI košíku
     */
    updateUI() {
        this.ui.renderCart(this.items);
        this.calculateTotals();
        
        // Aktivace/deaktivace tlačítek objednávky
        const checkoutButton = document.getElementById('checkout-button');
        const saveOrderButton = document.getElementById('save-order-button');
        
        if (this.items.length > 0) {
            checkoutButton.disabled = false;
            saveOrderButton.disabled = false;
        } else {
            checkoutButton.disabled = true;
            saveOrderButton.disabled = true;
        }
    }
    
    /**
     * Výpočet celkových částek
     */
    calculateTotals() {
        const subtotal = this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
        
        const tax = subtotal * this.taxRate;
        const total = subtotal + tax;
        
        // Aktualizace zobrazení částek
        document.getElementById('cart-subtotal').textContent = `${subtotal.toFixed(0)} Kč`;
        document.getElementById('cart-tax').textContent = `${tax.toFixed(0)} Kč`;
        document.getElementById('cart-total').textContent = `${total.toFixed(0)} Kč`;
        
        return { subtotal, tax, total };
    }
    
    /**
     * Přidání položky do košíku
     */
    addItem(itemId, quantity = 1) {
        const allItems = this.storage.getItems();
        const itemToAdd = allItems.find(item => item.id === itemId);
        
        if (!itemToAdd) {
            console.error(`Položka s ID ${itemId} nebyla nalezena`);
            return;
        }
        
        // Kontrola, zda položka je dostupná
        if (!itemToAdd.available) {
            this.ui.showNotification('Tato položka není momentálně dostupná', 'error');
            return;
        }
        
        // Kontrola, zda položka už je v košíku
        const existingItemIndex = this.items.findIndex(item => item.id === itemId);
        
        if (existingItemIndex !== -1) {
            // Položka už je v košíku, zvýšíme množství
            this.items[existingItemIndex].quantity += quantity;
        } else {
            // Přidáme novou položku do košíku
            this.items.push({
                id: itemToAdd.id,
                name: itemToAdd.name,
                price: itemToAdd.price,
                quantity: quantity,
                isNew: true // Pro animaci
            });
        }
        
        // Uložení košíku a aktualizace UI
        this.saveCart();
        this.updateUI();
        
        // Animace přidání do košíku
        this.ui.animateAddToCart(itemId);
        
        // Oznámení o přidání položky
        this.ui.showNotification(`${itemToAdd.name} přidáno do košíku`, 'success');
        
        // Odstranění flagu isNew po chvíli pro příští animaci
        setTimeout(() => {
            this.items.forEach(item => {
                item.isNew = false;
            });
            this.saveCart();
        }, 500);
    }
    
    /**
     * Změna množství položky v košíku
     */
    updateQuantity(itemId, quantity) {
        const itemIndex = this.items.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            console.error(`Položka s ID ${itemId} nebyla v košíku nalezena`);
            return;
        }
        
        // Pokud je množství 0 nebo méně, položku odstraníme
        if (quantity <= 0) {
            this.removeItem(itemId);
            return;
        }
        
        // Jinak aktualizujeme množství
        this.items[itemIndex].quantity = quantity;
        
        // Uložení košíku a aktualizace UI
        this.saveCart();
        this.updateUI();
    }
    
    /**
     * Odstranění položky z košíku
     */
    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        
        // Uložení košíku a aktualizace UI
        this.saveCart();
        this.updateUI();
    }
    
    /**
     * Vymazání celého košíku
     */
    clearCart() {
        this.items = [];
        
        // Uložení košíku a aktualizace UI
        this.saveCart();
        this.updateUI();
    }
    
    /**
     * Uložení objednávky k pozdějšímu dokončení
     */
    saveOrder() {
        if (this.items.length === 0) {
            this.ui.showNotification('Košík je prázdný', 'error');
            return;
        }
        
        const order = {
            id: `order-${Date.now()}`,
            items: [...this.items],
            timestamp: Date.now(),
            status: 'saved',
            totals: this.calculateTotals()
        };
        
        this.storage.saveOrder(order);
        this.clearCart();
    }
    
    /**
     * Dokončení objednávky
     */
    completeOrder(orderDetails) {
        if (this.items.length === 0) {
            this.ui.showNotification('Košík je prázdný', 'error');
            return;
        }
        
        const order = {
            id: `order-${Date.now()}`,
            items: [...this.items],
            timestamp: Date.now(),
            status: 'completed',
            totals: this.calculateTotals(),
            customer: orderDetails
        };
        
        // Uložení objednávky do historie
        this.storage.saveOrder(order);
        
        // Přidání položek do statistik
        this.storage.addToStatistics(order);
        
        // Vymazání košíku
        this.clearCart();
    }
    
    /**
     * Získání uložené objednávky
     */
    loadSavedOrder(orderId) {
        const savedOrder = this.storage.getOrderById(orderId);
        
        if (!savedOrder) {
            this.ui.showNotification('Objednávka nebyla nalezena', 'error');
            return;
        }
        
        // Nahrazení košíku položkami z uložené objednávky
        this.items = [...savedOrder.items];
        
        // Uložení košíku a aktualizace UI
        this.saveCart();
        this.updateUI();
        
        this.ui.showNotification('Objednávka byla načtena', 'success');
    }
}