// Hlavní aplikační logika pro Villa POS

// Globální proměnné
let cart = [];
let activeCategory = 'all';
let activeLocation = 'oh-yeah';
let isOnline = navigator.onLine;
let customPriceItem = null;

// Kurz EUR/CZK
const exchangeRate = 25.50;

// Inicializace aplikace
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadCartFromStorage();
    displayProducts(activeCategory, activeLocation);
    updateDateTime();
    checkOnlineStatus();
    
    // Aktualizuj datum a čas každou minutu
    setInterval(updateDateTime, 60000);
});

// Nastavení event listenerů
function setupEventListeners() {
    // Výběr lokace
    document.getElementById('location-select').addEventListener('change', (e) => {
        activeLocation = e.target.value;
        localStorage.setItem('villapos-location', activeLocation);
        displayProducts(activeCategory, activeLocation);
    });

    // Kategorie produktů
    document.querySelectorAll('.category').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.category').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activeCategory = button.getAttribute('data-category');
            localStorage.setItem('villapos-category', activeCategory);
            displayProducts(activeCategory, activeLocation);
        });
    });

    // Vyhledávání
    document.getElementById('search-button').addEventListener('click', handleSearch);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Košík
    document.getElementById('clear-cart').addEventListener('click', clearCart);
    document.getElementById('checkout').addEventListener('click', openCheckoutModal);

    // Modální okno pro checkout
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            modal.style.display = 'none';
        });
    });
    
    document.getElementById('print-receipt').addEventListener('click', printReceipt);
    document.getElementById('export-pdf').addEventListener('click', exportToPDF);
    document.getElementById('complete-order').addEventListener('click', completeOrder);

    // Modální okno pro vlastní cenu
    document.getElementById('confirm-custom-price').addEventListener('click', confirmCustomPrice);

    // Sledování online/offline stavu
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
}

// Zobrazení produktů podle kategorie
function displayProducts(category, location) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    
    const filteredProducts = getProductsByCategory(category, location);
    
    if (filteredProducts.length === 0) {
        productList.innerHTML = '<div class="no-products">Žádné produkty nenalezeny</div>';
        return;
    }
    
    filteredProducts.forEach((product, index) => {
        const productElement = document.createElement('div');
        productElement.className = 'product';
        productElement.innerHTML = `
            <div class="product-image">
                <img src="${product.image || 'images/placeholder.jpg'}" alt="${product.name}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">${product.price} ${product.currency}</p>
            </div>
            <div class="product-controls">
                <button class="remove-btn" data-index="${index}">-</button>
                <span class="product-count" id="product-count-${location}-${index}">0</span>
                <button class="add-btn" data-index="${index}" ${product.customPrice ? 'data-custom="true"' : ''}>+</button>
            </div>
        `;
        productList.appendChild(productElement);
    });
    
    // Přidání event listenerů pro tlačítka
    document.querySelectorAll('.add-btn').forEach(button => {
        button.addEventListener('click', () => {
            const productIndex = parseInt(button.getAttribute('data-index'));
            const isCustomPrice = button.hasAttribute('data-custom');
            
            if (isCustomPrice) {
                openCustomPriceModal(productIndex);
            } else {
                addToCart(productIndex);
            }
        });
    });
    
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', () => {
            const productIndex = parseInt(button.getAttribute('data-index'));
            removeFromCart(productIndex);
        });
    });
    
    updateProductCounts();
}

// Otevření modálního okna pro vlastní cenu
function openCustomPriceModal(productIndex) {
    customPriceItem = getProductByIndex(productIndex, activeLocation);
    if (!customPriceItem) return;
    
    document.getElementById('custom-price').value = '';
    document.getElementById('custom-currency').value = customPriceItem.currency;
    
    const modal = document.getElementById('custom-price-modal');
    modal.style.display = 'flex';
}

// Potvrzení vlastní ceny
function confirmCustomPrice() {
    if (!customPriceItem) return;
    
    const priceInput = document.getElementById('custom-price');
    const currencySelect = document.getElementById('custom-currency');
    
    const priceValue = priceInput.value.trim();
    
    if (priceValue === "") {
        alert('Zadejte prosím cenu.');
        return;
    }
    
    const price = parseFloat(priceValue);
    const currency = currencySelect.value;
    
    if (isNaN(price)) {
        alert('Zadejte prosím platné číslo.');
        return;
    }
    
    if (price < 0) {
        alert('Cena nemůže být záporná.');
        return;
    }
    
    // Vytvoříme kopii produktu s vlastní cenou
    const customProduct = {
        ...customPriceItem,
        price: price,
        currency: currency,
        customPrice: false // Nastavíme na false, aby se okno již neotevíralo
    };
    
    // Přidáme do košíku
    addCustomItemToCart(customProduct);
    
    // Zavřeme modální okno
    document.getElementById('custom-price-modal').style.display = 'none';
    customPriceItem = null;
}

