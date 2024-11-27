import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import morgan from 'morgan';
import db from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', username);

    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    console.log('User found:', user ? 'yes' : 'no');

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Users routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const users = await db.all('SELECT id, username, category, companyName, address, contactNumber, email, isAdmin FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const { username, password, category, companyName, address, contactNumber, email } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = Date.now().toString();

    await db.run(`
      INSERT INTO users (id, username, password, category, companyName, address, contactNumber, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, username, hashedPassword, category, companyName, address, contactNumber, email]);
    
    res.status(201).json({ id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Categories routes
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.all('SELECT * FROM categories');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const { id, name } = req.body;
    
    await db.run('INSERT INTO categories (id, name) VALUES (?, ?)', [id, name]);
    res.status(201).json({ id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const { id } = req.params;

    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM variants WHERE productId IN (SELECT id FROM products WHERE category = ?)', [id]);
    await db.run('DELETE FROM products WHERE category = ?', [id]);
    await db.run('DELETE FROM categories WHERE id = ?', [id]);
    await db.run('COMMIT');

    res.sendStatus(204);
  } catch (error) {
    await db.run('ROLLBACK');
    res.status(400).json({ error: error.message });
  }
});

// Products routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.all('SELECT * FROM products');
    const variants = await db.all('SELECT * FROM variants');

    const productsWithVariants = products.map(product => ({
      ...product,
      variants: variants
        .filter(v => v.productId === product.id)
        .map(v => ({
          id: v.id,
          size: v.size,
          prices: {
            A: v.priceA,
            B: v.priceB,
            C: v.priceC
          }
        }))
    }));

    res.json(productsWithVariants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const { name, category, icon, variants } = req.body;
    const id = Date.now().toString();

    await db.run('BEGIN TRANSACTION');
    
    await db.run('INSERT INTO products (id, name, category, icon) VALUES (?, ?, ?, ?)',
      [id, name, category, icon]);

    for (const variant of variants) {
      await db.run(`
        INSERT INTO variants (id, productId, size, priceA, priceB, priceC)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        Date.now().toString() + Math.random(),
        id,
        variant.size,
        variant.prices.A,
        variant.prices.B,
        variant.prices.C
      ]);
    }

    await db.run('COMMIT');
    res.status(201).json({ id });
  } catch (error) {
    await db.run('ROLLBACK');
    res.status(400).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});