import React, { useState, useRef, useEffect } from 'react';
import { useProducts } from '../../contexts/ProductsContext';
import { Product, Category } from '../../types';
import { Plus, Pencil, X, Settings, ChevronDown, ChevronUp, Trash2, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function ManageProducts() {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory, reorderProducts, loading, error, clearError, fetchCategories } = useProducts();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories.map(c => c.id));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedViewCategory, setSelectedViewCategory] = useState<string | null>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryImageInputRef = useRef<HTMLInputElement>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; imageUrl?: string } | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    icon: null as File | string | null,
    vatRate: 19 as 7 | 19,
    variants: [{
      id: `${Date.now()}-0`,
      size: '',
      prices: { A: 0, B: 0 },
      inStock: true
    }],
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        await fetchCategories();
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, icon: file }));
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
        icon: formData.icon || null,
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
        // Update existing product
        await updateProduct(editingProduct.id, productData);
      } else {
        // Add new product
        const newProduct = await addProduct(productData);
        if (!newProduct) {
          throw new Error('Failed to add product');
        }
      }

      // Reset form in both cases
      setFormData({
        name: '',
        category: '',
        icon: null,
        vatRate: 19,
        variants: [{
          id: `${Date.now()}-0`,
          size: '',
          prices: { A: 0, B: 0 },
          inStock: true
        }],
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsAddingProduct(false);
      setEditingProduct(null);
    } catch (err) {
      console.error(editingProduct ? 'Error updating product:' : 'Error adding product:', err);
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const handleDeleteProduct = async (productId: string) => {
    setProductToDelete(productId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(productToDelete);
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
      icon: null,
      vatRate: 19,
      variants: [{
        id: `${Date.now()}-0`,
        size: '',
        prices: { A: 0, B: 0 },
        inStock: true
      }],
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsAddingProduct(false);
    setEditingProduct(null);
  };

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    if (!selectedViewCategory) return;
    
    // Get all products in the current category, sorted by order
    const categoryProducts = products
      .filter(p => p.category === selectedViewCategory)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    // Find the current index in the sorted category products
    const currentProduct = filteredProducts[index];
    const currentIndex = categoryProducts.findIndex(p => p.id === currentProduct.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < categoryProducts.length) {
      // Get the global indices for reordering
      const allSortedProducts = [...products].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const globalCurrentIndex = allSortedProducts.findIndex(p => p.id === currentProduct.id);
      const targetProduct = categoryProducts[newIndex];
      const globalNewIndex = allSortedProducts.findIndex(p => p.id === targetProduct.id);
      
      reorderProducts(globalCurrentIndex, globalNewIndex);
    }
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

  // Filter products based on search and selected category view
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedViewCategory || product.category === selectedViewCategory;
      return matchesSearch && matchesCategory;
    });

  // Filter products for global search
  const globalFilteredProducts = products
    .filter(product => product.name.toLowerCase().includes(globalSearchTerm.toLowerCase()));

  // Only filter categories if there's a global search term
  const displayedCategories = globalSearchTerm 
    ? categories.filter(category => {
        const categoryProducts = products.filter(p => p.category === category.id);
        return categoryProducts.some(product => 
          product.name.toLowerCase().includes(globalSearchTerm.toLowerCase())
        );
      })
    : categories;

  // Sort products by their order within their category
  const sortProductsByOrder = (productsToSort: Product[]) => {
    if (!selectedViewCategory) return productsToSort;
    
    return [...productsToSort].sort((a, b) => {
      if (a.category === selectedViewCategory && b.category === selectedViewCategory) {
        return (a.order ?? 0) - (b.order ?? 0);
      }
      return 0;
    });
  };

  const sortedFilteredProducts = sortProductsByOrder(filteredProducts);
  const sortedGlobalFilteredProducts = sortProductsByOrder(globalFilteredProducts);

  console.log('Current categories:', categories);
  console.log('Displayed categories:', displayedCategories);

  if (loading && !isAddingProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.manageProducts')}</h1>
        <button
          onClick={() => {
            setIsAddingProduct(true);
            setSelectedViewCategory(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-5 h-5" />
          {t('admin.addProduct')}
        </button>
      </div>

      {/* Global Search */}
      {!selectedViewCategory && (
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
              placeholder={t('admin.searchAllProducts')}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {!selectedViewCategory && (
        <>
          {globalSearchTerm ? (
            <div className="flex flex-col space-y-4 mb-8">
              {sortedGlobalFilteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 w-full"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-4">
                        <div>
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
                            onClick={() => {
                              setProductToDelete(product.id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-white border border-red-500 text-red-700 hover:bg-red-50 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Product Variants */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {product.variants.map((variant) => (
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
                                    const variantIndex = newVariants.findIndex(v => v.id === variant.id);
                                    newVariants[variantIndex] = {
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
                  </div>
                </div>
              ))}
              
              {sortedGlobalFilteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {t('admin.products.noProductsFound')}
                  </h3>
                  <p className="text-gray-500">
                    {t('admin.products.tryDifferentSearch')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {displayedCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedViewCategory(category.id)}
                  className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 text-center"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Back button when viewing category */}
      {selectedViewCategory && (
        <div className="mb-6">
          <button
            onClick={() => setSelectedViewCategory(null)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
            {t('admin.backToCategories')}
          </button>
          <h2 className="text-xl font-semibold mt-4">
            {categories.find(c => c.id === selectedViewCategory)?.name}
          </h2>
        </div>
      )}

      {/* Search and Filter */}
      {selectedViewCategory && (
        <div className="mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('admin.searchProducts')}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Products List */}
      {selectedViewCategory && (
        <div className="flex flex-col space-y-4">
          {sortedFilteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 w-full"
            >
              {/* Existing product card content */}
              <div className="flex items-start gap-4">
                {/* Reorder Controls */}
                <div className="flex flex-col gap-1 pt-2">
                  <button
                    onClick={() => moveProduct(sortedFilteredProducts.indexOf(product), 'up')}
                    disabled={index === 0}
                    className={`p-1 rounded-md hover:bg-gray-100 ${
                      index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500'
                    }`}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveProduct(sortedFilteredProducts.indexOf(product), 'down')}
                    disabled={index === sortedFilteredProducts.length - 1}
                    className={`p-1 rounded-md hover:bg-gray-100 ${
                      index === sortedFilteredProducts.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(product)}
                        className="p-1.5 rounded-lg bg-white border border-blue-500 text-blue-700 hover:bg-blue-50 transition-colors duration-200"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setProductToDelete(product.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-white border border-red-500 text-red-700 hover:bg-red-50 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Product Variants */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {product.variants.map((variant, variantIndex) => (
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
                                newVariants[variantIndex] = {
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {sortedFilteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {searchTerm || selectedViewCategory !== null
              ? t('admin.products.noProductsFound')
              : t('admin.products.noProducts')}
          </h3>
          <p className="text-gray-500">
            {searchTerm || selectedViewCategory !== null
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
                      className="bg-white border border-blue-500 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors duration-200"
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
              <div className="space-y-2">
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
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('admin.deleteProductTitle')}
        message={t('admin.deleteProductConfirm')}
      />
    </div>
  );
}