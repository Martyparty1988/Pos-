/**
 * Třída pro správu úložiště dat
 */
class Storage {
    constructor() {
        this.keys = {
            items: 'villa_pos_items',
            cart: 'villa_pos_cart',
            orders: 'villa_pos_orders',
            settings: 'villa_pos_settings',
            statistics: 'villa_pos_statistics'
        };
    }
    
    /**
     * Inicializace úložiště
     */
    initialize() {
        // Kontrola, zda existuje indexedDB nebo localStorage
        this.storageAvailable = this.isStorageAvailable();
        
        if (!this.storageAvailable) {
            console.error('Úložiště není dostupné. Data nebudou uchována mezi relacemi.');
        }
    }
    
    /**
     * Kontrola dostupnosti úložiště
     */
    isStorageAvailable() {
        try {
            const test = 'test_storage';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Získání dat z úložiště
     */
    getFromStorage(key) {
        if (!this.storageAvailable) return null;
        
        const storedData = localStorage.getItem(key);
        return storedData ? JSON.parse(storedData) : null;
    }
    
    /**
     * Uložení dat do úložiště
     */
    saveToStorage(key, data) {
        if (!this.storageAvailable) return;
        
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Chyba při ukládání dat:', e);
        }
    }
    
    /**
     * Odstranění dat z úložiště
     */
    removeFromStorage(key) {
        if (!this.storageAvailable) return;
        
        localStorage.removeItem(key);
    }
    
    /**
     * Získání položek inventáře
     */
    getItems() {
        return this.getFromStorage(this.keys.items) || [];
    }
    
    /**
     * Přidání položky do inventáře
     */
    addItem(item) {
        const items = this.getItems();
        items.push(item);
        this.saveToStorage(this.keys.items, items);
    }
    
    /**
     * Aktualizace položky v inventáři
     */
    updateItem(id, updatedItem) {
        const items = this.getItems();
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            items[index] = updatedItem;
            this.saveToStorage(this.keys.items, items);
        }
    }
    
    /**
     * Odstranění položky z inventáře
     */
    removeItem(id) {
        const items = this.getItems();
        const filteredItems = items.filter(item => item.id !== id);
        this.saveToStorage(this.keys.items, filteredItems);
    }
    
    /**
     * Získání košíku
     */
    getCart() {
        return this.getFromStorage(this.keys.cart) || [];
    }
    
    /**
     * Uložení košíku
     */
    saveCart(cart) {
        this.saveToStorage(this.keys.cart, cart);
    }
    
    /**
     * Získání objednávek
     */
    getOrders() {
        return this.getFromStorage(this.keys.orders) || [];
    }
    
    /**
     * Získání objednávky podle ID
     */
    getOrderById(id) {
        const orders = this.getOrders();
        return orders.find(order => order.id === id);
    }
    
    /**
     * Uložení objednávky
     */
    saveOrder(order) {
        const orders = this.getOrders();
        orders.push(order);
        this.saveToStorage(this.keys.orders, orders);
    }
    
    /**
     * Aktualizace objednávky
     */
    updateOrder(id, updatedOrder) {
        const orders = this.getOrders();
        const index = orders.findIndex(order => order.id === id);
        
        if (index !== -1) {
            orders[index] = updatedOrder;
            this.saveToStorage(this.keys.orders, orders);
        }
    }
    
    /**
     * Odstranění objednávky
     */
    removeOrder(id) {
        const orders = this.getOrders();
        const filteredOrders = orders.filter(order => order.id !== id);
        this.saveToStorage(this.keys.orders, filteredOrders);
    }
    
    /**
     * Získání nastavení
     */
    getSettings() {
        return this.getFromStorage(this.keys.settings) || null;
    }
    
    /**
     * Uložení nastavení
     */
    saveSettings(settings) {
        this.saveToStorage(this.keys.settings, settings);
    }
    
