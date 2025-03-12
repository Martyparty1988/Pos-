/**
 * App.js - Hlavní aplikační modul
 * 
 * Tento modul inicializuje aplikaci a propojuje všechny moduly.
 */

// Inicializace aplikace po načtení DOMu
document.addEventListener('DOMContentLoaded', () => {
    // Inicializujeme košík
    Cart.init();
    
    // Inicializujeme UI
    UI.init();
    
    // Kontrola, zda máme obrázky
    checkImages();
});

/**
 * Kontroluje, zda jsou dostupné obrázky produktů
 * Pro offline použití musíme mít placeholdery
 */
function checkImages() {
    // Získáme všechny produkty
    const products = Inventory.getAllProducts();
    
    // Pro každý produkt ověříme, zda máme obrázek
    products.forEach(product => {
        const img = new Image();
        img.onerror = () => {
            console.warn(`Obrázek pro produkt "${product.name}" není dostupný.`);
        };
        img.src = product.image;
    });
}

/**
 * Fallback funkce pro generování placeholderů
 * Volá se, když se nepodaří načíst obrázek produktu
 */
function generatePlaceholder(productName) {
    // Vytvoříme canvas
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    
    // Získáme kontext
    const ctx = canvas.getContext('2d');
    
    // Vyplníme pozadí
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, 200, 200);
    
    // Přidáme název produktu
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(productName, 100, 100);
    
    // Vrátíme data URL
    return canvas.toDataURL('image/png');
}

// Přidáme Service Worker pro lepší offline podporu (pokud je prohlížeč podporuje)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('Service Worker registrován úspěšně:', registration.scope);
        }).catch(error => {
            console.log('Registrace Service Workeru selhala:', error);
        });
    });
}
