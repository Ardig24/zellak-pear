export interface Order {
  id: string;
  companyName: string;
  orderDate: string;
  total: number;
  status: 'pending' | 'completed';
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  size?: string;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: any; // Firestore Timestamp
}
