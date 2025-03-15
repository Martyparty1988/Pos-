// UI.js - Modul pro správu uživatelského rozhraní
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
        closeCartBtn: document.getElementById('close-cart'),
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
        cartPanel: document.querySelector('.cart-panel'),
        cartToggleBtn: document.getElementById('cart-toggle-btn'),
        cartOverlay: document.getElementById('cart-overlay'),
        cartCount: document.querySelector('.cart-count'),
    };

    // Pomocné proměnné
    let currentCategory = 'all';
    let currentDisplayCurrency = 'czk';
    let selectedProduct = null;
    
    // Inicializuje UI modul
    const init = () => {
        const settings = Storage.loadSettings();
        
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
            elements.darkModeToggle.checked = true;
        }
        
        elements.defaultCurrency.value = settings.defaultCurrency;
        currentDisplayCurrency = settings.defaultCurrency;
        elements.currencyToggle.checked = settings.defaultCurrency === 'eur';
        
        elements.exchangeRate.value = settings.exchangeRate;
        
        const currentLocation = Storage.loadCurrentLocation();
        elements.locationSelect.value = currentLocation;
        
        // Zobrazíme barevné záhlaví lokace
        updateLocationHeader(currentLocation);
        
        renderProducts();
        renderCart();
        updateCartCount();
        
        if (window.innerWidth <= 768) {
            hideCart();
        }
        
        setupEventListeners();
    };
    
    // Aktualizuje hlavičku lokace s barvou
    const updateLocationHeader = (locationId) => {
        const existingHeader = document.querySelector('.location-header');
        if (existingHeader) {
            existingHeader.remove();
        }
        
        const location = Inventory.getLocationById(locationId);
        if (!location) return;
        
        const header = document.createElement('div');
        header.className = 'location-header';
        header.textContent = location.name;
        
        header.style.backgroundColor = location.color;
        header.style.color = location.textColor;
        
        const posSection = document.getElementById('pos-section');
        posSection.insertBefore(header, posSection.firstChild);
    };
    
    // Nastaví event listenery
    const setupEventListeners = () => {
        // Filtrování podle kategorie
        elements.categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
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
                updateCartCount();
            }
        });
        
        // Tlačítko pro zavření košíku v mobilním rozložení
        if (elements.closeCartBtn) {
            elements.closeCartBtn.addEventListener('click', () => {
                hideCart();
            });
        }
        
        // Změna lokace
        elements.locationSelect.addEventListener('change', () => {
            const selectedLocation = elements.locationSelect.value;
            Storage.saveCurrentLocation(selectedLocation);
            updateLocationHeader(selectedLocation);
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
                elements.navTabs.forEach(t => t.classList.remove('active'));
                elements.contentSections.forEach(s => s.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(targetSection).classList.add('active');
                hideCart();
                if (targetSection === 'stats-section') {
                    Statistics.updateCharts();
                }
            });
        });
        
        // Tlačítko pro dokončení objednávky
        elements.checkoutBtn.addEventListener('click', () => {
            if (Cart.getItemCount() === 0) {
                alert('Košík je prázdný!');
                return;
            }
            hideCart();
            createReceipt();
        });
        
        // Nastavení - tmavý režim
        elements.darkModeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
            const settings = Storage.loadSettings();
            settings.darkMode = elements.darkModeToggle.checked;
            Storage.saveSettings(settings);
        });
        
        // Nastavení - výchozí měna
        elements.defaultCurrency.addEventListener('change', () => {
            const settings = Storage.loadSettings();
            settings.defaultCurrency = elements.defaultCurrency.value;
            Storage.saveSettings(settings);
            elements.currencyToggle.checked = settings.defaultCurrency === 'eur';
            currentDisplayCurrency = settings.defaultCurrency;
            renderCart();
        });
        
        // Nastavení - kurz
        elements.exchangeRate.addEventListener('change', () => {
            const settings = Storage.loadSettings();
            settings.exchangeRate = parseFloat(elements.exchangeRate.value);
            Storage.saveSettings(settings);
            renderCart();
        });
        
        // Reset dat
        elements.resetDataBtn.addEventListener('click', () => {
            if (confirm('Opravdu chcete vymazat všechna data? Tato akce je nevratná!')) {
                Storage.clearAllData();
                alert('Data byla vymazána. Aplikace bude obnovena.');
                location.reload();
            }
        });
        
        // Modaly - zavření
        elements.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.receiptModal.style.display = 'none';
                elements.productModal.style.display = 'none';
            });
        });
        
        elements.closeReceiptBtn.addEventListener('click', () => {
            elements.receiptModal.style.display = 'none';
        });
        
        // Tisk účtenky
        elements.printReceiptBtn.addEventListener('click', () => {
            const printWindow = window.open('', '_blank');
            printWindow.document.write('<html><head><title>Účtenka</title>');
            printWindow.document.write('<link rel="stylesheet" href="css/main.css">');
            printWindow.document.write('<link rel="stylesheet" href="css/locations.css">');
            printWindow.document.write('</head><body>');
            printWindow.document.write(elements.receiptContent.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        });
        
        // Uložení účtenky
        elements.saveReceiptBtn.addEventListener('click', () => {
            const receiptText = elements.receiptContent.innerText;
            const blob = new Blob([receiptText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `uctenka_${new Date().toISOString().replace(/:/g, '-')}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        });
        
        // City Tax výpočet
        elements.personsCount.addEventListener('input', updateCityTaxCalculation);
        elements.nightsCount.addEventListener('input', updateCityTaxCalculation);
        
        // Přidání speciálního produktu
        elements.addSpecialProductBtn.addEventListener('click', () => {
            if (!selectedProduct) return;
            
            let customData = null;
            
            if (selectedProduct.special === 'citytax') {
                const persons = parseInt(elements.personsCount.value);
                const nights = parseInt(elements.nightsCount.value);
                const totalPrice = persons * nights * 2;
                customData = { persons, nights, price: totalPrice };
            }
            
            if (selectedProduct.special === 'wellness') {
                const price = parseFloat(elements.wellnessPrice.value);
                customData = { price };
            }
            
            Cart.addItem(selectedProduct, 1, customData);
            elements.productModal.style.display = 'none';
            renderCart();
            updateCartCount();
            showCart();
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
        
        // Mobilní košík - tlačítka
        elements.cartToggleBtn.addEventListener('click', () => {
            toggleCart();
        });
        
        elements.cartOverlay.addEventListener('click', () => {
            hideCart();
        });
        
        // Sledování přidání do košíku
        elements.productContainer.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (productCard && !productCard.dataset.special) {
                setTimeout(() => {
                    updateCartCount();
                }, 100);
            }
        });
    };
    
    // Renderuje produkty podle kategorie a vyhledávání
    const renderProducts = (searchQuery = '') => {
        let products;
        
        if (searchQuery) {
            products = Inventory.searchProducts(searchQuery);
        } else {
            products = Inventory.getProductsByCategory(currentCategory);
        }
        
        elements.productContainer.innerHTML = '';
        
        if (products.length === 0) {
            elements.productContainer.innerHTML = '<div class="no-products">Žádné produkty nenalezeny</div>';
            return;
        }
        
        const settings = Storage.loadSettings();
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            if (product.special) {
                productCard.dataset.special = product.special;
            }
            
            let displayPrice;
            let displayCurrency;
            
            if (currentDisplayCurrency === product.currency) {
                displayPrice = product.price;
                displayCurrency = product.currency;
            } else {
                displayPrice = Inventory.convertCurrency(
                    product.price, product.currency, currentDisplayCurrency, settings.exchangeRate
                );
                displayCurrency = currentDisplayCurrency;
            }
            
            let priceHtml = Inventory.formatPrice(displayPrice, displayCurrency);
            
            if (product.special === 'wellness') {
                priceHtml = 'Vlastní cena';
            } else if (product.special === 'citytax') {
                priceHtml = '2 € / os. / noc';
            }
            
            const currencyClass = displayCurrency === 'czk' ? 'currency-czk' : 'currency-eur';
            const imgSrc = `${product.image}`;
            
            productCard.innerHTML = `
                <img src="${imgSrc}" alt="${product.name}" onerror="this.src='images/placeholder.png'">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price ${currencyClass}">${priceHtml}</div>
                </div>
            `;
            
            productCard.addEventListener('click', () => {
                if (product.special) {
                    openProductModal(product);
                } else {
                    productCard.classList.add('adding');
                    setTimeout(() => {
                        productCard.classList.remove('adding');
                    }, 500);
                    
                    Cart.addItem(product);
                    renderCart();
                    
                    if (window.innerWidth <= 768) {
                        showCart();
                    }
                }
            });
            
            elements.productContainer.appendChild(productCard);
        });
    };
    
    // Renderuje košík
    const renderCart = () => {
        const items = Cart.getItems();
        
        elements.cartItems.innerHTML = '';
        
        if (items.length === 0) {
            elements.cartItems.innerHTML = '<div class="empty-cart-message">Košík je prázdný</div>';
            elements.subtotalAmount.textContent = '0 Kč';
            return;
        }
        
        const settings = Storage.loadSettings();
        
        items.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            
            let displayPrice;
            let displayCurrency;
            
            if (currentDisplayCurrency === item.currency) {
                displayPrice = item.price;
                displayCurrency = item.currency;
            } else {
                displayPrice = Inventory.convertCurrency(
                    item.price, item.currency, currentDisplayCurrency, settings.exchangeRate
                );
                displayCurrency = currentDisplayCurrency;
            }
            
            const totalPrice = displayPrice * item.quantity;
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
            
            const decreaseBtn = cartItem.querySelector('.quantity-decrease');
            const increaseBtn = cartItem.querySelector('.quantity-increase');
            const removeBtn = cartItem.querySelector('.remove-item');
            
            decreaseBtn.addEventListener('click', () => {
                Cart.updateItemQuantity(item.id, item.quantity - 1);
                renderCart();
                updateCartCount();
            });
            
            increaseBtn.addEventListener('click', () => {
                Cart.updateItemQuantity(item.id, item.quantity + 1);
                renderCart();
                updateCartCount();
            });
            
            removeBtn.addEventListener('click', () => {
                Cart.removeItem(item.id);
                renderCart();
                updateCartCount();
            });
            
            elements.cartItems.appendChild(cartItem);
        });
        
        const totalPrice = Cart.getTotalPrice(currentDisplayCurrency, settings.exchangeRate);
        elements.subtotalAmount.textContent = Inventory.formatPrice(totalPrice, currentDisplayCurrency);
        updateCartCount();
    };
    
    // Aktualizuje počítadlo položek v košíku
    const updateCartCount = () => {
        const count = Cart.getItemCount();
        if (elements.cartCount) {
            elements.cartCount.textContent = count;
            elements.cartCount.style.display = count === 0 ? 'none' : 'flex';
        }
    };
    
    // Zobrazí košík na mobilních zařízeních
    const showCart = () => {
        elements.cartPanel.classList.add('show');
        elements.cartOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    };
    
    // Skryje košík na mobilních zařízeních
    const hideCart = () => {
        elements.cartPanel.classList.remove('show');
        elements.cartOverlay.classList.remove('show');
        document.body.style.overflow = '';
    };
    
    // Přepíná zobrazení košíku na mobilních zařízeních
    const toggleCart = () => {
        if (elements.cartPanel.classList.contains('show')) {
            hideCart();
        } else {
            showCart();
        }
    };
    
    // Otevře modální okno pro speciální produkt
    const openProductModal = (product) => {
        selectedProduct = product;
        elements.productModalTitle.textContent = product.name;
        elements.cityTaxInputs.style.display = 'none';
        elements.wellnessInputs.style.display = 'none';
        
        if (product.special === 'citytax') {
            elements.cityTaxInputs.style.display = 'block';
            updateCityTaxCalculation();
        } else if (product.special === 'wellness') {
            elements.wellnessInputs.style.display = 'block';
        }
        
        elements.productModal.style.display = 'block';
    };
    
    // Aktualizuje výpočet City Tax
    const updateCityTaxCalculation = () => {
        const persons = parseInt(elements.personsCount.value) || 1;
        const nights = parseInt(elements.nightsCount.value) || 1;
        const totalPrice = persons * nights * 2;
        elements.cityTaxResult.textContent = `Celkem: ${totalPrice} €`;
    };
    
    // Vytvoří účtenku
    const createReceipt = () => {
        const receiptData = Cart.getReceiptData(elements.locationSelect.value);
        const receiptHtml = generateReceiptHtml(receiptData);
        elements.receiptContent.innerHTML = receiptHtml;
        elements.receiptModal.style.display = 'block';
        Statistics.recordSale(receiptData);
        Cart.clearCart();
        renderCart();
    };
    
    // Generuje HTML pro účtenku
    const generateReceiptHtml = (data) => {
        const { items, location, totalCZK, totalEUR, timestamp, exchangeRate } = data;
        
        // Získáme informace o lokaci včetně barvy
        const locationInfo = Inventory.getLocationById(location);
        const locationName = locationInfo ? locationInfo.name : location;
        const locationColor = locationInfo ? locationInfo.color : '#f8f8f8';
        const textColor = locationInfo ? locationInfo.textColor : '#333333';
        
        const dateOptions = { 
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        };
        const formattedDate = new Date(timestamp).toLocaleDateString('cs-CZ', dateOptions);
        
        let itemsHtml = '';
        items.forEach(item => {
            let specialInfo = '';
            
            if (item.customData) {
                if (item.product.special === 'citytax') {
                    specialInfo = ` (${item.customData.persons} osob × ${item.customData.nights} nocí)`;
                }
            }
            
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
        
        return `
            <div class="receipt">
                <div class="receipt-header" style="background-color: ${locationColor}; color: ${textColor};">
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
                    <p><strong>Celkem CZK:</strong> ${totalCZK.toFixed(0)} Kč</p>
                    <p><strong>Celkem EUR:</strong> ${totalEUR.toFixed(2)} €</p>
                    <p>Kurz: 1 € = ${exchangeRate} Kč</p>
                </div>
                
                <div class="receipt-footer">
                    <p>Děkujeme za Váš nákup!</p>
                </div>
            </div>
        `;
    };
    
    // Exportuje statistiky do CSV
    const exportToCSV = () => {
        const sales = Storage.loadSales();
        
        if (sales.length === 0) {
            alert('Nejsou k dispozici žádná data pro export.');
            return;
        }
        
        let csv = 'Datum,Lokace,Celkem CZK,Celkem EUR,Počet položek\n';
        
        sales.forEach(sale => {
            const date = new Date(sale.timestamp).toLocaleDateString('cs-CZ');
            const locationName = Inventory.getLocations().find(loc => loc.id === sale.location)?.name || sale.location;
            
            csv += `${date},${locationName},${sale.totalCZK.toFixed(0)},${sale.totalEUR.toFixed(2)},${sale.items.length}\n`;
        });
        
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