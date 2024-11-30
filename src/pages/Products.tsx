import React, { useState } from 'react';
import { OrderItem } from '../types';
import { ChevronLeft, LogOut, ShoppingCart, Send, Trash2, Search, ClipboardList, Coffee } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../contexts/ProductsContext';
import { useOrders } from '../contexts/OrderContext';
import { Link, useLocation } from 'react-router-dom';
import LanguageSelector from '../components/LanguageSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>(() => {
    const savedItems = localStorage.getItem('cartItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  
  const { products, categories } = useProducts();
  const { userData, logout } = useAuth();
  const { sendOrder } = useOrders();
  const { t } = useTranslation();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleQuantityChange = (
    productId: string,
    productName: string,
    variantId: string,
    size: string,
    price: number,
    newQuantity: number
  ) => {
    if (newQuantity < 0) return;

    setOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.productId === productId && item.variantId === variantId
      );

      const newItems = [...prevItems];

      if (existingItemIndex >= 0) {
        if (newQuantity === 0) {
          newItems.splice(existingItemIndex, 1);
        } else {
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newQuantity
          };
        }
      } else if (newQuantity > 0) {
        newItems.push({
          productId,
          productName,
          variantId,
          size,
          quantity: newQuantity,
          price
        });
      }

      // Save to localStorage
      localStorage.setItem('cartItems', JSON.stringify(newItems));
      return newItems;
    });
  };

  const removeItem = (productId: string, variantId: string) => {
    setOrderItems(prev => {
      const newItems = prev.filter(item => !(item.productId === productId && item.variantId === variantId));
      localStorage.setItem('cartItems', JSON.stringify(newItems));
      return newItems;
    });
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSendOrder = async () => {
    if (!userData || orderItems.length === 0) return;

    try {
      setSending(true);
      setError(null);
      
      await sendOrder(orderItems, userData);
      
      setOrderItems([]); // Clear cart
      localStorage.removeItem('cartItems'); // Clear localStorage
      alert(t('products.orderSuccess'));
    } catch (err: any) {
      setError(err.message || t('products.orderError'));
    } finally {
      setSending(false);
    }
  };

  if (!userData) return null;

  // Filter products based on search term and selected category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedCategory) {
      return product.category === selectedCategory && matchesSearch;
    }
    return matchesSearch;
  });

  // Group products by category for search results
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const category = categories.find(c => c.id === product.category)?.name || product.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  return (
    <div className="min-h-screen app-page">
      {/* Mobile Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-white rounded-t-2xl shadow-xl transform transition-transform duration-300 ease-out">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">{t('products.myOrder')}</h2>
                <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 70px)' }}>
              {orderItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">{t('products.emptyCart')}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {orderItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-gray-500">{item.size}</p>
                          <p className="text-sm text-gray-600">
                            {t('products.quantity')}: {item.quantity} × ${item.price}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-semibold">{t('products.total')}:</span>
                      <span className="font-semibold">${calculateTotal().toFixed(2)}</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        handleSendOrder();
                        setShowCart(false);
                      }}
                      disabled={sending}
                      className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      {t('products.sendOrder')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg border-t border-gray-200 z-50">
        <nav className="flex justify-around items-center px-2 py-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex flex-col items-center min-w-[64px] ${
              !selectedCategory 
                ? 'text-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Coffee className={`w-6 h-6 ${
              !selectedCategory 
                ? 'stroke-[2.5]' 
                : 'stroke-2'
            }`} />
            <span className="text-xs mt-1 font-medium">{t('products.categories')}</span>
          </button>

          {/* Cart Button with Order Items Count */}
          <button
            onClick={() => setShowCart(!showCart)}
            className={`flex flex-col items-center min-w-[64px] relative ${
              orderItems.length > 0 
                ? 'text-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShoppingCart className={`w-6 h-6 ${
              orderItems.length > 0 
                ? 'stroke-[2.5]' 
                : 'stroke-2'
            }`} />
            <span className="text-xs mt-1 font-medium">{t('products.myOrder')}</span>
            {orderItems.length > 0 && (
              <span className="absolute -top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {orderItems.length}
              </span>
            )}
          </button>

          {/* Order History Link */}
          <Link
            to="/orders"
            className={`flex flex-col items-center min-w-[64px] ${
              location.pathname === '/orders'
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardList className={`w-6 h-6 ${
              location.pathname === '/orders'
                ? 'stroke-[2.5]'
                : 'stroke-2'
            }`} />
            <span className="text-xs mt-1 font-medium">{t('orders.myOrders')}</span>
          </Link>
        </nav>
      </div>

      {/* Header */}
      <div className="glass-panel shadow-lg bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
                  {t('products.backToCategories')}
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden lg:block">
                <Link
                  to="/orders"
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ClipboardList className="w-5 h-5 mr-1" />
                  {t('orders.myOrders')}
                </Link>
              </div>
              <LanguageSelector />
              <button
                onClick={handleLogout}
                className="flex items-center text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-1" />
                <span className="hidden sm:inline">{t('common.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="relative mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('products.searchProducts')}
            className="w-full p-3 pl-10 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white/80 backdrop-blur-sm"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-24 lg:pb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Products Section */}
          <div className="flex-1 space-y-6">
            {!selectedCategory ? (
              searchTerm ? (
                // Search Results
                <div className="space-y-6">
                  {Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
                    <div key={categoryName}>
                      <h2 className="text-xl font-semibold mb-4">{categoryName}</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryProducts.map((product) => (
                          <div
                            key={product.id}
                            className="glass-panel p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            {product.icon && (
                              <img
                                src={product.icon}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded-lg mb-4"
                              />
                            )}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800 mb-3">{product.name}</h3>
                              <div className="space-y-2">
                                {product.variants.map((variant, index) => {
                                  const safeVariantId = variant.id || `${product.id}-variant-${index}`;
                                  const orderItem = orderItems.find(
                                    item => item.productId === product.id && item.variantId === safeVariantId
                                  );
                                  const currentQuantity = orderItem?.quantity || 0;

                                  return (
                                    <div
                                      key={`${product.id}-${safeVariantId}`}
                                      className="flex items-center justify-between bg-white/50 p-2 rounded-lg"
                                    >
                                      <div>
                                        <span className="text-gray-700 font-medium">{variant.size}</span>
                                        <p className="text-sm text-gray-500">${variant.prices[userData.category]}</p>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => {
                                            const newQuantity = Math.max(0, currentQuantity - 1);
                                            handleQuantityChange(
                                              product.id,
                                              product.name,
                                              safeVariantId,
                                              variant.size,
                                              variant.prices[userData.category],
                                              newQuantity
                                            );
                                          }}
                                          className="glass-button w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                          disabled={currentQuantity === 0}
                                        >
                                          -
                                        </button>
                                        <span className="w-8 text-center font-medium text-gray-800">{currentQuantity}</span>
                                        <button
                                          onClick={() => {
                                            const newQuantity = currentQuantity + 1;
                                            handleQuantityChange(
                                              product.id,
                                              product.name,
                                              safeVariantId,
                                              variant.size,
                                              variant.prices[userData.category],
                                              newQuantity
                                            );
                                          }}
                                          className="glass-button w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(groupedProducts).length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">{t('products.noResults')}</p>
                    </div>
                  )}
                </div>
              ) : (
                // Categories Grid
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className="glass-panel p-6 rounded-xl text-left hover:scale-102 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                          {category.imageUrl ? (
                            <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
                          ) : (
                            <Coffee className="w-6 h-6 text-indigo-600" />
                          )}
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">
                          {category.name}
                        </h2>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              // Selected Category Products
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="glass-panel p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {product.icon && (
                      <img
                        src={product.icon}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg mb-4"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">{product.name}</h3>
                      <div className="space-y-2">
                        {product.variants.map((variant, index) => {
                          const safeVariantId = variant.id || `${product.id}-variant-${index}`;
                          const orderItem = orderItems.find(
                            item => item.productId === product.id && item.variantId === safeVariantId
                          );
                          const currentQuantity = orderItem?.quantity || 0;

                          return (
                            <div
                              key={`${product.id}-${safeVariantId}`}
                              className="flex items-center justify-between bg-white/50 p-2 rounded-lg"
                            >
                              <div>
                                <span className="text-gray-700 font-medium">{variant.size}</span>
                                <p className="text-sm text-gray-500">${variant.prices[userData.category]}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    const newQuantity = Math.max(0, currentQuantity - 1);
                                    handleQuantityChange(
                                      product.id,
                                      product.name,
                                      safeVariantId,
                                      variant.size,
                                      variant.prices[userData.category],
                                      newQuantity
                                    );
                                  }}
                                  className="glass-button w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                  disabled={currentQuantity === 0}
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-medium text-gray-800">{currentQuantity}</span>
                                <button
                                  onClick={() => {
                                    const newQuantity = currentQuantity + 1;
                                    handleQuantityChange(
                                      product.id,
                                      product.name,
                                      safeVariantId,
                                      variant.size,
                                      variant.prices[userData.category],
                                      newQuantity
                                    );
                                  }}
                                  className="glass-button w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary Section */}
          <>
            {/* Desktop Order Summary */}
            <div className="hidden lg:block sticky top-6 w-96">
              <div className="glass-panel p-6 rounded-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800">
                    {t('products.orderSummary')}
                  </h2>
                  {orderItems.length > 0 && (
                    <button
                      onClick={() => setOrderItems([])}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {orderItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mb-4 text-gray-400" />
                    <p>{t('products.emptyCart')}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {orderItems.map((item, index) => (
                        <div
                          key={`${item.productId}-${item.variantId}-${index}`}
                          className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
                        >
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-800">
                              {item.productName}
                            </h3>
                            <p className="text-sm text-gray-600">{item.size}</p>
                            <p className="text-sm text-gray-600">
                              {t('products.quantity')}: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-800">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => removeItem(item.productId, item.variantId)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              {t('products.remove')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-medium text-gray-800">
                          {t('products.total')}
                        </span>
                        <span className="text-lg font-bold text-gray-800">
                          ${calculateTotal().toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={handleSendOrder}
                        disabled={sending || orderItems.length === 0}
                        className="w-full flex justify-center items-center px-4 py-2 rounded-lg
                          bg-indigo-600 text-white font-medium
                          hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-colors duration-200"
                      >
                        {sending ? (
                          <LoadingSpinner />
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            {t('products.sendOrder')}
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Order Summary Modal/Drawer */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowCart(true)}
                className="fixed right-4 bottom-20 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
              >
                <ShoppingCart className="w-6 h-6" />
                {orderItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {orderItems.length}
                  </span>
                )}
              </button>
            </div>
          </>
        </div>
      </div>
    </div>
  );
}
