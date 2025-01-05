import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage, USE_IMGBB, IMGBB_API_KEY } from '../config/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc,
  where,
  writeBatch,
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Product, Category } from '../types';

interface ProductsContextType {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id' | 'order'>) => Promise<{ id: string; } & Product | null>;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'> & { imageUrl?: File | string }) => Promise<void>;
  updateCategory: (id: string, category: Omit<Category, 'id'> & { imageUrl?: File | string }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderProducts: (fromIndex: number, toIndex: number) => Promise<void>;
  reorderCategories: (startIndex: number, endIndex: number) => Promise<void>;
  clearError: () => void;
  fetchCategories: () => Promise<void>;
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
      setLoading(true);
      setError(null);
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const fetchedProducts = productsSnapshot.docs.map(doc => {
        try {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            category: data.category || '',
            icon: data.icon || null,  // Allow null for icon
            vatRate: data.vatRate || 19,
            variants: data.variants || [],
            order: data.order || 0,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt
          } as Product;
        } catch (err) {
          console.error('Error processing product document:', doc.id, err);
          return null;
        }
      }).filter(Boolean) as Product[];
      
      // Sort products by order field, fallback to name if order is not set
      const sortedProducts = fetchedProducts.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return a.name.localeCompare(b.name);
      });

      console.log('Fetched products:', sortedProducts);
      setProducts(sortedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      setProducts([]); // Reset products on error
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesRef = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      const fetchedCategories = categoriesSnapshot.docs.map(doc => {
        try {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            imageUrl: data.imageUrl || '',  // Ensure imageUrl is never undefined
            order: data.order || 0,
          } as Category;
        } catch (err) {
          console.error('Error processing category document:', doc.id, err);
          return null;
        }
      }).filter(Boolean) as Category[];
      
      // Sort categories by order field, fallback to name if order is not set
      const sortedCategories = fetchedCategories.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return a.name.localeCompare(b.name);
      });

      console.log('Fetched categories:', sortedCategories);
      setCategories(sortedCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      setCategories([]); // Reset categories on error
    }
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    if (USE_IMGBB) {
      try {
        // Create FormData for ImgBB upload
        const formData = new FormData();
        formData.append('image', file);
        formData.append('key', IMGBB_API_KEY);

        console.log('Uploading image to ImgBB...', { fileName: file.name, fileSize: file.size });

        // Upload to ImgBB
        const response = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image to ImgBB');
        }

        const data = await response.json();
        console.log('ImgBB response:', data);
        
        // ImgBB returns different URLs, let's use display_url which is direct
        const imageUrl = data.data.display_url;
        console.log('Using image URL:', imageUrl);
        
        return imageUrl;
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

  const addProduct = async (productData: Omit<Product, 'id' | 'order'>) => {
    try {
      setLoading(true);
      setError(null);

      // Get the highest order value from current products
      const currentHighestOrder = products.reduce((max, p) => Math.max(max, p.order || 0), 0);

      // If icon is a File, upload it first
      let iconUrl = productData.icon;
      if (productData.icon instanceof File) {
        try {
          iconUrl = await uploadImage(productData.icon, 'products');
          console.log('Uploaded product image:', iconUrl);
        } catch (uploadErr) {
          console.error('Error uploading product image:', uploadErr);
          iconUrl = '';  // Set empty string if upload fails, just like categories
        }
      }

      const newProduct = {
        name: productData.name,
        category: productData.category,
        icon: iconUrl || '',  // Use empty string as default, just like categories
        vatRate: productData.vatRate,
        variants: productData.variants,
        order: currentHighestOrder + 1,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'products'), newProduct);
      const productWithId = { id: docRef.id, ...newProduct };

      // Update local state immediately
      setProducts(currentProducts => [...currentProducts, productWithId].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));

      return productWithId;
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err instanceof Error ? err.message : 'Error adding product');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, productData: Omit<Product, 'id'>) => {
    try {
      setLoading(true);
      
      // Get the existing product to preserve its order
      const existingProduct = products.find(p => p.id === id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }
      
      // If icon is a File, upload it first
      let iconUrl = productData.icon;
      if (productData.icon instanceof File) {
        try {
          // Delete old image if it exists
          if (existingProduct.icon) {
            await deleteImage(existingProduct.icon);
          }
          
          // Upload new image
          iconUrl = await uploadImage(productData.icon, 'products');
          console.log('Uploaded product image:', iconUrl);
        } catch (uploadErr) {
          console.error('Error uploading product image:', uploadErr);
          iconUrl = '';  // Set empty string if upload fails, just like categories
        }
      }

      const finalProductData = {
        name: productData.name,
        category: productData.category,
        icon: iconUrl || '',  // Use empty string as default, just like categories
        vatRate: productData.vatRate,
        variants: productData.variants,
        order: existingProduct.order, // Preserve the existing order
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'products', id), finalProductData);
      await fetchProducts();
    } catch (err: any) {
      console.error('Error updating product:', err);
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
        try {
          imageUrl = await uploadImage(categoryData.imageUrl, 'categories');
          console.log('Uploaded category image:', imageUrl);
        } catch (uploadErr) {
          console.error('Error uploading category image:', uploadErr);
          imageUrl = '';  // Set empty string if upload fails
        }
      }

      // Get the highest order value from current categories
      const currentHighestOrder = categories.reduce((max, c) => Math.max(max, c.order || 0), 0);

      const finalCategoryData = {
        name: categoryData.name,
        imageUrl: imageUrl || '',  // Ensure imageUrl is never undefined
        order: currentHighestOrder + 1,
        createdAt: new Date().toISOString()
      };

      await setDoc(categoryRef, finalCategoryData);

      // Update local state immediately
      const newCategory = { id: categoryRef.id, ...finalCategoryData };
      setCategories(currentCategories => [...currentCategories, newCategory].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));

      return newCategory;
    } catch (err: any) {
      console.error('Error adding category:', err);
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
        try {
          // Delete old image if it exists
          const oldCategory = categories.find(c => c.id === id);
          if (oldCategory?.imageUrl) {
            await deleteImage(oldCategory.imageUrl);
          }
          
          // Upload new image
          imageUrl = await uploadImage(categoryData.imageUrl, 'categories');
          console.log('Uploaded category image:', imageUrl);
        } catch (uploadErr) {
          console.error('Error uploading category image:', uploadErr);
          imageUrl = '';  // Set empty string if upload fails
        }
      }

      const finalCategoryData = {
        name: categoryData.name,
        imageUrl: imageUrl || '',  // Ensure imageUrl is never undefined
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'categories', id), finalCategoryData);
      await fetchCategories();
    } catch (err: any) {
      console.error('Error updating category:', err);
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

  const reorderProducts = async (fromIndex: number, toIndex: number) => {
    try {
      setLoading(true);
      setError(null);

      // Get current sorted products
      const sortedProducts = [...products].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      
      // Get the products being moved
      const [movedProduct] = sortedProducts.splice(fromIndex, 1);
      sortedProducts.splice(toIndex, 0, movedProduct);

      // Update orders for all products
      const updatedProducts = sortedProducts.map((product, index) => ({
        ...product,
        order: index
      }));

      // Batch update in Firebase
      const batch = writeBatch(db);
      updatedProducts.forEach(product => {
        const productRef = doc(db, 'products', product.id);
        batch.update(productRef, { order: product.order });
      });
      await batch.commit();

      // Update local state immediately
      setProducts(updatedProducts);
    } catch (err) {
      console.error('Error reordering products:', err);
      setError(err instanceof Error ? err.message : 'Failed to reorder products');
      // Refresh products to ensure consistency
      await fetchProducts();
    } finally {
      setLoading(false);
    }
  };

  const reorderCategories = async (startIndex: number, endIndex: number) => {
    try {
      const reorderedCategories = Array.from(categories);
      const [removed] = reorderedCategories.splice(startIndex, 1);
      reorderedCategories.splice(endIndex, 0, removed);

      // Update order in state
      setCategories(reorderedCategories);

      // Update order in Firestore
      const batch = writeBatch(db);
      reorderedCategories.forEach((category, index) => {
        const categoryRef = doc(db, 'categories', category.id);
        batch.update(categoryRef, { order: index });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error reordering categories:', err);
      setError('Failed to reorder categories');
      // Revert to original order
      fetchCategories();
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
    reorderProducts,
    reorderCategories,
    clearError,
    fetchCategories
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}