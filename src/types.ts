export interface Product {
  id: string;
  name: string;
  category: string;
  variants: ProductVariant[];
  icon: string;
  vatRate: 7 | 19;
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
  vat7Total: number;
  vat19Total: number;
  subtotal: number;
}

export interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}