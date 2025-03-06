let EXCHANGE_RATE = 25.5;
let currentVilla = null;
let cart = [];
let selectedItem = null;
let currentQuantity = 1;
let isCartOpen = false;

// Inicializace aplikace
function init() {
    loadState();
    selectVilla(currentVilla || 'oh-yeah');
    updateStats();
    renderCart();
}

// Správa vil
function selectVilla(villa) {
    currentVilla = villa;
    document.querySelectorAll('.villa-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.${villa}`).classList.add('active');
    renderInventory();
    document.querySelector('.main-content').className = `main-content ${villa}`;
    saveState();
}

function renderInventory(category = 'all') {
    const inventoryEl = document.getElementById('inventory');
    inventoryEl.innerHTML = '';
    
    const filteredItems = category === 'all' 
        ? inventory[currentVilla] 
        : inventory[currentVilla].filter(item => item.category === category);

    filteredItems.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = `item ${currentVilla}`;
        itemEl.innerHTML = `
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
            </div>
            <div class="item-name">${item.name}</div>
            <div class="item-price">${item.customPrice ? 'Vlastní cena' : `${item.price} ${item.currency}`}</div>
        `;
        itemEl.onclick = () => handleItemClick(item);
        inventoryEl.appendChild(itemEl);
    });
}

function handleItemClick(item) {
    if (item.name === 'Wellness') {
        const price = prompt('Zadejte cenu wellness v EUR:');
        if (price === null || isNaN(price) || price <= 0) {
            alert('Zadejte platnou kladnou cenu!');
            return;
        }
        
        const existingItem = cart.find(cartItem => cartItem.name === item.name && cartItem.price === parseFloat(price));
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                ...item,
                id: Date.now(),
                price: parseFloat(price),
                quantity: 1
            });
        }
        renderCart();
        updateStats();
    } else {
        showQuantitySelector(item);
    }
}

// Správa množství
function showQuantitySelector(item) {
    selectedItem = item;
    currentQuantity = 1;
    const selector = document.getElementById('quantitySelector');
    document.getElementById('selectedItemName').textContent = item.name;
    document.getElementById('selectedItemPrice').textContent = `${item.price} ${item.currency}`;
    document.getElementById('quantityInput').value = currentQuantity;
    selector.style.display = 'block';
}

function hideQuantitySelector() {
    document.getElementById('quantitySelector').style.display = 'none';
    selectedItem = null;
    currentQuantity = 1;
}

function updateQuantityFromInput() {
    currentQuantity = Math.max(1, parseInt(document.getElementById('quantityInput').value) || 1);
}

function adjustQuantity(delta) {
    currentQuantity = Math.max(1, currentQuantity + delta);
    document.getElementById('quantityInput').value = currentQuantity;
}

function confirmQuantity() {
    const itemKey = `${selectedItem.name}-${selectedItem.price}-${selectedItem.currency}`;
    const existingItem = cart.find(item => `${item.name}-${item.price}-${item.currency}` === itemKey);
    
    if (existingItem) {
        existingItem.quantity += currentQuantity;
    } else {
        cart.push({ ...selectedItem, id: Date.now(), quantity: currentQuantity });
    }
    
    hideQuantitySelector();
    renderCart();
    updateStats();
    saveState();
}

// Správa košíku
function toggleCart() {
    const cartPanel = document.getElementById('cartPanel');
    isCartOpen = !isCartOpen;
    cartPanel.classList.toggle('active', isCartOpen);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
    updateStats();
    saveState();
}

function renderCart() {
    const cartEl = document.getElementById('cartItems');
    document.getElementById('cartCount').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartEl.innerHTML = '';
    
    const groupedItems = cart.reduce((acc, item) => {
        const key = `${item.name}-${item.price}-${item.currency}`;
        if (!acc[key]) {
            acc[key] = { ...item, quantity: 0 };
        }
        acc[key].quantity += item.quantity;
        return acc;
    }, {});
    
    Object.values(groupedItems).forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <div>
                <span class="cart-item-quantity">×${item.quantity}</span>
                ${item.name}
            </div>
            <div>
                ${(item.price * item.quantity).toFixed(2)} ${item.currency}
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        cartEl.appendChild(itemEl);
    });
}

// Správa měny a výpočtů
function updateExchangeRate() {
    const rate = prompt('Zadejte aktuální kurz EUR/CZK:', EXCHANGE_RATE);
    if (rate && !isNaN(rate) && rate > 0) {
        EXCHANGE_RATE = parseFloat(rate);
        updateStats();
        saveState();
    } else {
        alert('Zadejte platný kladný kurz!');
    }
}

function calculateTotal(currency) {
    let itemsTotal = 0;
    let cityTaxTotal = 0;
    const discount = document.getElementById('discount').checked;
    const guests = parseInt(document.getElementById('guests').value) || 0;
    const nights = parseInt(document.getElementById('nights').value) || 0;

    // City Tax výpočet (2 EUR za osobu na noc)
    const cityTax = guests * nights * 2;
    cityTaxTotal = currency === 'CZK' ? cityTax * EXCHANGE_RATE : cityTax;

    // Součet položek
    cart.forEach(item => {
        let itemValue = item.price;
        if (item.currency !== currency) {
            itemValue = item.currency === 'EUR' 
                ? itemValue * EXCHANGE_RATE 
                : itemValue / EXCHANGE_RATE;
        }
        itemsTotal += itemValue * item.quantity;
    });

    // Výpočet slevy pouze z položek (bez City Tax)
    const discountAmount = discount ? (itemsTotal * 0.1) : 0;
    const total = itemsTotal + cityTaxTotal;

    return { total, discountAmount, itemsTotal, cityTaxTotal };
}

