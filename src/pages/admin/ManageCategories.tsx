import React, { useState, useRef } from 'react';
import { useProducts } from '../../contexts/ProductsContext';
import { Category } from '../../types';
import { Plus, Pencil, X, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function ManageCategories() {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories, loading, error, clearError } = useProducts();
  const [newCategoryName, setNewCategoryName] = useState('');
  const categoryImageInputRef = useRef<HTMLInputElement>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; imageUrl?: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    imageFile: null as File | null
  });
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
        imageUrl: categoryImageFile
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
    if (!editingCategory || !editFormData.name.trim()) return;

    try {
      await updateCategory(editingCategory.id, {
        name: editFormData.name.trim(),
        imageUrl: editFormData.imageFile || editingCategory.imageUrl
      });
      setEditingCategory(null);
      setEditFormData({ name: '', imageFile: null });
      setIsEditModalOpen(false);
      if (categoryImageInputRef.current) {
        categoryImageInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Error updating category:', err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory(categoryToDelete);
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
    setEditFormData({
      name: category.name,
      imageFile: null
    });
    setIsEditModalOpen(true);
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditFormData({ name: '', imageFile: null });
    setIsEditModalOpen(false);
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFormData(prev => ({ ...prev, imageFile: file }));
    }
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < categories.length) {
      reorderCategories(index, newIndex);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && <ErrorMessage message={error} onClose={clearError} />}

      {/* Add Category Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-medium mb-4">{t('admin.addCategory')}</h2>
        <form onSubmit={handleAddCategory} className="space-y-4">
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
              {t('admin.addCategory')}
            </button>
          </div>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">{t('admin.categories')}</h2>
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveCategory(index, 'up')}
                      disabled={index === 0}
                      className={`p-1 rounded-md hover:bg-gray-200 ${
                        index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500'
                      }`}
                      type="button"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveCategory(index, 'down')}
                      disabled={index === categories.length - 1}
                      className={`p-1 rounded-md hover:bg-gray-200 ${
                        index === categories.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500'
                      }`}
                      type="button"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
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
                    type="button"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    type="button"
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

      {/* Edit Category Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t('admin.editCategory')}</h2>
              <button
                onClick={cancelEditCategory}
                className="text-gray-500 hover:text-gray-700"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.categoryName')}
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  onChange={handleEditImageUpload}
                  className="w-full"
                />
                {editingCategory?.imageUrl && !editFormData.imageFile && (
                  <div className="mt-2">
                    <img
                      src={editingCategory.imageUrl}
                      alt={editingCategory.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 justify-end mt-6">
                <button
                  type="button"
                  onClick={cancelEditCategory}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {t('admin.update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('admin.deleteCategoryTitle')}
        message={t('admin.deleteCategoryConfirm')}
      />
    </div>
  );
}
