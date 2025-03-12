/**
 * UI.js - Modul pro správu uživatelského rozhraní
 * 
 * Tento modul poskytuje funkce pro aktualizaci a interakci s UI
 */

const UI = (() => {
    // Reference na DOM elementy
    const elements = {
        productContainer: document.getElementById('products-container'),
        cartItems: document.getElementById('cart-items'),
        subtotalAmount: document.getElementById('subtotal-amount'),
        searchInput: document.getElementById('search-input'),
        searchBtn: document.getElementById('search-btn'),
        categoryBtns: document.querySelectorAll('.category-btn'),
        locationSelect: document.getElementById('location-select'),
        clearCartBtn: document.getElementById('clear-cart'),
        checkoutBtn: document.getElementById('checkout-btn'),
        currencyToggle: document.getElementById('currency-toggle'),
        navTabs: document.querySelectorAll('.nav-tab'),
        contentSections: document.querySelectorAll('.content-section'),
        darkModeToggle: document.getElementById('dark-mode-toggle'),
        defaultCurrency: document.getElementById('default-currency'),
        exchangeRate: document.getElementById('exchange-rate'),
        resetDataBtn: document.getElementById('reset-data'),
        receiptModal: document.getElementById('receipt-modal'),
        receiptContent: document.getElementById('receipt-content'),
        printReceiptBtn: document.getElementById('print-receipt'),
        saveReceiptBtn: document.getElementById('save-receipt'),
        closeReceiptBtn: document.getElementById('close-receipt'),
        productModal: document.getElementById('product-modal'),
        productModalTitle: document.getElementById('product-modal-title'),
        cityTaxInputs: document.getElementById('city-tax-inputs'),
        wellnessInputs: document.getElementById('wellness-inputs'),
        personsCount: document.getElementById('persons-count'),
        nightsCount: document.getElementById('nights-count'),
        cityTaxResult: document.getElementById('city-tax-result'),
        wellnessPrice: document.getElementById('wellness-price'),
        addSpecialProductBtn: document.getElementById('add-special-product'),
        cancelSpecialProductBtn: document.getElementById('cancel-special-product'),
        closeModalBtns: document.querySelectorAll('.close'),
        todaySales: document.getElementById('today-sales'),
        weekSales: document.getElementById('week-sales'),
        monthSales: document.getElementById('month-sales'),
        transactionsCount: document.getElementById('transactions-count'),
        exportPdfBtn: document.getElementById('export-pdf'),
        exportCsvBtn: document.getElementById('export-csv'),
    };

    // Pomocné proměnné
    let currentCategory = 'all';
    let currentDisplayCurrency = 'czk';
    let selectedProduct = null;
    
    /**
     * Inicializuje UI modul
     */
    const init = () => {
        // Načteme nastavení
        const settings = Storage.loadSettings();
        
        // Nastavíme tmavý režim, pokud je uložen
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
            elements.darkModeToggle.checked = true;
        }
        
        // Nastavíme výchozí měnu
        elements.defaultCurrency.value = settings.defaultCurrency;
        currentDisplayCurrency = settings.defaultCurrency;
        elements.currencyToggle.checked = settings.defaultCurrency === 'eur';
        
        // Nastavíme kurz
        elements.exchangeRate.value = settings.exchangeRate;
        
        // Načteme aktuální lokaci
        const currentLocation = Storage.loadCurrentLocation();
        elements.locationSelect.value = currentLocation;
        
        // Zobrazíme produkty
        renderProducts();
        
        // Zobrazíme košík
        renderCart();
        
        // Přidáme event listenery
        setupEventListeners();
    };
    
    /**
     * Nastaví event listenery
     */
    const setupEventListeners = () => {
        // Filtrování podle kategorie
        elements.categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Odebereme aktivní třídu ze všech tlačítek
                elements.categoryBtns.forEach(b => b.classList.remove('active'));
                
                // Přidáme aktivní třídu k vybranému tlačítku
                btn.classList.add('active');
                
                // Získáme kategorii a renderujeme produkty
                currentCategory = btn.dataset.category;
                renderProducts();
            });
        });
        
        // Vyhledávání
        elements.searchBtn.addEventListener('click', () => {
            renderProducts(elements.searchInput.value);
        });
        
        elements.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                renderProducts(elements.searchInput.value);
            }
        });
        
        // Vyčištění košíku
        elements.clearCartBtn.addEventListener('click', () => {
            if (confirm('Opravdu chcete vyčistit košík?')) {
                Cart.clearCart();
                renderCart();
            }
        });
        
        // Změna lokace
        elements.locationSelect.addEventListener('change', () => {
            Storage.saveCurrentLocation(elements.locationSelect.value);
        });
        
        // Přepínání měny
        elements.currencyToggle.addEventListener('change', () => {
            currentDisplayCurrency = elements.currencyToggle.checked ? 'eur' : 'czk';
            renderCart();
        });
        
        // Navigační taby
        elements.navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetSection = tab.dataset.target;
                
                // Odebereme aktivní třídu ze všech tabů a sekcí
                elements.navTabs.forEach(t => t.classList.remove('active'));
                elements.contentSections.forEach(s => s.classList.remove('active'));
                
                // Přidáme aktivní třídu k vybranému tabu a sekci
                tab.classList.add('active');
                document.getElementById(targetSection).classList.add('active');
                
                // Pokud jsme v sekci statistik, aktualizujeme grafy
                if (targetSection === 'stats-section') {
                    Statistics.updateCharts();
                }
            });
        });
        
        // Tlačítko pro dokončení objednávky
        elements.checkoutBtn.addEventListener('click', () => {
            // Pokud je košík prázdný, netvoříme účtenku
            if (Cart.getItemCount() === 0) {
                alert('Košík je prázdný!');
                return;
            }
            
            // Vytvoříme účtenku
            createReceipt();
        });
        
        // Nastavení
        elements.darkModeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
            
            // Uložíme nastavení
            const settings = Storage.loadSettings();
            settings.darkMode = elements.darkModeToggle.checked;
            Storage.saveSettings(settings);
        });
        
        elements.defaultCurrency.addEventListener('change', () => {
            const settings = Storage.loadSettings();
            settings.defaultCurrency = elements.defaultCurrency.value;
            Storage.saveSettings(settings);
            
            // Aktualizujeme zobrazovanou měnu
            elements.currencyToggle.checked = settings.defaultCurrency === 'eur';
            currentDisplayCurrency = settings.defaultCurrency;
            renderCart();
        });
        
        elements.exchangeRate.addEventListener('change', () => {
            const settings = Storage.loadSettings();
            settings.exchangeRate = parseFloat(elements.exchangeRate.value);
            Storage.saveSettings(settings);
            
            // Aktualizujeme zobrazení ceny
            renderCart();
        });
        
        elements.resetDataBtn.addEventListener('click', () => {
            if (confirm('Opravdu chcete vymazat všechna data? Tato akce je nevratná!')) {
                Storage.clearAllData();
                alert('Data byla vymazána. Aplikace bude obnovena.');
                location.reload();
            }
        });
        
        // Modaly
        elements.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.receiptModal.style.display = 'none';
                elements.productModal.style.display = 'none';
            });
        });
        
        elements.closeReceiptBtn.addEventListener('click', () => {
            elements.receiptModal.style.display = 'none';
        });
        
        elements.printReceiptBtn.addEventListener('click', () => {
            // Vytiskneme obsah účtenky
            const printWindow = window.open('', '_blank');
            printWindow.document.write('<html><head><title>Účtenka</title>');
            printWindow.document.write('<link rel="stylesheet" href="css/main.css">');
            printWindow.document.write('</head><body>');
            printWindow.document.write(elements.receiptContent.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        });
        
        elements.saveReceiptBtn.addEventListener('click', () => {
            // Uložíme obsah účtenky jako textový soubor
            const receiptText = elements.receiptContent.innerText;
            const blob = new Blob([receiptText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `uctenka_${new Date().toISOString().replace(/:/g, '-')}.txt`;
            a.click();
            
            URL.revokeObjectURL(url);
        });
        
        // Speciální produkty
        elements.personsCount.addEventListener('input', updateCityTaxCalculation);
        elements.nightsCount.addEventListener('input', updateCityTaxCalculation);
        
        elements.addSpecialProductBtn.addEventListener('click', () => {
            if (!selectedProduct) return;
            
            let customData = null;
            
            // Pro City Tax
            if (selectedProduct.special === 'citytax') {
                const persons = parseInt(elements.personsCount.value);
                const nights = parseInt(elements.nightsCount.value);
                const totalPrice = persons * nights * 2; // 2€ za osobu na noc
                
                customData = {
                    persons,
                    nights,
                    price: totalPrice
                };
            }
            
            // Pro Wellness balíček
            if (selectedProduct.special === 'wellness') {
                const price = parseFloat(elements.wellnessPrice.value);
                
                customData = {
                    price
                };
            }
            
            // Přidáme produkt do košíku
            Cart.addItem(selectedProduct, 1, customData);
            
            // Zavřeme modal
            elements.productModal.style.display = 'none';
            
            // Aktualizujeme košík
            renderCart();
        });
        
        elements.cancelSpecialProductBtn.addEventListener('click', () => {
            elements.productModal.style.display = 'none';
        });
        
        // Export dat
        elements.exportPdfBtn.addEventListener('click', () => {
            alert('Funkce exportu do PDF bude implementována v budoucí verzi.');
        });
        
        elements.exportCsvBtn.addEventListener('click', () => {
            exportToCSV();
        });
    };
    
    /**
     * Renderuje produkty podle kategorie a vyhledávání
     * @param {string} searchQuery - Vyhledávací dotaz
     */
    const renderProducts = (searchQuery = '') => {
        // Získáme produkty
        let products;
        
        if (searchQuery) {
            products = Inventory.searchProducts(searchQuery);
        } else {
            products = Inventory.getProductsByCategory(currentCategory);
        }
        
        // Vyčistíme kontejner
        elements.productContainer.innerHTML = '';
        
        if (products.length === 0) {
            elements.productContainer.innerHTML = '<div class="no-products">Žádné produkty nenalezeny</div>';
            return;
        }
        
        // Získáme nastavení pro převod měn
        const settings = Storage.loadSettings();
        
        // Vykreslíme každý produkt
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            // Zobrazíme cenu ve správné měně
            let displayPrice;
            let displayCurrency;
            
            if (currentDisplayCurrency === product.currency) {
                displayPrice = product.price;
                displayCurrency = product.currency;
            } else {
                displayPrice = Inventory.convertCurrency(
                    product.price, 
                    product.currency, 
                    currentDisplayCurrency, 
                    settings.exchangeRate
                );
                displayCurrency = currentDisplayCurrency;
            }
            
            let priceHtml = Inventory.formatPrice(displayPrice, displayCurrency);
            
            // Pro speciální produkty upravíme zobrazení ceny
            if (product.special === 'wellness') {
                priceHtml = 'Vlastní cena';
            } else if (product.special === 'citytax') {
                priceHtml = '2 € / os. / noc';
            }
            
            // U cen přidáme třídu podle měny
            const currencyClass = displayCurrency === 'czk' ? 'currency-czk' : 'currency-eur';
            
            // Fallback obrázek, pokud není k dispozici
            const imgSrc = `${product.image}`;
            
            productCard.innerHTML = `
                <img src="${imgSrc}" alt="${product.name}" onerror="this.src='images/placeholder.png'">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price ${currencyClass}">${priceHtml}</div>
                </div>
            `;
            
            // Přidáme event listener pro přidání do košíku
            productCard.addEventListener('click', () => {
                // Pro speciální produkty otevřeme modal
                if (product.special) {
                    openProductModal(product);
                } else {
                    // Animace přidání do košíku
                    productCard.classList.add('adding');
                    setTimeout(() => {
                        productCard.classList.remove('adding');
                    }, 500);
                    
                    // Přidáme do košíku
                    Cart.addItem(product);
                    renderCart();
                }
            });
            
            elements.productContainer.appendChild(productCard);
        });
    };
    
    /**
     * Renderuje košík
     */
    const renderCart = () => {
        const items = Cart.getItems();
        
        // Vyčistíme kontejner
        elements.cartItems.innerHTML = '';
        
        // Pokud je košík prázdný, zobrazíme zprávu
        if (items.length === 0) {
            elements.cartItems.innerHTML = '<div class="empty-cart-message">Košík je prázdný</div>';
            elements.subtotalAmount.textContent = '0 Kč';
            return;
        }
        
        // Získáme nastavení pro převod měn
        const settings = Storage.loadSettings();
        
        // Vykreslíme každou položku košíku
        items.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            
            // Zobrazíme cenu ve správné měně
            let displayPrice;
            let displayCurrency;
            
            if (currentDisplayCurrency === item.currency) {
                displayPrice = item.price;
                displayCurrency = item.currency;
            } else {
                displayPrice = Inventory.convertCurrency(
                    item.price, 
                    item.currency, 
                    currentDisplayCurrency, 
                    settings.exchangeRate
                );
                displayCurrency = currentDisplayCurrency;
            }
            
            // Spočítáme celkovou cenu položky
            const totalPrice = displayPrice * item.quantity;
            
            // Vytvoříme speciální text pro položky se speciálními daty
            let specialText = '';
            
            if (item.customData) {
                if (item.product.special === 'citytax') {
                    specialText = `<br>${item.customData.persons} osob × ${item.customData.nights} nocí`;
                } else if (item.product.special === 'wellness') {
                    specialText = '<br>Vlastní cena';
                }
            }
            
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.product.name}${specialText}</div>
                    <div class="cart-item-price">${Inventory.formatPrice(totalPrice, displayCurrency)}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-quantity">
                        <button class="quantity-decrease">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-increase">+</button>
                    </div>
                    <button class="remove-item"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // Přidáme event listenery pro tlačítka
            const decreaseBtn = cartItem.querySelector('.quantity-decrease');
            const increaseBtn = cartItem.querySelector('.quantity-increase');
            const removeBtn = cartItem.querySelector('.remove-item');
            
            decreaseBtn.addEventListener('click', () => {
                Cart.updateItemQuantity(item.id, item.quantity - 1);
                renderCart();
            });
            
            increaseBtn.addEventListener('click', () => {
                Cart.updateItemQuantity(item.id, item.quantity + 1);
                renderCart();
            });
            
            removeBtn.addEventListener('click', () => {
                Cart.removeItem(item.id);
                renderCart();
            });
            
            elements.cartItems.appendChild(cartItem);
        });
        
        // Aktualizujeme mezisoučet
        const totalPrice = Cart.getTotalPrice(currentDisplayCurrency, settings.exchangeRate);
        elements.subtotalAmount.textContent = Inventory.formatPrice(totalPrice, currentDisplayCurrency);
    };
    
    /**
     * Otevře modální okno pro speciální produkt
     * @param {Object} product - Produkt
     */
    const openProductModal = (product) => {
        selectedProduct = product;
        
        // Nastavíme titulek
        elements.productModalTitle.textContent = product.name;
        
        // Skryjeme všechny bloky pro speciální vstupy
        elements.cityTaxInputs.style.display = 'none';
        elements.wellnessInputs.style.display = 'none';
        
        // Zobrazíme správný blok podle typu produktu
        if (product.special === 'citytax') {
            elements.cityTaxInputs.style.display = 'block';
            updateCityTaxCalculation();
        } else if (product.special === 'wellness') {
            elements.wellnessInputs.style.display = 'block';
        }
        
        // Zobrazíme modální okno
        elements.productModal.style.display = 'block';
    };
    
    /**
     * Aktualizuje výpočet City Tax
     */
    const updateCityTaxCalculation = () => {
        const persons = parseInt(elements.personsCount.value) || 1;
        const nights = parseInt(elements.nightsCount.value) || 1;
        const totalPrice = persons * nights * 2; // 2€ za osobu na noc
        
        elements.cityTaxResult.textContent = `Celkem: ${totalPrice} €`;
    };
    
    /**
     * Vytvoří účtenku
     */
    const createReceipt = () => {
        // Získáme data pro účtenku
        const receiptData = Cart.getReceiptData(elements.locationSelect.value);
        
        // Vytvoříme HTML pro účtenku
        const receiptHtml = generateReceiptHtml(receiptData);
        
        // Zobrazíme účtenku
        elements.receiptContent.innerHTML = receiptHtml;
        elements.receiptModal.style.display = 'block';
        
        // Uložíme prodej do statistik
        Statistics.recordSale(receiptData);
        
        // Vyčistíme košík
        Cart.clearCart();
        
        // Aktualizujeme košík
        renderCart();
    };
    
    /**
     * Generuje HTML pro účtenku
     * @param {Object} data - Data pro účtenku
     * @returns {string} - HTML účtenky
     */
    const generateReceiptHtml = (data) => {
        const { items, location, totalCZK, totalEUR, timestamp, exchangeRate } = data;
        
        // Najdeme název lokace
        const locationName = Inventory.getLocations().find(loc => loc.id === location)?.name || location;
        
        // Formátujeme datum
        const dateOptions = { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        const formattedDate = new Date(timestamp).toLocaleDateString('cs-CZ', dateOptions);
        
        // Generujeme řádky položek
        let itemsHtml = '';
        items.forEach(item => {
            let specialInfo = '';
            
            // Pro speciální produkty přidáme info
            if (item.customData) {
                if (item.product.special === 'citytax') {
                    specialInfo = ` (${item.customData.persons} osob × ${item.customData.nights} nocí)`;
                }
            }
            
            // Formátujeme cenu
            const formattedPrice = Inventory.formatPrice(item.price, item.currency);
            const totalItemPrice = Inventory.formatPrice(item.price * item.quantity, item.currency);
            
            itemsHtml += `
                <tr>
                    <td>${item.product.name}${specialInfo}</td>
                    <td>${item.quantity}×</td>
                    <td>${formattedPrice}</td>
                    <td>${totalItemPrice}</td>
                </tr>
            `;
        });
        
        // Generujeme kompletní HTML účtenky
        return `
            <div class="receipt">
                <div class="receipt-header">
                    <h3>Villa POS Systém</h3>
                    <p>Lokace: ${locationName}</p>
                    <p>Datum: ${formattedDate}</p>
                </div>
                
                <div class="receipt-items">
                    <table>
                        <thead>
                            <tr>
                                <th>Položka</th>
                                <th>Množství</th>
                                <th>Cena/ks</th>
                                <th>Celkem</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                </div>
                
                <div class="receipt-summary">
                    <p>Celkem CZK: ${totalCZK.toFixed(0)} Kč</p>
                    <p>Celkem EUR: ${totalEUR.toFixed(2)} €</p>
                    <p>Kurz: 1 € = ${exchangeRate} Kč</p>
                </div>
                
                <div class="receipt-footer">
                    <p>Děkujeme za Váš nákup!</p>
                </div>
            </div>
        `;
    };
    
    /**
     * Exportuje statistiky do CSV
     */
    const exportToCSV = () => {
        const sales = Storage.loadSales();
        
        if (sales.length === 0) {
            alert('Nejsou k dispozici žádná data pro export.');
            return;
        }
        
        // Vytvoříme hlavičku CSV
        let csv = 'Datum,Lokace,Celkem CZK,Celkem EUR,Počet položek\n';
        
        // Přidáme řádky
        sales.forEach(sale => {
            const date = new Date(sale.timestamp).toLocaleDateString('cs-CZ');
            const locationName = Inventory.getLocations().find(loc => loc.id === sale.location)?.name || sale.location;
            
            csv += `${date},${locationName},${sale.totalCZK.toFixed(0)},${sale.totalEUR.toFixed(2)},${sale.items.length}\n`;
        });
        
        // Vytvoříme soubor a stáhneme ho
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `statistiky_${new Date().toLocaleDateString('cs-CZ')}.csv`;
        a.click();
        
        URL.revokeObjectURL(url);
    };
    
    return {
        init,
        renderProducts,
        renderCart
    };
})();