function updateStats() {
    const currency = document.getElementById('currency').value;
    const { total, discountAmount } = calculateTotal(currency);
    document.getElementById('totalItems').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('totalAmount').textContent = 
        `${(total - discountAmount).toFixed(2)} ${currency}`;
    saveState();
}

// Generování faktury
function generateInvoice() {
    const currency = document.getElementById('currency').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const guests = parseInt(document.getElementById('guests').value) || 0;
    const nights = parseInt(document.getElementById('nights').value) || 0;
    const discount = document.getElementById('discount').checked;

    const { total, discountAmount, itemsTotal, cityTaxTotal } = calculateTotal(currency);
    const paymentMethods = {
        cash: 'Hotově',
        card: 'Kartou',
        unpaid: 'Neplaceno'
    };

    const villaColors = {
        'oh-yeah': 'var(--oh-yeah-color)',
        'amazing-pool': 'var(--amazing-pool-color)',
        'little-castle': 'var(--little-castle-color)'
    };

    // Group items for invoice
    const groupedItems = cart.reduce((acc, item) => {
        const key = `${item.name}-${item.price}-${item.currency}`;
        if (!acc[key]) {
            acc[key] = { ...item, quantity: 0 };
        }
        acc[key].quantity += item.quantity;
        return acc;
    }, {});

    const modal = document.getElementById('invoiceModal');
    const content = document.getElementById('invoiceContent');
    
    content.innerHTML = `
        <div class="invoice-header" style="background: ${villaColors[currentVilla]}; color: white; padding: 20px; border-radius: 15px 15px 0 0;">
            <h2>${document.querySelector('.villa-btn.active').textContent}</h2>
            <p>${new Date().toLocaleDateString()}</p>
        </div>
        <div class="invoice-items">
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                    <tr style="border-bottom: 2px solid #eee;">
                        <th style="text-align: left; padding: 10px;">Položka</th>
                        <th style="text-align: right; padding: 10px;">Množství</th>
                        <th style="text-align: right; padding: 10px;">Cena</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.values(groupedItems).map(item => `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px;">${item.name}</td>
                            <td style="text-align: right; padding: 10px;">×${item.quantity}</td>
                            <td style="text-align: right; padding: 10px;">${(item.price * item.quantity).toFixed(2)} ${item.currency}</td>
                        </tr>
                    `).join('')}
                    <tr style="border-top: 2px solid #eee; font-weight: 600;">
                        <td style="padding: 10px;">Mezisoučet položek</td>
                        <td></td>
                        <td style="text-align: right; padding: 10px;">${itemsTotal.toFixed(2)} ${currency}</td>
                    </tr>
                    ${discount ? `
                        <tr style="color: #e74c3c;">
                            <td style="padding: 10px;">Sleva 10% (z položek)</td>
                            <td></td>
                            <td style="text-align: right; padding: 10px;">-${discountAmount.toFixed(2)} ${currency}</td>
                        </tr>
                    ` : ''}
                    ${guests > 0 && nights > 0 ? `
                        <tr>
                            <td style="padding: 10px;">City Tax (${guests} hostů × ${nights} nocí)</td>
                            <td></td>
                            <td style="text-align: right; padding: 10px;">${cityTaxTotal.toFixed(2)} ${currency}</td>
                        </tr>
                    ` : `
                        <tr style="color: #666; font-style: italic;">
                            <td style="padding: 10px;">City Tax: Bez City Taxu (0 hostů, 0 nocí)</td>
                            <td></td>
                            <td style="text-align: right; padding: 10px;">0 ${currency}</td>
                        </tr>
                    `}
                </tbody>
            </table>
            <div class="total" style="font-size: 1.5em; font-weight: 700; text-align: right; padding: 15px 0; border-top: 2px solid #eee;">
                Celkem: ${(total - discountAmount).toFixed(2)} ${currency}
            </div>
            <div class="payment-method" style="margin-top: 15px; text-align: right; color: #666; font-style: italic;">
                Způsob platby: ${paymentMethods[paymentMethod]}
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
    saveState();
}

// Stahování faktury jako PDF
function downloadInvoice() {
    const element = document.getElementById('invoiceContent');
    html2pdf().from(element).save('faktura_villa_' + Date.now() + '.pdf');
}

// Ukládání a načítání stavu
function saveState() {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('currentVilla', currentVilla);
    localStorage.setItem('exchangeRate', EXCHANGE_RATE);
}

function loadState() {
    const savedCart = localStorage.getItem('cart');
    const savedVilla = localStorage.getItem('currentVilla');
    const savedRate = localStorage.getItem('exchangeRate');
    
    if (savedCart) cart = JSON.parse(savedCart);
    if (savedVilla) currentVilla = savedVilla;
    if (savedRate) EXCHANGE_RATE = parseFloat(savedRate);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', init);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (document.getElementById('quantitySelector').style.display === 'block') {
            hideQuantitySelector();
        }
        if (document.getElementById('invoiceModal').style.display === 'flex') {
            document.getElementById('invoiceModal').style.display = 'none';
        }
        if (isCartOpen) {
            toggleCart();
        }
    }
});