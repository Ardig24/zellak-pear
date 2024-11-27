import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database queries
const queries = {
  createTables: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      category TEXT NOT NULL,
      company_name TEXT NOT NULL,
      address TEXT,
      contact_number TEXT,
      email TEXT,
      is_admin BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      icon TEXT NOT NULL,
      FOREIGN KEY (category) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      size TEXT NOT NULL,
      price_a DECIMAL NOT NULL,
      price_b DECIMAL NOT NULL,
      price_c DECIMAL NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `,

  // Users
  createUser: `
    INSERT INTO users (id, username, password, category, company_name, address, contact_number, email, is_admin)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `,
  
  getUser: 'SELECT * FROM users WHERE username = $1',
  getAllUsers: 'SELECT id, username, category, company_name, address, contact_number, email, is_admin FROM users',

  // Categories
  createCategory: 'INSERT INTO categories (id, name) VALUES ($1, $2)',
  getAllCategories: 'SELECT * FROM categories',
  deleteCategory: 'DELETE FROM categories WHERE id = $1',

  // Products
  createProduct: 'INSERT INTO products (id, name, category, icon) VALUES ($1, $2, $3, $4)',
  getAllProducts: 'SELECT * FROM products',
  createVariant: `
    INSERT INTO variants (id, product_id, size, price_a, price_b, price_c)
    VALUES ($1, $2, $3, $4, $5, $6)
  `,
  getProductVariants: 'SELECT * FROM variants WHERE product_id = $1'
};

// Initialize database
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(queries.createTables);

    // Check if admin exists
    const adminResult = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (adminResult.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await client.query(queries.createUser, [
        'admin',
        'admin',
        hashedPassword,
        'A',
        'Admin',
        null,
        null,
        null,
        true
      ]);
    }

    // Initialize default categories
    const categories = [
      { id: 'drinks', name: 'Drinks' },
      { id: 'main-dishes', name: 'Main Dishes' },
      { id: 'desserts', name: 'Desserts' },
      { id: 'appetizers', name: 'Appetizers' },
      { id: 'sides', name: 'Sides' }
    ];

    for (const category of categories) {
      const result = await client.query('SELECT id FROM categories WHERE id = $1', [category.id]);
      if (result.rows.length === 0) {
        await client.query(queries.createCategory, [category.id, category.name]);
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Initialize database on startup
initDb().catch(console.error);

export default {
  query: (text, params) => pool.query(text, params),
  queries
};