// Načtení požadovaných modulů
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

// Vytvoření Express aplikace
const app = express();
const port = process.env.PORT || 3000;

// Konfigurace middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'tajny_klic_pro_session',
    resave: false,
    saveUninitialized: true
}));

// Nastavení view engine na EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Připojení k MySQL databázi
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pokladna_db'
});

// Navázání spojení s databází
db.connect((err) => {
    if (err) {
        console.error('Chyba při připojení k databázi:', err);
        return;
    }
    console.log('Připojeno k MySQL databázi');
});

// Middleware pro kontrolu, zda je uživatel přihlášen
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Routes (cesty)

// Hlavní stránka - přesměrování na login, pokud není přihlášen
app.get('/', (req, res) => {
    if (req.session && req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Stránka pro přihlášení
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Zpracování přihlášení
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.render('login', { error: 'Zadejte prosím uživatelské jméno a heslo' });
    }
    
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Chyba při kontrole přihlášení:', err);
            return res.render('login', { error: 'Interní chyba serveru' });
        }
        
        if (results.length > 0) {
            req.session.userId = results[0].id;
            req.session.username = results[0].username;
            req.session.role = results[0].role;
            
            res.redirect('/dashboard');
        } else {
            res.render('login', { error: 'Nesprávné uživatelské jméno nebo heslo' });
        }
    });
});

// Dashboard
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { 
        username: req.session.username,
        role: req.session.role
    });
});

// Zobrazení produktů
app.get('/products', isAuthenticated, (req, res) => {
    const query = 'SELECT * FROM products ORDER BY name';
    
    db.query(query, (err, products) => {
        if (err) {
            console.error('Chyba při načítání produktů:', err);
            return res.status(500).send('Interní chyba serveru');
        }
        
        res.render('products', { products: products });
    });
});

// Přidání nového produktu
app.post('/products/add', isAuthenticated, (req, res) => {
    const { name, price, stock } = req.body;
    
    // Ověření vstupních dat
    if (!name || !price || price <= 0) {
        return res.status(400).send('Neplatná vstupní data');
    }
    
    const query = 'INSERT INTO products (name, price, stock) VALUES (?, ?, ?)';
    
    db.query(query, [name, price, stock || 0], (err, result) => {
        if (err) {
            console.error('Chyba při přidávání produktu:', err);
            return res.status(500).send('Interní chyba serveru');
        }
        
        res.redirect('/products');
    });
});

// Úprava produktu
app.post('/products/edit/:id', isAuthenticated, (req, res) => {
    const productId = req.params.id;
    const { name, price, stock } = req.body;
    
    // Ověření vstupních dat
    if (!productId || !name || !price || price <= 0) {
        return res.status(400).send('Neplatná vstupní data');
    }
    
    const query = 'UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?';
    
    db.query(query, [name, price, stock || 0, productId], (err, result) => {
        if (err) {
            console.error('Chyba při úpravě produktu:', err);
            return res.status(500).send('Interní chyba serveru');
        }
        
        res.redirect('/products');
    });
});

// Smazání produktu
app.post('/products/delete/:id', isAuthenticated, (req, res) => {
    const productId = req.params.id;
    
    if (!productId) {
        return res.status(400).send('Neplatný identifikátor produktu');
    }
    
    const query = 'DELETE FROM products WHERE id = ?';
    
    db.query(query, [productId], (err, result) => {
        if (err) {
            console.error('Chyba při mazání produktu:', err);
            return res.status(500).send('Interní chyba serveru');
        }
        
        res.redirect('/products');
    });
});

// Pokladna
app.get('/pos', isAuthenticated, (req, res) => {
    const query = 'SELECT * FROM products WHERE stock > 0 ORDER BY name';
    
    db.query(query, (err, products) => {
        if (err) {
            console.error('Chyba při načítání produktů pro pokladnu:', err);
            return res.status(500).send('Interní chyba serveru');
        }
        
        res.render('pos', { products: products });
    });
});

