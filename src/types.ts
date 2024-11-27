export interface Product {
  id: string;
  name: string;
  category: string;
  variants: ProductVariant[];
  icon: string;
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
}

export interface Category {
  id: string;
  name: string;
}