    /**
     * Získání statistik
     */
    getStatistics() {
        return this.getFromStorage(this.keys.statistics) || {
            daily: [],
            weekly: [],
            monthly: [],
            categories: {},
            popular: []
        };
    }
    
    /**
     * Přidání objednávky do statistik
     */
    addToStatistics(order) {
        const stats = this.getStatistics();
        const now = new Date();
        const dayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const weekStr = this.getWeekNumber(now);
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        
        // Aktualizace denních statistik
        this.updatePeriodStats(stats.daily, dayStr, order);
        
        // Aktualizace týdenních statistik
        this.updatePeriodStats(stats.weekly, weekStr, order);
        
        // Aktualizace měsíčních statistik
        this.updatePeriodStats(stats.monthly, monthStr, order);
        
        // Aktualizace statistik kategorií
        order.items.forEach(item => {
            const product = this.getItemById(item.id);
            if (product) {
                const category = product.category;
                if (!stats.categories[category]) {
                    stats.categories[category] = 0;
                }
                stats.categories[category] += item.price * item.quantity;
            }
        });
        
        // Aktualizace populárních položek
        order.items.forEach(item => {
            const existingItem = stats.popular.find(p => p.id === item.id);
            if (existingItem) {
                existingItem.quantity += item.quantity;
                existingItem.total += item.price * item.quantity;
            } else {
                stats.popular.push({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    total: item.price * item.quantity
                });
            }
        });
        
        // Seřazení populárních položek
        stats.popular.sort((a, b) => b.quantity - a.quantity);
        
        // Omezení na top 10
        stats.popular = stats.popular.slice(0, 10);
        
        this.saveToStorage(this.keys.statistics, stats);
    }
    
    /**
     * Aktualizace statistik za období
     */
    updatePeriodStats(periodStats, periodKey, order) {
        const existingPeriod = periodStats.find(p => p.period === periodKey);
        
        if (existingPeriod) {
            existingPeriod.totalSales += order.totals.total;
            existingPeriod.orderCount += 1;
            existingPeriod.items = existingPeriod.items || [];
            
            // Sloučení položek
            order.items.forEach(item => {
                const existingItem = existingPeriod.items.find(i => i.id === item.id);
                if (existingItem) {
                    existingItem.quantity += item.quantity;
                    existingItem.total += item.price * item.quantity;
                } else {
                    existingPeriod.items.push({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        total: item.price * item.quantity
                    });
                }
            });
        } else {
            periodStats.push({
                period: periodKey,
                totalSales: order.totals.total,
                orderCount: 1,
                items: order.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    total: item.price * item.quantity
                }))
            });
        }
        
        // Omezení na posledních 30 záznamů
        if (periodStats.length > 30) {
            periodStats.sort((a, b) => b.period.localeCompare(a.period));
            periodStats = periodStats.slice(0, 30);
        }
    }
    
    /**
     * Získání čísla týdne v roce
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }
    
    /**
     * Získání položky podle ID
     */
    getItemById(id) {
        const items = this.getItems();
        return items.find(item => item.id === id);
    }
    
    /**
     * Export všech dat
     */
    exportData() {
        const data = {
            items: this.getItems(),
            orders: this.getOrders(),
            statistics: this.getStatistics(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileName = `villa_pos_export_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
    }
    
    /**
     * Import dat ze souboru
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Kontrola struktury dat
            if (!data.items || !data.orders || !data.statistics) {
                throw new Error('Neplatný formát dat');
            }
            
            // Import dat
            this.saveToStorage(this.keys.items, data.items);
            this.saveToStorage(this.keys.orders, data.orders);
            this.saveToStorage(this.keys.statistics, data.statistics);
            
            if (data.settings) {
                this.saveToStorage(this.keys.settings, data.settings);
            }
            
            return true;
        } catch (e) {
            console.error('Chyba při importu dat:', e);
            return false;
        }
    }
    
    /**
     * Vymazání všech dat
     */
    clearAllData() {
        Object.values(this.keys).forEach(key => {
            this.removeFromStorage(key);
        });
    }
}