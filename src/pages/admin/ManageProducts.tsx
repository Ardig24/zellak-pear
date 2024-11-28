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
            className="glass-button flex items-center"
          >
            <Settings className="w-5 h-5 mr-2" />
            {t('admin.manageCategories')}
          </button>
          <button
            onClick={() => setIsAddingProduct(true)}
            className="glass-button-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('admin.addNewProduct')}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      {isManagingCategories && (
        <div className="glass-panel rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('admin.categories')}</h3>
          
          {/* Add new category form */}
          <form onSubmit={handleAddCategory} className="mb-4 flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={t('admin.newCategoryName')}
              className="glass-input flex-1"
            />
            <button type="submit" className="glass-button-primary">
              {t('common.add')}
            </button>
          </form>

          {/* Categories list */}
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="glass-panel-darker rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-800 font-medium">{category.name}</span>
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="p-1 text-gray-600 hover:text-gray-800"
                  >
                    {expandedCategories.includes(category.id) ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAddingProduct && (
        <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('admin.productName')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="glass-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('admin.category')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="glass-input"
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
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {t('admin.productIcon')}
              </label>
              <input
                type="file"
                onChange={handleImageUpload}
                accept="image/*"
                className="glass-input"
                ref={fileInputRef}
              />
            </div>
          </div>

          {/* Variants section */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">{t('admin.variants')}</h3>
              <button
                type="button"
                onClick={addVariant}
                className="glass-button flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('admin.addVariant')}
              </button>
            </div>

            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <div key={variant.id} className="glass-panel-darker rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-4">
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        {t('admin.size')}
                      </label>
                      <input
                        type="text"
                        value={variant.size}
                        onChange={(e) => updateVariant(index, 'size', e.target.value)}
                        className="glass-input"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {Object.keys(variant.prices).map((category) => (
                      <div key={category}>
                        <label className="block text-sm font-medium text-gray-800 mb-1">
                          {t(`admin.priceCategory${category}`)}
                        </label>
                        <input
                          type="number"
                          value={variant.prices[category as keyof typeof variant.prices]}
                          onChange={(e) => updateVariant(index, `price.${category}`, e.target.value)}
                          className="glass-input"
                          required
                          min="0"
                          step="0.01"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={resetForm}
              className="glass-button"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="glass-button-primary"
            >
              {loading ? <LoadingSpinner /> : editingProduct ? t('common.save') : t('common.add')}
            </button>
          </div>
        </form>
      )}

      {/* Products list */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="glass-table">
          <thead>
            <tr>
              <th>{t('admin.productName')}</th>
              <th>{t('admin.category')}</th>
              <th>{t('admin.variants')}</th>
              <th className="text-right pr-8">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="flex items-center">
                    {product.icon && (
                      <img src={product.icon} alt="" className="w-8 h-8 mr-3 rounded-full" />
                    )}
                    {product.name}
                  </div>
                </td>
                <td>{categories.find(c => c.id === product.category)?.name}</td>
                <td>{product.variants.length} {t('admin.variantsCount')}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-2 pr-6">
                    <button
                      onClick={() => startEdit(product)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1.5 text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}