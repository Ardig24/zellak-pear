import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage } from '../config/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc,
  where 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Product, Category } from '../types';

interface ProductsContextType {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;
}

const ProductsContext = createContext<ProductsContextType | null>(null);

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const productsQuery = query(collection(db, 'products'));
      const snapshot = await getDocs(productsQuery);
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesQuery = query(collection(db, 'categories'));
      const snapshot = await getDocs(categoriesQuery);
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(categoriesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadProductImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      setLoading(true);
      const productRef = doc(collection(db, 'products'));
      
      // If icon is a File, upload it first
      let iconUrl = productData.icon;
      if (productData.icon instanceof File) {
        iconUrl = await uploadProductImage(productData.icon);
      }

      await setDoc(productRef, {
        ...productData,
        icon: iconUrl,
        createdAt: new Date().toISOString()
      });

      await fetchProducts();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, productData: Omit<Product, 'id'>) => {
    try {
      setLoading(true);
      
      // If icon is a File, upload it first
      let iconUrl = productData.icon;
      if (productData.icon instanceof File) {
        iconUrl = await uploadProductImage(productData.icon);
        
        // Delete old image if it exists
        const oldProduct = products.find(p => p.id === id);
        if (oldProduct?.icon) {
          const oldImageRef = ref(storage, oldProduct.icon);
          await deleteObject(oldImageRef).catch(() => {});
        }
      }

      await setDoc(doc(db, 'products', id), {
        ...productData,
        icon: iconUrl,
        updatedAt: new Date().toISOString()
      });

      await fetchProducts();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setLoading(true);
      
      // Delete product image if it exists
      const product = products.find(p => p.id === id);
      if (product?.icon) {
        const imageRef = ref(storage, product.icon);
        await deleteObject(imageRef).catch(() => {});
      }

      await deleteDoc(doc(db, 'products', id));
      await fetchProducts();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    try {
      setLoading(true);
      const categoryRef = doc(collection(db, 'categories'));
      await setDoc(categoryRef, {
        ...categoryData,
        createdAt: new Date().toISOString()
      });
      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: string, categoryData: Omit<Category, 'id'>) => {
    try {
      setLoading(true);
      await setDoc(doc(db, 'categories', id), {
        ...categoryData,
        updatedAt: new Date().toISOString()
      });
      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      setLoading(true);
      
      // Delete all products in this category first
      const productsInCategory = query(collection(db, 'products'), where('category', '==', id));
      const snapshot = await getDocs(productsInCategory);
      
      for (const doc of snapshot.docs) {
        await deleteProduct(doc.id);
      }

      await deleteDoc(doc(db, 'categories', id));
      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    products,
    categories,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    clearError
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}