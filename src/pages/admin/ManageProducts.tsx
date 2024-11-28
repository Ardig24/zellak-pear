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
    <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-black drop-shadow-lg">{t('admin.products.title')}</h1>

      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          value={''}
          onChange={(e) => {}}
          placeholder={t('admin.products.searchPlaceholder')}
          className="glass-input px-4 py-2 rounded-lg text-black"
        />
        <select
          value={''}
          onChange={(e) => {}}
          className="glass-input px-4 py-2 rounded-lg text-black"
        >
          <option value="all">{t('admin.products.allCategories')}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {t(`categories.${category}`)}
            </option>
          ))}
        </select>
        <button
          onClick={() => setIsAddingProduct(true)}
          className="glass-button-primary px-4 py-2 rounded-lg flex items-center justify-center sm:justify-start gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>{t('admin.products.addNew')}</span>
        </button>
      </div>

      {/* Mobile View - Cards */}
      <div className="lg:hidden space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="glass-panel p-4 rounded-lg space-y-4 hover:bg-white/10 transition-colors duration-200"
          >
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={product.icon}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-black truncate">{product.name}</h3>
                    <p className="text-sm text-gray-600">{t(`categories.${product.category}`)}</p>
                  </div>
                  <p className="text-black font-medium">€{product.variants[0].prices.A.toFixed(2)}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600 line-clamp-2">{''}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              {product.variants.map((variant) => (
                <span
                  key={variant.id}
                  className="px-2 py-1 rounded-full bg-gray-200/50 text-black"
                >
                  {variant.size}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => startEdit(product)}
                className="flex-1 glass-button px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                <span>{t('admin.products.edit')}</span>
              </button>
              <button
                onClick={() => handleDeleteProduct(product.id)}
                className="flex-1 glass-button px-4 py-2 rounded-lg hover:bg-red-500/30 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('admin.products.delete')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden lg:block overflow-x-auto glass-panel rounded-lg p-4">
        <table className="min-w-full glass-table">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                {t('admin.products.product')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                {t('admin.products.category')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                {t('admin.products.price')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                {t('admin.products.sizes')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                {t('admin.products.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/30">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-white/10 transition-colors duration-200">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={product.icon}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-black">{product.name}</div>
                      <div className="text-sm text-gray-600 line-clamp-1">{''}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-black">{t(`categories.${product.category}`)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-black">€{product.variants[0].prices.A.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {product.variants.map((variant) => (
                      <span
                        key={variant.id}
                        className="px-2 py-0.5 text-xs rounded-full bg-gray-200/50 text-black"
                      >
                        {variant.size}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(product)}
                      className="glass-button px-3 py-1.5 rounded-lg hover:bg-blue-500/30 transition-all duration-200 flex items-center gap-1"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>{t('admin.products.edit')}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="glass-button px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-all duration-200 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t('admin.products.delete')}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Product Modal */}
      {(isAddingProduct || editingProduct) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-black drop-shadow-lg">
                  {editingProduct ? t('admin.products.editProduct') : t('admin.products.addProduct')}
                </h2>
                <button
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                  }}
                  className="text-gray-300 hover:text-black transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      {t('admin.products.name')}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full glass-input px-4 py-2 rounded-lg text-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      {t('admin.products.category')}
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full glass-input px-4 py-2 rounded-lg text-black"
                      required
                    >
                      <option value="">{t('admin.products.selectCategory')}</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {t(`categories.${category}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    {t('admin.products.description')}
                  </label>
                  <textarea
                    name="description"
                    value={''}
                    onChange={(e) => {}}
                    rows={3}
                    className="w-full glass-input px-4 py-2 rounded-lg text-black"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      {t('admin.products.price')}
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.variants[0].prices.A}
                      onChange={(e) => updateVariant(0, 'prices.A', e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full glass-input px-4 py-2 rounded-lg text-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      {t('admin.products.image')}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full glass-input px-4 py-2 rounded-lg text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    {t('admin.products.sizes')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.variants.map((variant, index) => (
                      <label key={variant.id} className="inline-flex items-center">
                        <input
                          type="text"
                          name="sizes"
                          value={variant.size}
                          onChange={(e) => updateVariant(index, 'size', e.target.value)}
                          className="form-input h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-black">{variant.size}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingProduct(false);
                      setEditingProduct(null);
                    }}
                    className="flex-1 glass-button bg-gray-500/30 hover:bg-gray-600/30 text-black py-2"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 glass-button bg-blue-500/30 hover:bg-blue-600/30 text-black py-2"
                  >
                    {editingProduct ? t('common.save') : t('common.add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}