// Funkce pro vyhledávání
function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    
    if (query === "") {
        displayProducts(activeCategory, activeLocation);
        return;
    }
    
    const searchResults = searchProducts(query, activeLocation);
    
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    
    if (searchResults.length === 0) {
        productList.innerHTML = '<div class="no-products">Žádné produkty nenalezeny</div>';
        return;
    }
    
    searchResults.forEach((product, index) => {
        const productElement = document.createElement('div');
        productElement.className = 'product';
        productElement.innerHTML = `
            <div class="product-image">
                <img src="${product.image || 'images/placeholder.jpg'}" alt="${product.name}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">${product.price} ${product.currency}</p>
            </div>
            <div class="product-controls">
                <button class="remove-btn" data-index="${index}">-</button>
                <span class="product-count" id="product-count-${activeLocation}-${index}">0</span>
                <button class="add-btn" data-index="${index}" ${product.customPrice ? 'data-custom="true"' : ''}>+</button>
            </div>
        `;
        productList.appendChild(productElement);
    });
    
    // Přidání event listenerů pro tlačítka
    document.querySelectorAll('.add-btn').forEach(button => {
        button.addEventListener('click', () => {
            const productIndex = parseInt(button.getAttribute('data-index'));
            const isCustomPrice = button.hasAttribute('data-custom');
            
            if (isCustomPrice) {
                openCustomPriceModal(productIndex);
            } else {
                addToCart(productIndex);
            }
        });
    });
    
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', () => {
            const productIndex = parseInt(button.getAttribute('data-index'));
            removeFromCart(productIndex);
        });
    });
    
    updateProductCounts();
}

// Přidat produkt do košíku
function addToCart(productIndex) {
    const product = getProductByIndex(productIndex, activeLocation);
    if (product) {
        const cartItemId = `${activeLocation}-${productIndex}`;
        const existingItem = cart.find(item => item.cartItemId === cartItemId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ 
                ...product, 
                cartItemId,
                productIndex,
                location: activeLocation,
                quantity: 1 
            });
        }
        updateCart();
        saveCartToStorage();
    }
}

// Přidat produkt s vlastní cenou do košíku
function addCustomItemToCart(product) {
    if (product) {
        // Vytvoříme unikátní ID pro položku s vlastní cenou
        const timestamp = new Date().getTime();
        const cartItemId = `custom-${timestamp}`;
        
        cart.push({ 
            ...product, 
            cartItemId,
            location: activeLocation,
            quantity: 1,
            isCustomItem: true
        });
        
        updateCart();
        saveCartToStorage();
    }
}

// Odebrat produkt z košíku
function removeFromCart(productIndex) {
    const cartItemId = `${activeLocation}-${productIndex}`;
    const itemIndex = cart.findIndex(item => item.cartItemId === cartItemId);
    
    if (itemIndex > -1) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
        } else {
            cart.splice(itemIndex, 1);
        }
        updateCart();
        saveCartToStorage();
    }
}

// Aktualizace košíku
function updateCart() {
    updateTotalPrice();
    updateProductCounts();
    updateCartItems();
}

// Aktualizace celkové ceny
function updateTotalPrice() {
    let totalCZK = 0;
    let totalEUR = 0;
    
    cart.forEach(item => {
        if (item.currency === 'CZK') {
            totalCZK += item.price * item.quantity;
        } else if (item.currency === 'EUR') {
            totalEUR += item.price * item.quantity;
        }
    });
    
    document.getElementById('total-price-czk').textContent = `${totalCZK.toFixed(2)} CZK`;
    document.getElementById('total-price-eur').textContent = `${totalEUR.toFixed(2)} EUR`;
    
    document.getElementById('item-count').textContent = cart.reduce((count, item) => {
        return count + item.quantity;
    }, 0);
}

