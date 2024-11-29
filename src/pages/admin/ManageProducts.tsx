import React, { useState, useRef } from 'react';
import { useProducts } from '../../contexts/ProductsContext';
import { Product, Category } from '../../types';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryImageInputRef = useRef<HTMLInputElement>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; imageUrl?: string } | null>(null);
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

  const handleCategoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCategoryImageFile(file);
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
        icon: formData.icon,
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
      setIsAddingProduct(false);
      setEditingProduct(null);
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
        if (editingCategory) {
          await updateCategory(editingCategory.id, {
            name: newCategoryName.trim(),
            imageUrl: categoryImageFile || editingCategory.imageUrl,
          });
        } else {
          await addCategory({
            name: newCategoryName.trim(),
            imageUrl: categoryImageFile,
          });
        }
        setNewCategoryName('');
        setCategoryImageFile(null);
        setEditingCategory(null);
      } catch (err) {
        console.error('Error managing category:', err);
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

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading && !isAddingProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8">
      {error && <ErrorMessage message={error} onDismiss={() => clearError()} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-black drop-shadow-lg">
          {t('admin.products.title')}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsManagingCategories(true)}
            className="glass-button px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden sm:inline">{t('admin.products.manageCategories')}</span>
          </button>
          <button
            onClick={() => setIsAddingProduct(true)}
            className="glass-button-primary px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>{t('admin.products.addNew')}</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="glass-panel p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('admin.products.searchPlaceholder')}
              className="w-full glass-input pl-10 pr-4 py-2 rounded-lg text-black"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full glass-input px-4 py-2 rounded-lg text-black"
            >
              <option value="all">{t('admin.products.allCategories')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="glass-panel p-4 rounded-lg hover:bg-white/10 transition-colors duration-200"
          >
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {product.icon ? (
                  typeof product.icon === 'string' ? (
                    <img
                      src={product.icon}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={URL.createObjectURL(product.icon)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-black truncate">{product.name}</h3>
                <p className="text-sm text-gray-600">
                  {categories.find(c => c.id === product.category)?.name}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {product.variants.map((variant) => (
                    <span
                      key={variant.id}
                      className="px-2 py-0.5 text-xs rounded-full bg-gray-200/50 text-black"
                    >
                      {variant.size}
                    </span>
                  ))}
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-black">
                    {t('admin.products.basePrice')}: €{product.variants[0]?.prices.A.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => startEdit(product)}
                className="flex-1 glass-button px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                <span>{t('admin.products.edit')}</span>
              </button>
              <button
                onClick={() => handleDeleteProduct(product.id)}
                className="glass-button px-4 py-2 rounded-lg hover:bg-red-500/30 transition-all duration-200 flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {searchTerm || selectedCategory !== 'all'
              ? t('admin.products.noProductsFound')
              : t('admin.products.noProducts')}
          </h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory !== 'all'
              ? t('admin.products.tryDifferentSearch')
              : t('admin.products.addFirstProduct')}
          </p>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {(isAddingProduct || editingProduct) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-black">
                  {editingProduct ? t('admin.products.editProduct') : t('admin.products.addNew')}
                </h2>
                <button
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="space-y-6">
                {/* Product Image */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    {t('admin.products.image')}
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {formData.icon ? (
                        typeof formData.icon === 'string' ? (
                          <img
                            src={formData.icon}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={URL.createObjectURL(formData.icon)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="glass-button px-4 py-2 rounded-lg"
                      >
                        {t('admin.products.uploadImage')}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      {t('admin.products.name')}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full glass-input px-4 py-2 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      {t('admin.products.category')}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full glass-input px-4 py-2 rounded-lg"
                      required
                    >
                      <option value="">{t('admin.products.selectCategory')}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Variants */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-black">
                      {t('admin.products.variants')}
                    </label>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="glass-button-primary px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      {t('admin.products.addVariant')}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.variants.map((variant, index) => (
                      <div
                        key={variant.id}
                        className="glass-panel p-4 rounded-lg relative"
                      >
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                          disabled={formData.variants.length === 1}
                        >
                          <X className="w-5 h-5" />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-black mb-1">
                              {t('admin.products.size')}
                            </label>
                            <input
                              type="text"
                              value={variant.size}
                              onChange={(e) => updateVariant(index, 'size', e.target.value)}
                              className="w-full glass-input px-4 py-2 rounded-lg"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-black mb-1">
                              {t('admin.products.priceA')}
                            </label>
                            <input
                              type="number"
                              value={variant.prices.A}
                              onChange={(e) => updateVariant(index, 'price.A', e.target.value)}
                              className="w-full glass-input px-4 py-2 rounded-lg"
                              required
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-black mb-1">
                              {t('admin.products.priceB')}
                            </label>
                            <input
                              type="number"
                              value={variant.prices.B}
                              onChange={(e) => updateVariant(index, 'price.B', e.target.value)}
                              className="w-full glass-input px-4 py-2 rounded-lg"
                              required
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-black mb-1">
                              {t('admin.products.priceC')}
                            </label>
                            <input
                              type="number"
                              value={variant.prices.C}
                              onChange={(e) => updateVariant(index, 'price.C', e.target.value)}
                              className="w-full glass-input px-4 py-2 rounded-lg"
                              required
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 glass-button-primary px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  {editingProduct ? t('admin.products.saveChanges') : t('admin.products.addProduct')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="glass-button px-4 py-2 rounded-lg"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isManagingCategories && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-lg w-full max-w-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-black">
                  {t('admin.products.manageCategories')}
                </h2>
                <button
                  onClick={() => {
                    setIsManagingCategories(false);
                    cancelEditCategory();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Add/Edit Category Form */}
              <form onSubmit={handleAddCategory} className="mb-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {(categoryImageFile || editingCategory?.imageUrl) ? (
                      <img
                        src={categoryImageFile ? URL.createObjectURL(categoryImageFile) : editingCategory?.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => categoryImageInputRef.current?.click()}
                    className="glass-button px-4 py-2 rounded-lg"
                  >
                    {t('admin.products.uploadImage')}
                  </button>
                  <input
                    ref={categoryImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCategoryImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={t('admin.products.newCategoryPlaceholder')}
                    className="flex-1 glass-input px-4 py-2 rounded-lg"
                    required
                  />
                  <button
                    type="submit"
                    className="glass-button-primary px-4 py-2 rounded-lg flex items-center gap-2"
                    disabled={!newCategoryName.trim() || loading}
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    {editingCategory ? t('admin.products.saveChanges') : t('admin.products.addCategory')}
                  </button>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={cancelEditCategory}
                      className="glass-button px-4 py-2 rounded-lg"
                    >
                      {t('common.cancel')}
                    </button>
                  )}
                </div>
              </form>

              {/* Categories List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="glass-panel p-4 rounded-lg flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      {category.imageUrl && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <span className="font-medium text-black">{category.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditCategory(category)}
                        className="text-gray-400 hover:text-blue-500"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t('admin.deleteCategoryConfirm'))) {
                            deleteCategory(category.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                {categories.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {t('admin.products.noCategories')}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsManagingCategories(false);
                  cancelEditCategory();
                }}
                className="w-full glass-button px-4 py-2 rounded-lg"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}