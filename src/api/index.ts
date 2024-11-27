import { User, Product, Category } from '../types';

const API_URL = 'http://localhost:3000/api';

let token: string | null = null;

export const setToken = (newToken: string) => {
  token = newToken;
};

const headers = () => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

export const login = async (username: string, password: string) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) throw new Error('Invalid credentials');

  const data = await response.json();
  setToken(data.token);
  return data.user;
};

export const getUsers = async () => {
  const response = await fetch(`${API_URL}/users`, {
    headers: headers()
  });

  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const createUser = async (userData: Omit<User, 'id'>) => {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(userData)
  });

  if (!response.ok) throw new Error('Failed to create user');
  return response.json();
};

export const getCategories = async () => {
  const response = await fetch(`${API_URL}/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
};

export const createCategory = async (category: Category) => {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(category)
  });

  if (!response.ok) throw new Error('Failed to create category');
  return response.json();
};

export const deleteCategory = async (id: string) => {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: headers()
  });

  if (!response.ok) throw new Error('Failed to delete category');
};

export const getProducts = async () => {
  const response = await fetch(`${API_URL}/products`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
};

export const createProduct = async (product: Omit<Product, 'id'>) => {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(product)
  });

  if (!response.ok) throw new Error('Failed to create product');
  return response.json();
};