// Aktualizace počtu produktů
function updateProductCounts() {
    // Nejprve vynulujeme všechny počty
    document.querySelectorAll('.product-count').forEach(count => {
        count.textContent = '0';
    });
    
    // Pak nastavíme aktuální počty podle košíku
    cart.forEach(item => {
        if (!item.isCustomItem) {
            const countElement = document.getElementById(`product-count-${item.location}-${item.productIndex}`);
            if (countElement) {
                countElement.textContent = item.quantity;
            }
        }
    });
}

// Aktualizace položek v košíku
function updateCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart">Košík je prázdný</div>';
        return;
    }
    
    // Seřadíme položky podle lokace a kategorie
    const sortedCart = [...cart].sort((a, b) => {
        if (a.location !== b.location) {
            return a.location.localeCompare(b.location);
        }
        return a.category.localeCompare(b.category);
    });
    
    let currentLocation = '';
    let currentCategory = '';
    
    sortedCart.forEach(item => {
        // Přidání nadpisu lokace, pokud se změnila
        if (item.location !== currentLocation) {
            currentLocation = item.location;
            const locationHeader = document.createElement('div');
            locationHeader.className = 'cart-location-header';
            
            let locationName = 'Neznámá lokace';
            if (currentLocation === 'oh-yeah') locationName = 'Oh Yeah';
            else if (currentLocation === 'amazing-pool') locationName = 'Amazing Pool';
            else if (currentLocation === 'little-castle') locationName = 'Little Castle';
            
            locationHeader.textContent = locationName;
            cartItemsContainer.appendChild(locationHeader);
            
            currentCategory = ''; // Reset kategorie při změně lokace
        }
        
        // Přidání nadpisu kategorie, pokud se změnila
        if (item.category !== currentCategory) {
            currentCategory = item.category;
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'cart-category-header';
            
            let categoryName = 'Ostatní';
            if (currentCategory === 'non-alcoholic') categoryName = 'Nealko';
            else if (currentCategory === 'alcoholic') categoryName = 'Alkohol';
            else if (currentCategory === 'beer') categoryName = 'Piva';
            else if (currentCategory === 'relax') categoryName = 'Relax';
            
            categoryHeader.textContent = categoryName;
            cartItemsContainer.appendChild(categoryHeader);
        }
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">${item.price} ${item.currency}</span>
            </div>
            <div class="cart-item-quantity">
                <button class="cart-remove-btn" data-id="${item.cartItemId}">-</button>
                <span>${item.quantity}</span>
                <button class="cart-add-btn" data-id="${item.cartItemId}">+</button>
            </div>
            <span class="cart-item-total">${(item.price * item.quantity).toFixed(2)} ${item.currency}</span>
        `;
        cartItemsContainer.appendChild(cartItem);
    });
    
    // Přidání event listenerů pro tlačítka v košíku
    document.querySelectorAll('.cart-add-btn').forEach(button => {
        button.addEventListener('click', () => {
            const cartItemId = button.getAttribute('data-id');
            const cartItem = cart.find(item => item.cartItemId === cartItemId);
            
            if (cartItem) {
                cartItem.quantity += 1;
                updateCart();
                saveCartToStorage();
            }
        });
    });
    
    document.querySelectorAll('.cart-remove-btn').forEach(button => {
        button.addEventListener('click', () => {
            const cartItemId = button.getAttribute('data-id');
            const itemIndex = cart.findIndex(item => item.cartItemId === cartItemId);
            
            if (itemIndex > -1) {
                if (cart[itemIndex].quantity > 1) {
                    cart[itemIndex].quantity -= 1;
                } else {
                    cart.splice(itemIndex, 1);
                }
                updateCart();
                saveCartToStorage();
            }
        });
    });
}

// Vymazání košíku
function clearCart() {
    if (confirm('Opravdu chcete vymazat košík?')) {
        cart = [];
        updateCart();
        saveCartToStorage();
    }
}

// Otevření modálního okna pro dokončení objednávky
function openCheckoutModal() {
    if (cart.length === 0) {
        alert('Košík je prázdný!');
        return;
    }
    
    const modal = document.getElementById('checkout-modal');
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotalCZK = document.getElementById('checkout-total-czk');
    const checkoutTotalEUR = document.getElementById('checkout-total-eur');
    
    checkoutItems.innerHTML = '';
    
    // Seřadíme položky podle lokace a kategorie
    const sortedCart = [...cart].sort((a, b) => {
        if (a.location !== b.location) {
            return a.location.localeCompare(b.location);
        }
        return a.category.localeCompare(b.category);
    });
    
    let currentLocation = '';
    let currentCategory = '';
    
    sortedCart.forEach(item => {
        // Přidání nadpisu lokace, pokud se změnila
        if (item.location !== currentLocation) {
            currentLocation = item.location;
            const locationHeader = document.createElement('div');
            locationHeader.className = 'checkout-location-header';
            
            let locationName = 'Neznámá lokace';
            if (currentLocation === 'oh-yeah') locationName = 'Oh Yeah';
            else if (currentLocation === 'amazing-pool') locationName = 'Amazing Pool';
            else if (currentLocation === 'little-castle') locationName = 'Little Castle';
            
            locationHeader.textContent = locationName;
            checkoutItems.appendChild(locationHeader);
            
            currentCategory = ''; // Reset kategorie při změně lokace
        }
        
        // Přidání nadpisu kategorie, pokud se změnila
        if (item.category !== currentCategory) {
            currentCategory = item.category;
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'checkout-category-header';
            
            let categoryName = 'Ostatní';
            if (currentCategory === 'non-alcoholic') categoryName = 'Nealko';
            else if (currentCategory === 'alcoholic') categoryName = 'Alkohol';
            else if (currentCategory === 'beer') categoryName = 'Piva';
            else if (currentCategory === 'relax') categoryName = 'Relax';
            
            categoryHeader.textContent = categoryName;
            checkoutItems.appendChild(categoryHeader);
        }
        
        const checkoutItem = document.createElement('div');
        checkoutItem.className = 'checkout-item';
        checkoutItem.innerHTML = `
            <span class="checkout-item-name">${item.name}</span>
            <span class="checkout-item-quantity">${item.quantity}x</span>
            <span class="checkout-item-price">${item.price} ${item.currency}</span>
            <span class="checkout-item-total">${(item.price * item.quantity).toFixed(2)} ${item.currency}</span>
        `;
        checkoutItems.appendChild(checkoutItem);
    });
    
    let totalCZK = 0;
    let totalEUR = 0;
    
    cart.forEach(item => {
        if (item.currency === 'CZK') {
            totalCZK += item.price * item.quantity;
        } else if (item.currency === 'EUR') {
            totalEUR += item.price * item.quantity;
        }
    });
    
    checkoutTotalCZK.textContent = `${totalCZK.toFixed(2)} CZK`;
    checkoutTotalEUR.textContent = `${totalEUR.toFixed(2)} EUR`;
    
    modal.style.display = 'flex';
}

// Tisk účtenky
function printReceipt() {
    if (!isOnline && !confirm('Jste v offline režimu. Tisk nemusí fungovat správně. Chcete pokračovat?')) {
        return;
    }
    
    const receiptContent = prepareReceiptContent();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Účtenka - Villa POS</title>
            <style>
                body {
                    font-family: 'Courier New', monospace;
                    margin: 20px;
                    font-size: 12px;
                }
                .receipt-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .receipt-items {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .receipt-items th, .receipt-items td {
                    padding: 5px;
                    text-align: left;
                    border-bottom: 1px dotted #ccc;
                }
                .receipt-total {
                    text-align: right;
                    font-weight: bold;
                    margin-top: 20px;
                }
                .receipt-footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 10px;
                }
                @media print {
                    body {
                        margin: 0;
                        padding: 10px;
                    }
                }
            </style>
        </head>
        <body>
            ${receiptContent}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
}

// Export do PDF
function exportToPDF() {
    // Tahle funkce vyžaduje knihovnu jako jsPDF nebo html2pdf
    // Pro účely této ukázky pouze simulujeme export a ukazujeme upozornění
    alert('Funkce exportu do PDF vyžaduje přidání externí knihovny. V reálné aplikaci by zde byl export do PDF souboru.');
    
    // Pokud by byla knihovna přidána, bylo by to zhruba takto:
    /*
    const receiptContent = prepareReceiptContent();
    const element = document.createElement('div');
    element.innerHTML = receiptContent;
    
    html2pdf()
        .from(element)
        .save(`uctenka-${generateReceiptNumber()}.pdf`);
    */
}

// Příprava obsahu účtenky
function prepareReceiptContent() {
    const date = new Date();
    const formattedDate = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    let content = `
        <div class="receipt-header">
            <h2>Villa</h2>
            <p>${formattedDate}</p>
            <p>Účtenka č. ${generateReceiptNumber()}</p>
        </div>
    `;
    
    // Seřadíme položky podle lokace a kategorie
    const sortedCart = [...cart].sort((a, b) => {
        if (a.location !== b.location) {
            return a.location.localeCompare(b.location);
        }
        return a.category.localeCompare(b.category);
    });
    
    let currentLocation = '';
    let totalCZK = 0;
    let totalEUR = 0;
    
    sortedCart.forEach(item => {
        // Přidání nadpisu lokace, pokud se změnila
        if (item.location !== currentLocation) {
            if (currentLocation !== '') {
                // Uzavření předchozí tabulky, pokud existuje
                content += `
                    </tbody>
                </table>
                `;
            }
            
            currentLocation = item.location;
            
            let locationName = 'Neznámá lokace';
            if (currentLocation === 'oh-yeah') locationName = 'Oh Yeah';
            else if (currentLocation === 'amazing-pool') locationName = 'Amazing Pool';
            else if (currentLocation === 'little-castle') locationName = 'Little Castle';
            
            content += `
                <h3 style="margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #000;">${locationName}</h3>
                <table class="receipt-items" style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Položka</th>
                            <th>Množství</th>
                            <th>Cena</th>
                            <th>Celkem</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
        }
        
        content += `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}x</td>
                <td>${item.price} ${item.currency}</td>
                <td>${(item.price * item.quantity).toFixed(2)} ${item.currency}</td>
            </tr>
        `;
        
        if (item.currency === 'CZK') {
            totalCZK += item.price * item.quantity;
        } else if (item.currency === 'EUR') {
            totalEUR += item.price * item.quantity;
        }
    });
    
    // Uzavření poslední tabulky
    if (currentLocation !== '') {
        content += `
            </tbody>
        </table>
        `;
    }
    
    content += `
        <div class="receipt-total">
            <p>Celkem CZK: ${totalCZK.toFixed(2)} CZK</p>
            <p>Celkem EUR: ${totalEUR.toFixed(2)} EUR</p>
        </div>
        
        <div class="receipt-footer">
            <p>Děkujeme za návštěvu!</p>
            <p>Villa</p>
        </div>
    `;
    
    return content;
}