// Zpracování objednávky
app.post('/pos/order', isAuthenticated, (req, res) => {
    const { items, total } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0 || !total) {
        return res.status(400).json({ success: false, message: 'Neplatná objednávka' });
    }
    
    // Vytvoření nové objednávky
    db.query('INSERT INTO orders (user_id, total, date) VALUES (?, ?, NOW())', 
        [req.session.userId, total], 
        (err, result) => {
            if (err) {
                console.error('Chyba při vytváření objednávky:', err);
                return res.status(500).json({ success: false, message: 'Interní chyba serveru' });
            }
            
            const orderId = result.insertId;
            
            // Přidání položek objednávky a úprava skladu
            const orderItemsQuery = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?';
            const updateStockQuery = 'UPDATE products SET stock = stock - ? WHERE id = ?';
            
            // Vytvoření pole hodnot pro hromadné vložení
            const orderItemsValues = items.map(item => [
                orderId, 
                item.id, 
                item.quantity, 
                item.price
            ]);
            
            // Vložení položek objednávky
            db.query(orderItemsQuery, [orderItemsValues], (err) => {
                if (err) {
                    console.error('Chyba při ukládání položek objednávky:', err);
                    return res.status(500).json({ success: false, message: 'Interní chyba serveru' });
                }
                
                // Aktualizace skladu pro každou položku
                let updatesCompleted = 0;
                
                items.forEach(item => {
                    db.query(updateStockQuery, [item.quantity, item.id], (err) => {
                        if (err) {
                            console.error(`Chyba při aktualizaci skladu pro produkt ${item.id}:`, err);
                        }
                        
                        updatesCompleted++;
                        
                        // Pokud jsou všechny aktualizace skladu hotové, odpovíme
                        if (updatesCompleted === items.length) {
                            res.json({ 
                                success: true, 
                                orderId: orderId, 
                                message: 'Objednávka byla úspěšně zpracována' 
                            });
                        }
                    });
                });
            });
        }
    );
});

// Historie objednávek
app.get('/orders', isAuthenticated, (req, res) => {
    const query = `
        SELECT o.id, o.date, o.total, u.username as user 
        FROM orders o 
        JOIN users u ON o.user_id = u.id 
        ORDER BY o.date DESC
    `;
    
    db.query(query, (err, orders) => {
        if (err) {
            console.error('Chyba při načítání objednávek:', err);
            return res.status(500).send('Interní chyba serveru');
        }
        
        res.render('orders', { orders: orders });
    });
});

// Detail objednávky
app.get('/orders/:id', isAuthenticated, (req, res) => {
    const orderId = req.params.id;
    
    if (!orderId) {
        return res.status(400).send('Neplatný identifikátor objednávky');
    }
    
    const orderQuery = `
        SELECT o.id, o.date, o.total, u.username as user 
        FROM orders o 
        JOIN users u ON o.user_id = u.id 
        WHERE o.id = ?
    `;
    
    const itemsQuery = `
        SELECT oi.*, p.name 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ?
    `;
    
    // Načtení informací o objednávce
    db.query(orderQuery, [orderId], (err, orderResults) => {
        if (err) {
            console.error('Chyba při načítání detailu objednávky:', err);
            return res.status(500).send('Interní chyba serveru');
        }
        
        if (orderResults.length === 0) {
            return res.status(404).send('Objednávka nenalezena');
        }
        
        const order = orderResults[0];
        
        // Načtení položek objednávky
        db.query(itemsQuery, [orderId], (err, items) => {
            if (err) {
                console.error('Chyba při načítání položek objednávky:', err);
                return res.status(500).send('Interní chyba serveru');
            }
            
            res.render('order_detail', { order: order, items: items });
        });
    });
});

// Odhlášení
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Chyba při odhlašování:', err);
        }
        res.redirect('/login');
    });
});

// Spuštění serveru
app.listen(port, () => {
    console.log(`Server běží na portu ${port}`);
});