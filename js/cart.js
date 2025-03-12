/**
 * Cart.js - Modul pro správu košíku
 * 
 * Tento modul poskytuje funkce pro správu košíku,
 * včetně přidávání, odebírání a aktualizace položek.
 */

const Cart = (() => {
    // Instance košíku, načtená z localStorage
    let cartItems = [];
    
    /**
     * Inicializuje košík
     */
    const init = () => {
        cartItems = Storage.loadCart();
    };
    
    /**
     * Přidá položku do košíku
     * @param {Object} product - Produkt k přidání
     * @param {number} quantity - Množství (výchozí: 1)
     * @param {Object} customData - Vlastní data pro speciální produkty
     * @returns {Object} - Přidaná položka košíku
     */
    const addItem = (product, quantity = 1, customData = null) => {
        // Kontrola, zda produkt již v košíku existuje
        const existingItemIndex = cartItems.findIndex(item => {
            // Pro speciální produkty porovnáváme i vlastní data
            if (product.special && customData) {
                return item.product.id === product.id && 
                       JSON.stringify(item.customData) === JSON.stringify(customData);
            }
            return item.product.id === product.id;
        });
        
        // Když položka již existuje, zvýšíme množství
        if (existingItemIndex !== -1) {
            cartItems[existingItemIndex].quantity += quantity;
            
            // Pokud jde o speciální produkt s vlastní cenou, aktualizujeme ji
            if (customData && customData.price) {
                cartItems[existingItemIndex].customData = customData;
                cartItems[existingItemIndex].price = customData.price;
            }
            
            saveCart();
            return cartItems[existingItemIndex];
        }
        
        // Jinak vytvoříme novou položku
        let price = product.price;
        
        // Pro speciální produkty s vlastní cenou
        if (customData && customData.price !== undefined) {
            price = customData.price;
        }
        
        const newItem = {
            id: `${product.id}_${Date.now()}`,
            product: product,
            quantity: quantity,
            price: price,
            currency: product.currency,
            customData: customData
        };
        
        cartItems.push(newItem);
        saveCart();
        return newItem;
    };
    
    /**
     * Aktualizuje množství položky v košíku
     * @param {string} itemId - ID položky košíku
     * @param {number} quantity - Nové množství
     * @returns {boolean} - Úspěch operace
     */
    const updateItemQuantity = (itemId, quantity) => {
        const index = cartItems.findIndex(item => item.id === itemId);
        if (index === -1) return false;
        
        if (quantity <= 0) {
            // Pokud je množství 0 nebo méně, položku odstraníme
            return removeItem(itemId);
        }
        
        cartItems[index].quantity = quantity;
        saveCart();
        return true;
    };
    
    /**
     * Odstraní položku z košíku
     * @param {string} itemId - ID položky košíku
     * @returns {boolean} - Úspěch operace
     */
    const removeItem = (itemId) => {
        const initialLength = cartItems.length;
        cartItems = cartItems.filter(item => item.id !== itemId);
        
        if (cartItems.length !== initialLength) {
            saveCart();
            return true;
        }
        return false;
    };
    
    /**
     * Vyčistí celý košík
     */
    const clearCart = () => {
        cartItems = [];
        saveCart();
    };
    
    /**
     * Získá všechny položky v košíku
     * @returns {Array} - Položky košíku
     */
    const getItems = () => {
        return [...cartItems];
    };
    
    /**
     * Vypočte celkovou cenu košíku
     * @param {string} targetCurrency - Měna, ve které chceme celkovou cenu
     * @param {number} exchangeRate - Směnný kurz pro převod
     * @returns {number} - Celková cena košíku
     */
    const getTotalPrice = (targetCurrency, exchangeRate) => {
        return cartItems.reduce((total, item) => {
            // Převedeme cenu na cílovou měnu
            const priceInTargetCurrency = Inventory.convertCurrency(
                item.price, 
                item.currency, 
                targetCurrency, 
                exchangeRate
            );
            
            return total + (priceInTargetCurrency * item.quantity);
        }, 0);
    };
    
    /**
     * Získá počet položek v košíku
     * @returns {number} - Počet položek
     */
    const getItemCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };
    
    /**
     * Získá data pro vytvoření účtenky
     * @param {string} location - Aktuální lokace
     * @returns {Object} - Data pro účtenku
     */
    const getReceiptData = (location) => {
        const settings = Storage.loadSettings();
        
        // Získáme všechny informace potřebné pro účtenku
        return {
            items: cartItems,
            location: location,
            totalCZK: getTotalPrice('czk', settings.exchangeRate),
            totalEUR: getTotalPrice('eur', settings.exchangeRate),
            timestamp: new Date(),
            exchangeRate: settings.exchangeRate
        };
    };
    
    /**
     * Uloží aktuální stav košíku do localStorage
     */
    const saveCart = () => {
        Storage.saveCart(cartItems);
    };
    
    return {
        init,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
        getItems,
        getTotalPrice,
        getItemCount,
        getReceiptData
    };
})();
