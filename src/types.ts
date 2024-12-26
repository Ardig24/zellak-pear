export interface Product {
  id: string;
  name: string;
  category: string;
  vatRate: 7 | 19;
  variants: ProductVariant[];
  order: number;
  icon?: string;
}

export interface ProductVariant {
  id: string;
  size: string;
  prices: {
    A: number;
    B: number;
    C: number;
  };
}

export interface User {
  id: string;
  username: string;
  password: string;
  category: 'A' | 'B' | 'C';
  companyName: string;
  address?: string;
  contactNumber?: string;
  email?: string;
  isAdmin: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantId: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
  vatRate: 7 | 19;
  vatAmount: number;
}

export interface OrderTotals {
  subtotal: number;
  vat7Total: number;
  vat19Total: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  companyName: string;
  userEmail: string;
  address: string;
  contactNumber: string;
  category: string;
  status: 'pending' | 'completed';
  total: number;
  orderDate: string;
  totals: OrderTotals;
}

export interface UserData {
  username: string;
  companyName: string;
  address?: string;
  contactNumber?: string;
  email?: string;
  category?: string;
}

export interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  order: number;
}