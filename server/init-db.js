import sqlite3 from '@vscode/sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { promisify } from 'util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');

// Delete existing database if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath);
const run = promisify(db.run.bind(db));

// Create tables
await run(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    category TEXT NOT NULL,
    companyName TEXT NOT NULL,
    address TEXT,
    contactNumber TEXT,
    email TEXT,
    isAdmin INTEGER DEFAULT 0
  )
`);

await run(`
  CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  )
`);

await run(`
  CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT NOT NULL,
    FOREIGN KEY (category) REFERENCES categories(id)
  )
`);

await run(`
  CREATE TABLE variants (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    size TEXT NOT NULL,
    priceA REAL NOT NULL,
    priceB REAL NOT NULL,
    priceC REAL NOT NULL,
    FOREIGN KEY (productId) REFERENCES products(id)
  )
`);

// Insert default admin user
const hashedPassword = bcrypt.hashSync('admin123', 10);
await run(`
  INSERT INTO users (id, username, password, category, companyName, isAdmin)
  VALUES (?, ?, ?, ?, ?, ?)
`, ['admin', 'admin', hashedPassword, 'A', 'Admin', 1]);

// Insert default categories
const categories = [
  { id: 'drinks', name: 'Drinks' },
  { id: 'main-dishes', name: 'Main Dishes' },
  { id: 'desserts', name: 'Desserts' },
  { id: 'appetizers', name: 'Appetizers' },
  { id: 'sides', name: 'Sides' }
];

for (const category of categories) {
  await run('INSERT INTO categories (id, name) VALUES (?, ?)', [category.id, category.name]);
}

console.log('Database initialized successfully!');
await db.close();