/**
 * Storage.js - Modul pro správu lokálního úložiště
 * 
 * Tento modul poskytuje funkce pro ukládání a načítání dat z localStorage,
 * což umožňuje aplikaci fungovat offline.
 */

const Storage = (() => {
    // Klíče pro localStorage
    const KEYS = {
        CART: 'villa_pos_cart',
        SETTINGS: 'villa_pos_settings',
        SALES: 'villa_pos_sales',
        CURRENT_LOCATION: 'villa_pos_location'
    };

    // Výchozí nastavení
    const DEFAULT_SETTINGS = {
        darkMode: false,
        defaultCurrency: 'czk',
        exchangeRate: 25
    };

    /**
     * Uloží data do localStorage
     * @param {string} key - Klíč pro uložení
     * @param {any} data - Data k uložení
     */
    const saveData = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Chyba při ukládání dat:', error);
        }
    };

    /**
     * Načte data z localStorage
     * @param {string} key - Klíč k načtení
     * @param {any} defaultValue - Výchozí hodnota, pokud data neexistují
     * @returns {any} - Načtená data nebo výchozí hodnota
     */
    const loadData = (key, defaultValue = null) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Chyba při načítání dat:', error);
            return defaultValue;
        }
    };

    /**
     * Uloží košík do localStorage
     * @param {Array} cart - Pole položek košíku
     */
    const saveCart = (cart) => {
        saveData(KEYS.CART, cart);
    };

    /**
     * Načte košík z localStorage
     * @returns {Array} - Položky košíku nebo prázdné pole
     */
    const loadCart = () => {
        return loadData(KEYS.CART, []);
    };

    /**
     * Uloží nastavení do localStorage
     * @param {Object} settings - Objekt s nastavením
     */
    const saveSettings = (settings) => {
        saveData(KEYS.SETTINGS, settings);
    };

    /**
     * Načte nastavení z localStorage
     * @returns {Object} - Nastavení nebo výchozí hodnoty
     */
    const loadSettings = () => {
        return loadData(KEYS.SETTINGS, DEFAULT_SETTINGS);
    };

    /**
     * Uloží informace o prodeji
     * @param {Object} sale - Informace o prodeji
     */
    const saveSale = (sale) => {
        // Přidáme časové razítko
        sale.timestamp = new Date().toISOString();
        
        // Načteme existující prodeje
        const sales = loadData(KEYS.SALES, []);
        
        // Přidáme nový prodej
        sales.push(sale);
        
        // Uložíme zpět
        saveData(KEYS.SALES, sales);
    };

    /**
     * Načte všechny prodeje
     * @returns {Array} - Seznam prodejů
     */
    const loadSales = () => {
        return loadData(KEYS.SALES, []);
    };

    /**
     * Uloží aktuální lokaci
     * @param {string} location - ID lokace
     */
    const saveCurrentLocation = (location) => {
        saveData(KEYS.CURRENT_LOCATION, location);
    };

    /**
     * Načte aktuální lokaci
     * @returns {string} - ID aktuální lokace
     */
    const loadCurrentLocation = () => {
        return loadData(KEYS.CURRENT_LOCATION, 'ohyeah');
    };

    /**
     * Vymaže všechna data z localStorage
     */
    const clearAllData = () => {
        try {
            localStorage.removeItem(KEYS.CART);
            localStorage.removeItem(KEYS.SETTINGS);
            localStorage.removeItem(KEYS.SALES);
            localStorage.removeItem(KEYS.CURRENT_LOCATION);
        } catch (error) {
            console.error('Chyba při mazání dat:', error);
        }
    };

    return {
        saveCart,
        loadCart,
        saveSettings,
        loadSettings,
        saveSale,
        loadSales,
        saveCurrentLocation,
        loadCurrentLocation,
        clearAllData,
        DEFAULT_SETTINGS
    };
})();
