import React, { useState, useRef } from 'react';
import { useProducts } from '../../contexts/ProductsContext';
import { Category } from '../../types';
import { Plus, Pencil, X, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function ManageCategories() {
  const { categories, addCategory, updateCategory, deleteCategory, loading, error, clearError } = useProducts();
  const [newCategoryName, setNewCategoryName] = useState('');
  const categoryImageInputRef = useRef<HTMLInputElement>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; imageUrl?: string } | null>(null);
  const { t } = useTranslation();

  const handleCategoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCategoryImageFile(file);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await addCategory({
        name: newCategoryName.trim(),
        imageFile: categoryImageFile
      });
      setNewCategoryName('');
      setCategoryImageFile(null);
      if (categoryImageInputRef.current) {
        categoryImageInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Error adding category:', err);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !newCategoryName.trim()) return;

    try {
      await updateCategory(editingCategory.id, {
        name: newCategoryName.trim(),
        imageFile: categoryImageFile
      });
      setEditingCategory(null);
      setNewCategoryName('');
      setCategoryImageFile(null);
      if (categoryImageInputRef.current) {
        categoryImageInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Error updating category:', err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm(t('admin.deleteCategoryConfirm'))) {
      try {
        await deleteCategory(categoryId);
      } catch (err: any) {
        console.error('Error deleting category:', err);
      }
    }
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      imageUrl: category.imageUrl,
    });
    setNewCategoryName(category.name);
    setCategoryImageFile(null);
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setCategoryImageFile(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {error && <ErrorMessage message={error} onDismiss={clearError} />}
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">
          {editingCategory ? t('admin.editCategory') : t('admin.addCategory')}
        </h2>
        
        <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categoryName')}
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('admin.categoryNamePlaceholder')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categoryImage')}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleCategoryImageUpload}
              ref={categoryImageInputRef}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {editingCategory ? t('admin.updateCategory') : t('admin.addCategory')}
            </button>
            {editingCategory && (
              <button
                type="button"
                onClick={cancelEditCategory}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                {t('admin.cancel')}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">{t('admin.categories')}</h2>
          <div className="space-y-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {category.imageUrl && (
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditCategory(category)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {t('admin.noCategories')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