// Generování čísla účtenky
function generateReceiptNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `${year}${month}${day}-${random}`;
}

// Dokončení objednávky
function completeOrder() {
    alert('Objednávka byla úspěšně dokončena!');
    cart = [];
    updateCart();
    saveCartToStorage();
    document.getElementById('checkout-modal').style.display = 'none';
}

// Aktualizace data a času
function updateDateTime() {
    const dateElement = document.getElementById('current-date');
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    dateElement.textContent = now.toLocaleDateString('cs-CZ', options);
}

// Kontrola online/offline stavu
function checkOnlineStatus() {
    isOnline = navigator.onLine;
    const statusElement = document.getElementById('connection-status');
    const notification = document.getElementById('offline-notification');
    
    if (isOnline) {
        statusElement.textContent = 'Online';
        statusElement.className = 'online';
        notification.classList.add('hidden');
    } else {
        statusElement.textContent = 'Offline';
        statusElement.className = 'offline';
        notification.classList.remove('hidden');
    }
}

// Handler pro změnu online/offline stavu
function handleOnlineStatus() {
    checkOnlineStatus();
}

// Uložení košíku do localStorage
function saveCartToStorage() {
    try {
        localStorage.setItem('villapos-cart', JSON.stringify(cart));
    } catch (error) {
        console.error('Chyba při ukládání košíku:', error);
    }
}

// Načtení košíku z localStorage
function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('villapos-cart');
        if (savedCart && savedCart !== "") {
            cart = JSON.parse(savedCart);
            updateCart();
        }
    } catch (error) {
        console.error('Chyba při načítání košíku:', error);
    }
    
    // Načtení uložené kategorie a lokace
    const savedCategory = localStorage.getItem('villapos-category');
    if (savedCategory && savedCategory !== "") {
        activeCategory = savedCategory;
        document.querySelectorAll('.category').forEach(btn => btn.classList.remove('active'));
        const categoryBtn = document.querySelector(`.category[data-category="${activeCategory}"]`);
        if (categoryBtn) categoryBtn.classList.add('active');
    }
    
    const savedLocation = localStorage.getItem('villapos-location');
    if (savedLocation && savedLocation !== "") {
        activeLocation = savedLocation;
        document.getElementById('location-select').value = activeLocation;
    }
}