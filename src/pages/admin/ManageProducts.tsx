import React, { useState, useRef } from 'react';
import { useProducts } from '../../contexts/ProductsContext';
import { Product } from '../../types';
import { Plus, Pencil, X, Settings, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function ManageProducts() {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory, loading, error, clearError } = useProducts();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories.map(c => c.id));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    icon: '',
    variants: [{
      id: `${Date.now()}-0`,
      size: '',
      prices: { A: 0, B: 0, C: 0 }
    }],
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, icon: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || formData.variants.length === 0) {
      return;
    }

    try {
      const timestamp = Date.now();
      const productData = {
        name: formData.name,
        category: formData.category,
        icon: formData.icon || '',
        variants: formData.variants.map((variant, index) => ({
          id: variant.id || `variant-${timestamp}-${index}`,
          size: variant.size,
          prices: {
            A: Number(variant.prices.A),
            B: Number(variant.prices.B),
            C: Number(variant.prices.C)
          }
        }))
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }

      resetForm();
    } catch (err: any) {
      console.error('Error submitting product:', err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm(t('admin.deleteProductConfirm'))) {
      try {
        await deleteProduct(productId);
      } catch (err: any) {
        console.error('Error deleting product:', err);
      }
    }
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          id: `${Date.now()}-${formData.variants.length}`,
          size: '',
          prices: { A: 0, B: 0, C: 0 }
        }
      ],
    });
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    const newVariants = [...formData.variants];
    if (field.startsWith('price')) {
      const category = field.split('.')[1] as 'A' | 'B' | 'C';
      const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      newVariants[index] = {
        ...newVariants[index],
        prices: {
          ...newVariants[index].prices,
          [category]: numericValue,
        },
      };
    } else {
      newVariants[index] = {
        ...newVariants[index],
        [field]: value,
      };
    }
    setFormData({ ...formData, variants: newVariants });
  };

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      icon: product.icon,
      variants: product.variants.map((v) => ({
        size: v.size,
        prices: { ...v.prices },
      })),
    });
    setIsAddingProduct(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      icon: '',
      variants: [{
        id: `${Date.now()}-0`,
        size: '',
        prices: { A: 0, B: 0, C: 0 }
      }],
    });
    setIsAddingProduct(false);
    setEditingProduct(null);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      try {
        await addCategory({
          name: newCategoryName.trim(),
        });
        setNewCategoryName('');
      } catch (err) {
        console.error('Error adding category:', err);
      }
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (loading && !isAddingProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('admin.manageProducts')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsManagingCategories(!isManagingCategories)}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <Settings className="w-5 h-5 mr-2" />
            {t('admin.manageCategories')}
          </button>
          <button
            onClick={() => setIsAddingProduct(true)}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('admin.addNewProduct')}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      {isManagingCategories && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-medium mb-4">{t('admin.manageCategories')}</h3>
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={t('admin.addNewCategory')}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              {t('common.add')}
            </button>
          </form>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span>{category.name}</span>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="text-red-600 hover:text-red-800"
                  title={t('common.delete')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAddingProduct && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('admin.productName')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('admin.category')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">{t('admin.selectCategory')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('admin.productImage')} (Optional)
              </label>
              <div className="mt-1 flex items-center gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-orange-50 file:text-orange-700
                    hover:file:bg-orange-100"
                />
                {formData.icon && (
                  <img
                    src={typeof formData.icon === 'string' ? formData.icon : URL.createObjectURL(formData.icon as File)}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-700">{t('admin.variants')}</h3>
              <button
                type="button"
                onClick={addVariant}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                {t('admin.addVariant')}
              </button>
            </div>

            {formData.variants.map((variant, index) => (
              <div key={index} className="relative grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded">
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  title={t('common.remove')}
                >
                  <X className="w-4 h-4" />
                </button>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('products.size')}
                  </label>
                  <input
                    type="text"
                    value={variant.size}
                    onChange={(e) => updateVariant(index, 'size', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('products.price')} A
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.prices.A}
                    onChange={(e) => updateVariant(index, 'price.A', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('products.price')} B
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.prices.B}
                    onChange={(e) => updateVariant(index, 'price.B', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('products.price')} C
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.prices.C}
                    onChange={(e) => updateVariant(index, 'price.C', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : editingProduct ? t('admin.updateProduct') : t('admin.addNewProduct')}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {categories.map((category) => {
          const categoryProducts = products.filter(p => p.category === category.id);
          const isExpanded = expandedCategories.includes(category.id);

          return (
            <div key={category.id} className="bg-white rounded-lg shadow">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <h3 className="text-lg font-medium text-gray-800">{category.name}</h3>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {isExpanded && (
                <div className="border-t">
                  {categoryProducts.length === 0 ? (
                    <p className="p-4 text-gray-500 text-center">{t('products.emptyCategory')}</p>
                  ) : (
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('admin.productName')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('admin.variants')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('admin.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {categoryProducts.map((product) => (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {product.icon && (
                                  <img
                                    src={product.icon}
                                    alt={product.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                )}
                                <span className="ml-2">{product.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {product.variants.map((v, idx) => (
                                <div key={idx} className="text-sm">
                                  {v.size}: €{v.prices.A} / €{v.prices.B} / €{v.prices.C}
                                </div>
                              ))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => startEdit(product)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title={t('common.edit')}
                                >
                                  <Pencil className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title={t('common.delete')}
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}