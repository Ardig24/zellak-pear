import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage, USE_IMGBB, IMGBB_API_KEY } from '../config/firebase';
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
  addCategory: (category: Omit<Category, 'id'> & { imageUrl?: File | string }) => Promise<void>;
  updateCategory: (id: string, category: Omit<Category, 'id'> & { imageUrl?: File | string }) => Promise<void>;
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

  const uploadImage = async (file: File, path: string): Promise<string> => {
    if (USE_IMGBB) {
      try {
        // Create FormData for ImgBB upload
        const formData = new FormData();
        formData.append('image', file);
        formData.append('key', IMGBB_API_KEY);

        // Upload to ImgBB
        const response = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image to ImgBB');
        }

        const data = await response.json();
        return data.data.url; // Return the direct image URL
      } catch (error: any) {
        console.error('Error uploading image to ImgBB:', error);
        throw new Error('Failed to upload image');
      }
    } else {
      try {
        // Original Firebase Storage upload logic
        const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      } catch (error: any) {
        console.error('Error uploading image to Firebase Storage:', error);
        throw new Error('Failed to upload image');
      }
    }
  };

  const deleteImage = async (imageUrl: string) => {
    if (USE_IMGBB) {
      // ImgBB doesn't provide a delete API in the free tier
      // We just need to remove the reference from our database
      return;
    } else {
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
  };

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      setLoading(true);
      const productRef = doc(collection(db, 'products'));
      
      // If icon is a File, upload it first
      let iconUrl = productData.icon;
      if (productData.icon instanceof File) {
        iconUrl = await uploadImage(productData.icon, 'products');
      }

      const finalProductData = {
        ...productData,
        icon: iconUrl,
        createdAt: new Date().toISOString()
      };

      await setDoc(productRef, finalProductData);
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
        // Delete old image if it exists
        const oldProduct = products.find(p => p.id === id);
        if (oldProduct?.icon) {
          await deleteImage(oldProduct.icon);
        }
        
        // Upload new image
        iconUrl = await uploadImage(productData.icon, 'products');
      }

      const finalProductData = {
        ...productData,
        icon: iconUrl,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'products', id), finalProductData);
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
        await deleteImage(product.icon);
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

  const addCategory = async (categoryData: Omit<Category, 'id'> & { imageUrl?: File | string }) => {
    try {
      setLoading(true);
      const categoryRef = doc(collection(db, 'categories'));
      
      // If imageUrl is a File, upload it first
      let imageUrl = categoryData.imageUrl;
      if (categoryData.imageUrl instanceof File) {
        imageUrl = await uploadImage(categoryData.imageUrl, 'categories');
      }

      const finalCategoryData = {
        name: categoryData.name,
        imageUrl,
        createdAt: new Date().toISOString()
      };

      await setDoc(categoryRef, finalCategoryData);
      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: string, categoryData: Omit<Category, 'id'> & { imageUrl?: File | string }) => {
    try {
      setLoading(true);
      
      // If imageUrl is a File, upload it first
      let imageUrl = categoryData.imageUrl;
      if (categoryData.imageUrl instanceof File) {
        // Delete old image if it exists
        const oldCategory = categories.find(c => c.id === id);
        if (oldCategory?.imageUrl) {
          await deleteImage(oldCategory.imageUrl);
        }
        
        // Upload new image
        imageUrl = await uploadImage(categoryData.imageUrl, 'categories');
      }

      const finalCategoryData = {
        name: categoryData.name,
        imageUrl,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'categories', id), finalCategoryData);
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
      
      // Delete category image if it exists
      const category = categories.find(c => c.id === id);
      if (category?.imageUrl) {
        await deleteImage(category.imageUrl);
      }
      
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