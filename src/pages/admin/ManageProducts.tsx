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
    vatRate: 19 as 7 | 19,
    variants: [{
      id: `${Date.now()}-0`,
      size: '',
      prices: { A: 0, B: 0 },
      inStock: true
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
        vatRate: formData.vatRate,
        variants: formData.variants.map((variant, index) => ({
          id: variant.id || `variant-${timestamp}-${index}`,
          size: variant.size,
          prices: {
            A: Number(variant.prices.A),
            B: Number(variant.prices.B)
          },
          inStock: variant.inStock ?? true
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
          prices: { A: 0, B: 0 },
          inStock: true
        }
      ],
    });
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    const newVariants = [...formData.variants];
    if (field.startsWith('price')) {
      const category = field.split('.')[1] as 'A' | 'B';
      const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      newVariants[index] = {
        ...newVariants[index],
        prices: {
          ...newVariants[index].prices,
          [category]: numericValue,
        },
      };
    } else if (field === 'inStock') {
      newVariants[index] = {
        ...newVariants[index],
        inStock: value as boolean,
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
      vatRate: product.vatRate,
      variants: product.variants.map((v) => ({
        size: v.size,
        prices: { A: v.prices.A, B: v.prices.B },
        inStock: v.inStock
      })),
    });
    setIsAddingProduct(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      icon: '',
      vatRate: 19,
      variants: [{
        id: `${Date.now()}-0`,
        size: '',
        prices: { A: 0, B: 0 },
        inStock: true
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
    <div className="w-full min-w-0">
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      
      <div className="flex flex-col space-y-4 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-black drop-shadow-lg">
            {t('admin.products.title')}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsManagingCategories(true)}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors duration-200"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">{t('admin.products.manageCategories')}</span>
            </button>
            <button
              onClick={() => setIsAddingProduct(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>{t('admin.products.addNew')}</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white p-4 rounded-lg mb-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('admin.products.searchPlaceholder')}
                className="w-full px-3 py-2 rounded-lg text-black border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white pl-10"
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
                className="w-full px-3 py-2 rounded-lg text-black border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
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
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600">
                    {categories.find(c => c.id === product.category)?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(product)}
                    className="p-1.5 rounded-lg bg-white border border-blue-500 text-blue-700 hover:bg-blue-50 transition-colors duration-200"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-1.5 rounded-lg bg-white border border-red-500 text-red-700 hover:bg-red-50 transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Product Variants */}
              <div className="space-y-2">
                {product.variants.map((variant, index) => (
                  <div
                    key={variant.id}
                    className="bg-gray-50 p-2 rounded-lg border border-gray-100"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{variant.size}</span>
                        <div className="flex gap-2 text-sm">
                          <span className="text-gray-600">A: €{variant.prices.A}</span>
                          <span className="text-gray-600">B: €{variant.prices.B}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newVariants = [...product.variants];
                            newVariants[index] = {
                              ...variant,
                              inStock: !variant.inStock
                            };
                            updateProduct(product.id, { ...product, variants: newVariants });
                          }}
                          className={`px-3 py-1 text-sm font-medium rounded-full ${
                            variant.inStock
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {variant.inStock ? t('admin.inStock') : t('admin.outOfStock')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingProduct ? t('admin.products.editProduct') : t('admin.products.addProduct')}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.products.name')}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.products.category')}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.products.icon')}
                    </label>
                    <input
                      type="file"
                      onChange={handleImageUpload}
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors duration-200"
                    >
                      {t('admin.products.chooseFile')}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.products.vatRate')}
                    </label>
                    <select
                      value={formData.vatRate}
                      onChange={(e) => setFormData({ ...formData, vatRate: parseInt(e.target.value) as 7 | 19 })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    >
                      <option value={7}>7%</option>
                      <option value={19}>19%</option>
                    </select>
                  </div>

                  {/* Variants Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        {t('admin.products.variants')}
                      </h3>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="bg-white border border-blue-500 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors duration-200 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        {t('admin.products.addVariant')}
                      </button>
                    </div>

                    {formData.variants.map((variant, index) => (
                      <div
                        key={variant.id}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-gray-900">
                            {t('admin.products.variant')} {index + 1}
                          </h4>
                          {formData.variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('admin.products.size')}
                            </label>
                            <input
                              type="text"
                              value={variant.size}
                              onChange={(e) => updateVariant(index, 'size', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.priceA')}</label>
                              <input
                                type="number"
                                value={variant.prices.A}
                                onChange={(e) => updateVariant(index, 'price.A', e.target.value)}
                                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                step="0.01"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.priceB')}</label>
                              <input
                                type="number"
                                value={variant.prices.B}
                                onChange={(e) => updateVariant(index, 'price.B', e.target.value)}
                                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                step="0.01"
                                min="0"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={variant.inStock}
                                onChange={(e) => updateVariant(index, 'inStock', e.target.checked)}
                                className="form-checkbox h-4 w-4 text-blue-600"
                              />
                              <span className="ml-2 text-sm text-gray-700">{t('admin.inStock')}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      {editingProduct ? t('common.save') : t('common.add')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Manage Categories Modal */}
        {isManagingCategories && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
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
                      className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
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
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
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
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
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
                      className="bg-white p-4 rounded-lg flex items-center justify-between gap-4 border border-gray-200"
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
                        <span className="font-medium text-gray-900">{category.name}</span>
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
                  className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}