/**
 * ui.js
 * Modul pro správu uživatelského rozhraní
 */

const UI = {
    // DOM elementy
    DOMElements: {
        productsGrid: document.getElementById('products-grid'),
        cartItems: document.getElementById('cart-items'),
        subtotalDisplay: document.getElementById('subtotal'),
        totalDisplay: document.getElementById('total'),
        searchInput: document.getElementById('search-input'),
        filterButtons: document.querySelectorAll('.filter-btn'),
        locationButtons: document.querySelectorAll('.location-btn'),
        themeToggle: document.getElementById('theme-toggle'),
        checkoutBtn: document.getElementById('checkout-btn'),
        clearCartBtn: document.getElementById('clear-cart'),
        
        // Modální okna
        statsModal: document.getElementById('stats-modal'),
        settingsModal: document.getElementById('settings-modal'),
        receiptModal: document.getElementById('receipt-modal'),
        customPriceModal: document.getElementById('custom-price-modal'),
        cityTaxModal: document.getElementById('city-tax-modal'),
        
        // Tlačítka pro otevření modálních oken
        statsBtn: document.getElementById('stats-btn'),
        settingsBtn: document.getElementById('settings-btn'),
        
        // Tlačítka pro zavření modálních oken
        closeModalButtons: document.querySelectorAll('.close-modal'),
        
        // Nastavení
        defaultLocationSelect: document.getElementById('default-location'),
        currencyDisplaySelect: document.getElementById('currency-display'),
        animationsToggle: document.getElementById('animations-toggle'),
        clearDataBtn: document.getElementById('clear-data'),
        exportDataBtn: document.getElementById('export-data'),
        
        // Účtenka
        receiptContainer: document.getElementById('receipt-container'),
        printReceiptBtn: document.getElementById('print-receipt'),
        saveReceiptBtn: document.getElementById('save-receipt'),
        completeSaleBtn: document.getElementById('complete-sale'),
        
        // Vlastní cena
        customPriceInput: document.getElementById('custom-price-input'),
        customPriceProductName: document.getElementById('custom-price-product-name'),
        applyCustomPriceBtn: document.getElementById('apply-custom-price'),
        
        // City Tax
        personsCountInput: document.getElementById('persons-count'),
        nightsCountInput: document.getElementById('nights-count'),
        cityTaxTotalDisplay: document.getElementById('city-tax-total'),
        applyCityTaxBtn: document.getElementById('apply-city-tax'),
        
        // Notifikace
        notification: document.getElementById('notification')
    },
    
    /**
     * Inicializace UI
     */
    init: function() {
        this.renderProducts();
        this.updateCart();
        this.applySettings();
        this.setupEventListeners();
    },
    
    /**
     * Nastavení posluchačů událostí
     */
    setupEventListeners: function() {
        // Vyhledávání produktů
        this.DOMElements.searchInput.addEventListener('input', this.handleSearch.bind(this));
        
        // Filtrování produktů
        this.DOMElements.filterButtons.forEach(btn => {
            btn.addEventListener('click', this.handleFilter.bind(this));
        });
        
        // Přepínání lokací
        this.DOMElements.locationButtons.forEach(btn => {
            btn.addEventListener('click', this.handleLocationChange.bind(this));
        });
        
        // Přepínání tmavého režimu
        this.DOMElements.themeToggle.addEventListener('click', this.toggleDarkMode.bind(this));
        
        // Otevření modálních oken
        this.DOMElements.statsBtn.addEventListener('click', () => this.openModal('stats'));
        this.DOMElements.settingsBtn.addEventListener('click', () => this.openModal('settings'));
        this.DOMElements.checkoutBtn.addEventListener('click', () => this.openModal('receipt'));
        
        // Zavření modálních oken
        this.DOMElements.closeModalButtons.forEach(btn => {
            btn.addEventListener('click', this.closeModal.bind(this));
        });
        
        // Vymazání košíku
        this.DOMElements.clearCartBtn.addEventListener('click', () => {
            if (Cart.isEmpty()) {
                this.showNotification('Košík je již prázdný', 'info');
                return;
            }
            
            if (confirm('Opravdu chcete vyprázdnit košík?')) {
                Cart.clearCart();
                this.updateCart();
                this.showNotification('Košík byl vyprázdněn', 'success');
            }
        });
        
        // Nastavení
        this.DOMElements.defaultLocationSelect.addEventListener('change', this.saveSettings.bind(this));
        this.DOMElements.currencyDisplaySelect.addEventListener('change', this.saveSettings.bind(this));
        this.DOMElements.animationsToggle.addEventListener('change', this.saveSettings.bind(this));
        this.DOMElements.clearDataBtn.addEventListener('click', this.handleClearData.bind(this));
        this.DOMElements.exportDataBtn.addEventListener('click', this.handleExportData.bind(this));
        
        // Účtenka
        this.DOMElements.printReceiptBtn.addEventListener('click', this.printReceipt.bind(this));
        this.DOMElements.saveReceiptBtn.addEventListener('click', this.saveReceipt.bind(this));
        this.DOMElements.completeSaleBtn.addEventListener('click', this.completeSale.bind(this));
        
        // Vlastní cena
        this.DOMElements.applyCustomPriceBtn.addEventListener('click', this.applyCustomPrice.bind(this));
        
        // City Tax
        this.DOMElements.personsCountInput.addEventListener('input', this.updateCityTaxTotal.bind(this));
        this.DOMElements.nightsCountInput.addEventListener('input', this.updateCityTaxTotal.bind(this));
        this.DOMElements.applyCityTaxBtn.addEventListener('click', this.applyCityTax.bind(this));
        
        // Ripple efekt pro tlačítka
        document.querySelectorAll('.primary-btn, .secondary-btn, .danger-btn, .success-btn, .filter-btn, .location-btn, .nav-btn').forEach(btn => {
            btn.addEventListener('click', this.createRippleEffect);
        });
        
        // Drag & Drop pro produkty
        this.setupDragAndDrop();
    },
    
    /**
     * Zobrazí produkty v mřížce
     */
    renderProducts: function() {
        const products = Storage.getProducts();
        const filterValue = this.getActiveFilter();
        const searchValue = this.DOMElements.searchInput.value.toLowerCase();
        
        let html = '';
        let delay = 0;
        
        // Filtrování produktů podle kategorie a vyhledávání
        const filteredProducts = products.filter(product => {
            if (filterValue !== 'all' && product.category !== filterValue) {
                return false;
            }
            if (searchValue && !product.name.toLowerCase().includes(searchValue)) {
                return false;
            }
            return true;
        });
        
        // Přidáme třídu pro animaci filtrování
        this.DOMElements.productsGrid.classList.add('filtering');
        
        // Generování HTML pro každý produkt
        filteredProducts.forEach(product => {
            const imagePath = product.image || `images/placeholder.png`;
            const priceDisplay = this.formatPrice(product.price, product.currency);
            
            html += `
                <div class="product-card ${product.category}" data-id="${product.id}" draggable="true" style="animation-delay: ${delay}s">
                    <div class="product-image" style="background-image: url('${imagePath}')">
                        <span class="product-category">${this.getCategoryName(product.category)}</span>
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price ${product.currency === 'EUR' ? 'product-price-eur' : ''}">
                            <span>${product.customPrice ? 'Vlastní cena' : (product.cityTax ? 'Výpočet ceny' : priceDisplay)}</span>
                            <button class="add-to-cart" data-id="${product.id}" aria-label="Přidat do košíku">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            delay += 0.05;
        });
        
        // Pokud nejsou žádné produkty
        if (filteredProducts.length === 0) {
            html = '<div class="no-products">Žádné produkty nenalezeny.</div>';
        }
        
        // Vložení HTML do mřížky produktů
        this.DOMElements.productsGrid.innerHTML = html;
        
        // Odstranění třídy pro animaci filtrování po dokončení
        setTimeout(() => {
            this.DOMElements.productsGrid.classList.remove('filtering');
        }, 400);
        
        // Přidání posluchačů událostí pro tlačítka pro přidání do košíku
        this.DOMElements.productsGrid.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', this.handleAddToCart.bind(this));
        });
        
        // Přidání posluchačů událostí pro produkty s vlastní cenou
        this.DOMElements.productsGrid.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Ignorovat kliknutí na tlačítko přidat do košíku
                if (e.target.closest('.add-to-cart')) {
                    return;
                }
                
                const productId = card.dataset.id;
                const product = products.find(p => p.id === productId);
                
                // Otevření modálního okna pro vlastní cenu nebo City Tax
                if (product.customPrice) {
                    this.openCustomPriceModal(product);
                } else if (product.cityTax) {
                    this.openCityTaxModal();
                }
            });
        });
    },
    
    /**
     * Aktualizuje zobrazení košíku
     */
    updateCart: function() {
        const cartItems = Cart.getItems();
        let html = '';
        
        if (cartItems.length > 0) {
            cartItems.forEach(item => {
                const imagePath = item.image || `images/placeholder.png`;
                const itemTotal = item.price * item.quantity;
                const priceDisplay = this.formatPrice(item.price, item.currency);
                const totalDisplay = this.formatPrice(itemTotal, item.currency);
                
                html += `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-image" style="background-image: url('${imagePath}')"></div>
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price ${item.currency === 'EUR' ? 'cart-item-price-eur' : ''}">${priceDisplay}</div>
                        </div>
                        <div class="cart-item-actions">
                            <div class="quantity-control">
                                <button class="quantity-btn decrease" data-id="${item.id}">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="quantity-value">${item.quantity}</span>
                                <button class="quantity-btn increase" data-id="${item.id}">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <button class="remove-item" data-id="${item.id}">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
        } else {
            html = '<div class="empty-cart-message">Košík je prázdný</div>';
        }
        
        // Aktualizace HTML košíku
        this.DOMElements.cartItems.innerHTML = html;
        
        // Aktualizace součtů
        this.updateCartTotals();
        
        // Přidání posluchačů událostí pro tlačítka v košíku
        if (cartItems.length > 0) {
            // Tlačítka pro zvýšení množství
            this.DOMElements.cartItems.querySelectorAll('.quantity-btn.increase').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    Cart.increaseQuantity(id);
                    this.updateCart();
                    this.animateQuantityChange(e.currentTarget.parentElement.querySelector('.quantity-value'));
                });
            });
            
            // Tlačítka pro snížení množství
            this.DOMElements.cartItems.querySelectorAll('.quantity-btn.decrease').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    Cart.decreaseQuantity(id);
                    this.updateCart();
                    
                    const quantityElement = e.currentTarget.parentElement.querySelector('.quantity-value');
                    const item = Cart.getItemById(id);
                    
                    if (item) {
                        this.animateQuantityChange(quantityElement);
                    }
                });
            });
            
            // Tlačítka pro odstranění položky
            this.DOMElements.cartItems.querySelectorAll('.remove-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    const cartItem = e.currentTarget.closest('.cart-item');
                    
                    // Animace odstranění položky
                    cartItem.classList.add('removing');
                    
                    // Odstranění položky po dokončení animace
                    setTimeout(() => {
                        Cart.removeItem(id);
                        this.updateCart();
                    }, 300);
                });
            });
        }
        
        // Aktualizace tlačítka "Vytvořit účtenku"
        this.DOMElements.checkoutBtn.disabled = cartItems.length === 0;
    },
    
    /**
     * Aktualizuje součty v košíku
     */
    updateCartTotals: function() {
        const totals = Cart.calculateTotals();
        
        // Formátování součtů s měnou
        const subtotalCZK = this.formatPrice(totals.subtotalCZK, 'CZK');
        const subtotalEUR = this.formatPrice(totals.subtotalEUR, 'EUR');
        const totalCZK = this.formatPrice(totals.totalCZK, 'CZK');
        const totalEUR = this.formatPrice(totals.totalEUR, 'EUR');
        
        // Zobrazení součtů
        let subtotalText = '';
        let totalText = '';
        
        if (totals.subtotalCZK > 0 && totals.subtotalEUR > 0) {
            subtotalText = `${subtotalCZK} + ${subtotalEUR}`;
            totalText = `${totalCZK} + ${totalEUR}`;
        } else if (totals.subtotalCZK > 0) {
            subtotalText = subtotalCZK;
            totalText = totalCZK;
        } else if (totals.subtotalEUR > 0) {
            subtotalText = subtotalEUR;
            totalText = totalEUR;
        } else {
            subtotalText = '0 Kč';
            totalText = '0 Kč';
        }
        
        this.DOMElements.subtotalDisplay.textContent = subtotalText;
        this.DOMElements.totalDisplay.textContent = totalText;
    },
    
    /**
     * Zpracování přidání produktu do košíku
     * @param {Event} e - Událost kliknutí
     */
    handleAddToCart: function(e) {
        e.stopPropagation();
        
        const button = e.currentTarget;
        const productId = button.dataset.id;
        const product = Storage.getProducts().find(p => p.id === productId);
        
        if (product) {
            // Pro produkty s vlastní cenou nebo City Tax
            if (product.customPrice) {
                this.openCustomPriceModal(product);
                return;
            }
            
            if (product.cityTax) {
                this.openCityTaxModal();
                return;
            }
            
            // Přidání produktu do košíku
            Cart.addItem(product);
            this.updateCart();
            this.animateAddToCart(product.id);
            this.showNotification(`${product.name} přidán do košíku`, 'success');
            
            // Animace tlačítka
            button.classList.add('adding');
            setTimeout(() => {
                button.classList.remove('adding');
            }, 300);
        }
    },
    
    /**
     * Zpracování vyhledávání produktů
     */
    handleSearch: function() {
        this.renderProducts();
    },
    
    /**
     * Zpracování filtrování produktů
     * @param {Event} e - Událost kliknutí
     */
    handleFilter: function(e) {
        const filterBtn = e.currentTarget;
        const filter = filterBtn.dataset.filter;
        
        // Odstranění aktivní třídy ze všech filtrů
        this.DOMElements.filterButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Přidání aktivní třídy na vybraný filtr
        filterBtn.classList.add('active');
        
        // Překreslení produktů s novým filtrem
        this.renderProducts();
    },
    
    /**
     * Získá aktuální aktivní filtr
     * @returns {string} - Hodnota filtru
     */
    getActiveFilter: function() {
        const activeFilter = document.querySelector('.filter-btn.active');
        return activeFilter ? activeFilter.dataset.filter : 'all';
    },
    
    /**
     * Zpracování změny lokace
     * @param {Event} e - Událost kliknutí
     */
    handleLocationChange: function(e) {
        const locationBtn = e.currentTarget;
        const location = locationBtn.dataset.location;
        
        // Odstranění aktivní třídy ze všech lokací
        this.DOMElements.locationButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Přidání aktivní třídy na vybranou lokaci
        locationBtn.classList.add('active');
        
        // Uložení aktuální lokace
        Storage.setCurrentLocation(location);
        
        // Zobrazení upozornění
        this.showNotification(`Přepnuto na lokaci: ${this.getLocationName(location)}`, 'info');
    },
    
    /**
     * Otevře modální okno
     * @param {string} type - Typ modálního okna (stats, settings, receipt)
     */
    openModal: function(type) {
        let modal;
        
        switch (type) {
            case