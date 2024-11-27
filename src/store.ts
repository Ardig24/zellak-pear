import { create } from 'zustand';
import { Product, User, Category } from './types';
import { persist } from 'zustand/middleware';

interface Store {
  products: Product[];
  users: User[];
  categories: Category[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  
  login: (username: string, password: string) => void;
  logout: () => void;
  setProducts: (products: Product[]) => void;
  setUsers: (users: User[]) => void;
  setCategories: (categories: Category[]) => void;
  addProduct: (product: Product) => void;
  addUser: (user: User) => void;
  addCategory: (category: Category) => void;
  updateProduct: (product: Product) => void;
  updateUser: (user: User) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

// Initial data
const initialCategories: Category[] = [
  { id: 'drinks', name: 'Drinks' },
  { id: 'main-dishes', name: 'Main Dishes' },
  { id: 'desserts', name: 'Desserts' },
  { id: 'appetizers', name: 'Appetizers' },
  { id: 'sides', name: 'Sides' }
];

const initialUsers: User[] = [
  {
    id: 'admin',
    username: 'admin',
    password: 'admin123', // In a real app, this would be hashed
    category: 'A',
    companyName: 'Admin',
    isAdmin: true
  }
];

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      products: [],
      users: initialUsers,
      categories: initialCategories,
      currentUser: null,
      isLoading: false,
      error: null,

      login: (username: string, password: string) => {
        const user = get().users.find(
          u => u.username === username && u.password === password
        );
        
        if (user) {
          set({ currentUser: user, error: null });
        } else {
          set({ error: 'Invalid credentials' });
        }
      },

      logout: () => set({ currentUser: null }),

      setProducts: (products) => set({ products }),
      setUsers: (users) => set({ users }),
      setCategories: (categories) => set({ categories }),

      addProduct: (product) => 
        set((state) => ({ products: [...state.products, product] })),

      addUser: (user) => 
        set((state) => ({ users: [...state.users, user] })),

      addCategory: (category) =>
        set((state) => ({ categories: [...state.categories, category] })),

      updateProduct: (product) =>
        set((state) => ({
          products: state.products.map((p) => 
            p.id === product.id ? product : p
          )
        })),

      updateUser: (user) =>
        set((state) => ({
          users: state.users.map((u) => 
            u.id === user.id ? user : u
          )
        })),

      updateCategory: (category) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === category.id ? category : c
          )
        })),

      deleteCategory: (categoryId) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== categoryId),
          products: state.products.filter((p) => p.category !== categoryId)
        })),

      setError: (error) => set({ error }),
      setIsLoading: (isLoading) => set({ isLoading })
    }),
    {
      name: 'food-ordering-store'
    }
  )
);