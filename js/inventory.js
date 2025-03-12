/**
 * Inventory.js - Modul pro správu inventáře
 * 
 * Tento modul obsahuje definice všech produktů a kategorie,
 * které jsou dostupné v rámci POS systému.
 */

const Inventory = (() => {
    // Definice produktů - hardcoded pro offline použití
    const products = [
        // Nealko nápoje
        {
            id: 'cocacola',
            name: 'Coca-Cola',
            price: 32,
            currency: 'czk',
            category: 'nealko',
            image: 'images/cocacola.png'
        },
        {
            id: 'fanta',
            name: 'Fanta',
            price: 32,
            currency: 'czk',
            category: 'nealko',
            image: 'images/fanta.png'
        },
        {
            id: 'sprite',
            name: 'Sprite',
            price: 32,
            currency: 'czk',
            category: 'nealko',
            image: 'images/sprite.png'
        },
        {
            id: 'redbull',
            name: 'Red Bull',
            price: 59,
            currency: 'czk',
            category: 'nealko',
            image: 'images/redbull.png'
        },
        
        // Alkoholické nápoje
        {
            id: 'malibu',
            name: 'Malibu',
            price: 99,
            currency: 'czk',
            category: 'alkohol',
            image: 'images/malibu.png'
        },
        {
            id: 'jackcola',
            name: 'Jack s colou',
            price: 99,
            currency: 'czk',
            category: 'alkohol',
            image: 'images/jackcola.png'
        },
        {
            id: 'moscowmule',
            name: 'Moscow Mule',
            price: 99,
            currency: 'czk',
            category: 'alkohol',
            image: 'images/moscowmule.png'
        },
        {
            id: 'gintonic',
            name: 'Gin-Tonic',
            price: 99,
            currency: 'czk',
            category: 'alkohol',
            image: 'images/gintonic.png'
        },
        {
            id: 'mojito',
            name: 'Mojito',
            price: 99,
            currency: 'czk',
            category: 'alkohol',
            image: 'images/mojito.png'
        },
        {
            id: 'prosecco',
            name: 'Prosecco',
            price: 390,
            currency: 'czk',
            category: 'alkohol',
            image: 'images/prosecco.png'
        },
        
        // Piva
        {
            id: 'budvar',
            name: 'Budvar',
            price: 59,
            currency: 'czk',
            category: 'pivo',
            image: 'images/budvar.png'
        },
        {
            id: 'sud30',
            name: 'Sud 30l',
            price: 125,
            currency: 'eur',
            category: 'pivo',
            image: 'images/sud30.png'
        },
        {
            id: 'sud50',
            name: 'Sud 50l',
            price: 175,
            currency: 'eur',
            category: 'pivo',
            image: 'images/sud50.png'
        },
        
        // Relaxační služby
        {
            id: 'wellness',
            name: 'Wellness balíček',
            price: 0,
            currency: 'eur',
            category: 'relax',
            image: 'images/wellness.png',
            special: 'wellness'
        },
        {
            id: 'plyny',
            name: 'Plyny do ohňových stolů',
            price: 12,
            currency: 'eur',
            category: 'relax',
            image: 'images/plyny.png'
        },
        {
            id: 'citytax',
            name: 'City Tax',
            price: 0,
            currency: 'eur',
            category: 'relax',
            image: 'images/citytax.png',
            special: 'citytax'
        }
    ];

    // Kategorie produktů
    const categories = [
        {
            id: 'all',
            name: 'Vše'
        },
        {
            id: 'nealko',
            name: 'Nealko'
        },
        {
            id: 'alkohol',
            name: 'Alkohol'
        },
        {
            id: 'pivo',
            name: 'Pivo'
        },
        {
            id: 'relax',
            name: 'Relax'
        }
    ];

    // Lokace
    const locations = [
        {
            id: 'ohyeah',
            name: 'Oh Yeah'
        },
        {
            id: 'amazingpool',
            name: 'Amazing Pool'
        },
        {
            id: 'littlecastle',
            name: 'Little Castle'
        }
    ];

    /**
     * Získá všechny produkty
     * @returns {Array} - Seznam všech produktů
     */
    const getAllProducts = () => {
        return products;
    };

    /**
     * Získá produkt podle ID
     * @param {string} id - ID produktu
     * @returns {Object|null} - Produkt nebo null
     */
    const getProductById = (id) => {
        return products.find(product => product.id === id) || null;
    };

    /**
     * Filtruje produkty podle kategorie
     * @param {string} categoryId - ID kategorie, 'all' pro všechny produkty
     * @returns {Array} - Filtrovaný seznam produktů
     */
    const getProductsByCategory = (categoryId) => {
        if (categoryId === 'all') {
            return products;
        }
        return products.filter(product => product.category === categoryId);
    };

    /**
     * Vyhledá produkty podle názvu
     * @param {string} query - Vyhledávací dotaz
     * @returns {Array} - Filtrovaný seznam produktů odpovídajících dotazu
     */
    const searchProducts = (query) => {
        const searchLower = query.toLowerCase();
        return products.filter(product => 
            product.name.toLowerCase().includes(searchLower) || 
            product.category.toLowerCase().includes(searchLower)
        );
    };

    /**
     * Získá všechny kategorie
     * @returns {Array} - Seznam všech kategorií
     */
    const getCategories = () => {
        return categories;
    };

    /**
     * Získá všechny lokace
     * @returns {Array} - Seznam všech lokací
     */
    const getLocations = () => {
        return locations;
    };

    /**
     * Převede cenu produktu na jinou měnu
     * @param {number} price - Cena produktu
     * @param {string} fromCurrency - Původní měna
     * @param {string} toCurrency - Cílová měna
     * @param {number} exchangeRate - Směnný kurz EUR/CZK
     * @returns {number} - Přepočtená cena
     */
    const convertCurrency = (price, fromCurrency, toCurrency, exchangeRate) => {
        if (fromCurrency === toCurrency) {
            return price;
        }
        
        if (fromCurrency === 'czk' && toCurrency === 'eur') {
            return +(price / exchangeRate).toFixed(2);
        }
        
        if (fromCurrency === 'eur' && toCurrency === 'czk') {
            return +(price * exchangeRate).toFixed(0);
        }
        
        return price;
    };

    /**
     * Formátuje cenu s měnou
     * @param {number} price - Cena
     * @param {string} currency - Měna
     * @returns {string} - Formátovaná cena s měnou
     */
    const formatPrice = (price, currency) => {
        if (currency === 'czk') {
            return `${price} Kč`;
        } else {
            return `${price} €`;
        }
    };

    return {
        getAllProducts,
        getProductById,
        getProductsByCategory,
        searchProducts,
        getCategories,
        getLocations,
        convertCurrency,
        formatPrice
    };
})();
