export interface Order {
  id: string;
  companyName: string;
  orderDate: string;
  total: number;
  status: 'pending' | 'completed';
  items: OrderItem[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantId: string;
  size: string;
  quantity: number;
  price: number;
  vatRate?: 7 | 19;
}

export interface ProductVariant {
  id?: string;
  size: string;
  prices: {
    [key: string]: number;
  };
  inStock?: boolean;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: any; // Firestore Timestamp
}
