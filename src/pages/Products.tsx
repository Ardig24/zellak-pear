import { useState, useMemo, useCallback } from 'react';
import { OrderItem } from '../types';
import { ChevronLeft, LogOut, ShoppingCart, Send, Trash2, Search, ClipboardList, Coffee, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../contexts/ProductsContext';
import { useOrders } from '../contexts/OrderContext';
import { Link, useLocation } from 'react-router-dom';
import LanguageSelector from '../components/LanguageSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Toast from '../components/Toast';

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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const { products, categories } = useProducts();
  const { userData, logout } = useAuth();
  const { sendOrder } = useOrders();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const filteredProducts = useMemo(() => {
    const filteredBySearch = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (!selectedCategory) return filteredBySearch;
    return filteredBySearch.filter(product => product.category === selectedCategory);
  }, [products, searchTerm, selectedCategory]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(category =>
      products.some(
        product =>
          product.category === category.id &&
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [categories, products, searchTerm]);

  const cartTotals = useMemo(() => {
    return orderItems.reduce(
      (acc, item) => ({
        total: acc.total + item.total,
        vatAmount: acc.vatAmount + item.vatAmount,
      }),
      { total: 0, vatAmount: 0 }
    );
  }, [orderItems]);

  const handleQuantityChange = useCallback((
    productId: string,
    productName: string,
    variantId: string,
    size: string,
    price: number,
    newQuantity: number,
    vatRate: 7 | 19
  ) => {
    if (newQuantity < 0) return;

    setOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.productId === productId && item.variantId === variantId
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        if (newQuantity === 0) {
          updatedItems.splice(existingItemIndex, 1);
        } else {
          const total = price * newQuantity;
          const vatAmount = (total * vatRate) / 100;
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: newQuantity,
            total,
            vatAmount,
          };
        }
        localStorage.setItem('cartItems', JSON.stringify(updatedItems));
        return updatedItems;
      } else if (newQuantity > 0) {
        const total = price * newQuantity;
        const vatAmount = (total * vatRate) / 100;
        const newItems = [
          ...prevItems,
          {
            productId,
            productName,
            variantId,
            size,
            quantity: newQuantity,
            price,
            total,
            vatRate,
            vatAmount,
          },
        ];
        localStorage.setItem('cartItems', JSON.stringify(newItems));
        return newItems;
      }
      return prevItems;
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId: string) => {
    setOrderItems(prev => {
      const newItems = prev.filter(item => !(item.productId === productId && item.variantId === variantId));
      localStorage.setItem('cartItems', JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const updateQuantity = (productId: string, variantId: string, newQuantity: number) => {
    handleQuantityChange(
      productId,
      orderItems.find(item => item.productId === productId && item.variantId === variantId)?.productName || '',
      variantId,
      orderItems.find(item => item.productId === productId && item.variantId === variantId)?.size || '',
      orderItems.find(item => item.productId === productId && item.variantId === variantId)?.price || 0,
      newQuantity,
      orderItems.find(item => item.productId === productId && item.variantId === variantId)?.vatRate || 7
    );
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let vat7Total = 0;
    let vat19Total = 0;

    orderItems.forEach(item => {
      subtotal += item.total;
      if (item.vatRate === 7) {
        vat7Total += item.vatAmount;
      } else {
        vat19Total += item.vatAmount;
      }
    });

    return {
      subtotal,
      vat7Total,
      vat19Total,
      total: subtotal + vat7Total + vat19Total
    };
  };

  const handleSendOrder = async () => {
    if (orderItems.length === 0) {
      setToast({ message: 'No items in cart', type: 'error' });
      return;
    }

    if (!userData) {
      setToast({ message: 'Not logged in', type: 'error' });
      return;
    }

    setSending(true);
    setError(null);

    try {
      await sendOrder(orderItems, userData);
      setOrderItems([]);
      localStorage.removeItem('cartItems');
      setToast({ message: 'Order sent successfully', type: 'success' });
      setShowCart(false);
    } catch (error) {
      console.error('Failed to send order:', error);
      setError('Failed to send order');
      setToast({ message: 'Failed to send order', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleClearOrder = () => {
    setOrderItems([]);
    setShowDeleteConfirmation(false);
  };

  if (!userData) return null;

  // Group products by category for search results
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const category = categories.find(c => c.id === product.category)?.name || product.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  // Add mesh gradient style
  const meshGradientStyle = {
    backgroundImage: `
      radial-gradient(at 40% 20%, hsla(210, 100%, 93%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 0%, hsla(189, 100%, 91%, 1) 0px, transparent 50%),
      radial-gradient(at 0% 50%, hsla(355, 100%, 93%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 50%, hsla(240, 100%, 91%, 1) 0px, transparent 50%),
      radial-gradient(at 0% 100%, hsla(22, 100%, 92%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 100%, hsla(242, 100%, 91%, 1) 0px, transparent 50%),
      radial-gradient(at 0% 0%, hsla(343, 100%, 92%, 1) 0px, transparent 50%)
    `,
    backgroundColor: '#f1f5f9'
  };

  return (
    <div className="min-h-screen app-page" style={meshGradientStyle}>
      {/* Mobile Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-white/70 backdrop-blur-md shadow-xl transform transition-transform duration-300 ease-out">
            <div className="p-4 border-b border-white/20">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">My Order</h2>
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
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4">
                    {orderItems.map((item, index) => (
                      <div key={`${item.productId}-${item.variantId}`} 
                           className="bg-white rounded-lg shadow p-4 relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{item.productName}</h3>
                            <p className="text-gray-600 text-sm mt-1">{item.size}</p>
                            <div className="mt-3 flex items-center gap-3">
                              <div className="flex items-center bg-gray-100 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(item.productId, item.variantId, Math.max(0, item.quantity - 1))}
                                  className="px-3 py-1 text-gray-600 hover:text-gray-800 text-lg font-medium"
                                >
                                  -
                                </button>
                                <span className="px-3 py-1 text-lg font-semibold text-gray-800">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                                  className="px-3 py-1 text-gray-600 hover:text-gray-800 text-lg font-medium"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => removeItem(item.productId, item.variantId)}
                              className="text-red-500 hover:text-red-600 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                            <div className="text-right mt-2">
                              <div className="text-sm text-gray-500">€{item.price.toFixed(2)} per item</div>
                              <div className="text-sm font-medium text-blue-600 mt-1">€{(item.price * item.quantity).toFixed(2)}</div>
                              <div className="text-xs text-gray-500">+ {item.vatRate}% VAT will be added</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-semibold">Total:</span>
                      <span className="text-xl font-semibold text-blue-600">€{calculateTotals().total.toFixed(2)}</span>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>€{calculateTotals().subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>VAT 7%</span>
                          <span>€{calculateTotals().vat7Total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>VAT 19%</span>
                          <span>€{calculateTotals().vat19Total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Total</span>
                          <span className="text-xl font-semibold text-blue-600">€{calculateTotals().total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        handleSendOrder();
                        setShowCart(false);
                      }}
                      disabled={sending}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 backdrop-blur-sm"
                    >
                      {sending ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      Send Order
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteConfirmation(false)} />
          <div className="relative bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Delete Order</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete the entire order?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleClearOrder}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg border-t border-white/20 z-50">
        <nav className="flex justify-around items-center px-2 py-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex flex-col items-center min-w-[64px] ${
              !selectedCategory 
                ? 'text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Coffee className={`w-6 h-6 ${
              !selectedCategory 
                ? 'stroke-[2.5]' 
                : 'stroke-2'
            }`} />
            <span className="text-xs mt-1 font-medium">Categories</span>
          </button>

          {/* Cart Button with Order Items Count */}
          <button
            onClick={() => setShowCart(!showCart)}
            className={`flex flex-col items-center min-w-[64px] relative ${
              orderItems.length > 0 
                ? 'text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShoppingCart className={`w-6 h-6 ${
              orderItems.length > 0 
                ? 'stroke-[2.5]' 
                : 'stroke-2'
            }`} />
            <span className="text-xs mt-1 font-medium">My Order</span>
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
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardList className={`w-6 h-6 ${
              location.pathname === '/orders'
                ? 'stroke-[2.5]'
                : 'stroke-2'
            }`} />
            <span className="text-xs mt-1 font-medium">My Orders</span>
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
                  Back to Categories
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
                  My Orders
                </Link>
              </div>
              <LanguageSelector />
              <button
                onClick={handleLogout}
                className="flex items-center text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="relative mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products"
            className="w-full p-3 pl-10 border border-white/20 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all bg-white/70 backdrop-blur-sm"
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
                            className="glass-panel p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-md bg-white/70 border border-white/20"
                          >
                            <div className="flex items-start space-x-4 mb-4">
                              {product.icon ? (
                                <img
                                  src={product.icon}
                                  alt={product.name}
                                  className="w-24 h-24 object-cover rounded-lg shadow-sm"
                                />
                              ) : (
                                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Coffee className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">{product.name}</h3>
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
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/50 p-2 rounded-lg gap-2"
                                      >
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                                          <span className="text-sm font-medium">{variant.size}</span>
                                          <span className="text-xs text-gray-500">VAT {product.vatRate}%</span>
                                          {variant.inStock === false && (
                                            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                              Out of stock
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex flex-row items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                                          <p className="text-base font-semibold text-blue-600">€{variant.prices[userData.category].toFixed(2)}</p>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => {
                                                const newQuantity = Math.max(0, currentQuantity - 1);
                                                handleQuantityChange(
                                                  product.id,
                                                  product.name,
                                                  safeVariantId,
                                                  variant.size,
                                                  variant.prices[userData.category],
                                                  newQuantity,
                                                  product.vatRate
                                                );
                                              }}
                                              className={`glass-button w-8 h-8 rounded-lg flex items-center justify-center bg-white/70 backdrop-blur-sm text-gray-600 hover:bg-white/80 transition-colors border border-white/20 text-lg font-medium ${
                                                variant.inStock === false ? 'opacity-50 cursor-not-allowed' : ''
                                              }`}
                                              disabled={currentQuantity === 0 || variant.inStock === false}
                                            >
                                              -
                                            </button>
                                            <input
                                              type="number"
                                              value={currentQuantity}
                                              onChange={(e) => {
                                                if (variant.inStock === false) return;
                                                const newQuantity = Math.max(0, parseInt(e.target.value) || 0);
                                                handleQuantityChange(
                                                  product.id,
                                                  product.name,
                                                  safeVariantId,
                                                  variant.size,
                                                  variant.prices[userData.category],
                                                  newQuantity,
                                                  product.vatRate
                                                );
                                              }}
                                              className={`w-16 text-center font-medium text-gray-800 text-lg bg-white/50 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                                                variant.inStock === false ? 'opacity-50 cursor-not-allowed' : ''
                                              }`}
                                              min="0"
                                              disabled={variant.inStock === false}
                                            />
                                            <button
                                              onClick={() => {
                                                const newQuantity = currentQuantity + 1;
                                                handleQuantityChange(
                                                  product.id,
                                                  product.name,
                                                  safeVariantId,
                                                  variant.size,
                                                  variant.prices[userData.category],
                                                  newQuantity,
                                                  product.vatRate
                                                );
                                              }}
                                              className={`glass-button w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm text-lg font-medium ${
                                                variant.inStock === false
                                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                  : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                                              } transition-colors border border-white/20`}
                                              disabled={variant.inStock === false}
                                            >
                                              +
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(groupedProducts).length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">No results found</p>
                    </div>
                  )}
                </div>
              ) : (
                // Categories Grid
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className="glass-panel p-6 rounded-lg text-left hover:scale-102 hover:shadow-md transition-all duration-200 backdrop-blur-md bg-white/70 border border-white/20 min-h-[100px] w-full"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {category.imageUrl ? (
                            <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
                          ) : (
                            <Coffee className="w-8 h-8 text-blue-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-xl font-semibold text-gray-800 whitespace-pre-wrap break-words">
                            {category.name}
                          </h2>
                        </div>
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
                    className="glass-panel p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-md bg-white/70 border border-white/20"
                  >
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0 flex items-center">
                        {product.icon ? (
                          <img
                            src={product.icon}
                            alt={product.name}
                            className="w-24 h-24 object-cover rounded-lg shadow-sm"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Coffee className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">{product.name}</h3>
                        <div className="grid gap-2">
                          {product.variants.map((variant, index) => {
                            const safeVariantId = variant.id || `${product.id}-variant-${index}`;
                            const orderItem = orderItems.find(
                              item => item.productId === product.id && item.variantId === safeVariantId
                            );
                            const currentQuantity = orderItem?.quantity || 0;

                            return (
                              <div 
                                key={`${product.id}-${safeVariantId}`}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/50 p-2 rounded-lg gap-2"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                                  <span className="text-sm font-medium">{variant.size}</span>
                                  <span className="text-xs text-gray-500">VAT {product.vatRate}%</span>
                                  {variant.inStock === false && (
                                    <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                      Out of stock
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-row items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                                  <p className="text-base font-semibold text-blue-600">€{variant.prices[userData.category].toFixed(2)}</p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        const newQuantity = Math.max(0, currentQuantity - 1);
                                        handleQuantityChange(
                                          product.id,
                                          product.name,
                                          safeVariantId,
                                          variant.size,
                                          variant.prices[userData.category],
                                          newQuantity,
                                          product.vatRate
                                        );
                                      }}
                                      className={`glass-button w-8 h-8 rounded-lg flex items-center justify-center bg-white/70 backdrop-blur-sm text-gray-600 hover:bg-white/80 transition-colors border border-white/20 text-lg font-medium ${
                                        variant.inStock === false ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                      disabled={currentQuantity === 0 || variant.inStock === false}
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      value={currentQuantity}
                                      onChange={(e) => {
                                        if (variant.inStock === false) return;
                                        const newQuantity = Math.max(0, parseInt(e.target.value) || 0);
                                        handleQuantityChange(
                                          product.id,
                                          product.name,
                                          safeVariantId,
                                          variant.size,
                                          variant.prices[userData.category],
                                          newQuantity,
                                          product.vatRate
                                        );
                                      }}
                                      className={`w-16 text-center font-medium text-gray-800 text-lg bg-white/50 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                                        variant.inStock === false ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                      min="0"
                                      disabled={variant.inStock === false}
                                    />
                                    <button
                                      onClick={() => {
                                        const newQuantity = currentQuantity + 1;
                                        handleQuantityChange(
                                          product.id,
                                          product.name,
                                          safeVariantId,
                                          variant.size,
                                          variant.prices[userData.category],
                                          newQuantity,
                                          product.vatRate
                                        );
                                      }}
                                      className={`glass-button w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm text-lg font-medium ${
                                        variant.inStock === false
                                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                          : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                                      } transition-colors border border-white/20`}
                                      disabled={variant.inStock === false}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
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
              <div className="glass-panel p-6 rounded-lg backdrop-blur-md bg-white/70 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800">
                    Order Summary
                  </h2>
                  {orderItems.length > 0 && (
                    <button
                      onClick={() => setShowDeleteConfirmation(true)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                      aria-label="Clear order"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {orderItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mb-4 text-gray-400" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {orderItems.map((item, index) => (
                        <div key={`${item.productId}-${item.variantId}`} 
                             className="bg-white rounded-lg shadow-sm p-4 mb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="text-gray-800 font-medium text-lg">{item.productName}</p>
                                  <p className="text-sm text-gray-600">{item.size}</p>
                                </div>
                                <button
                                  onClick={() => removeItem(item.productId, item.variantId)}
                                  className="text-red-500 hover:text-red-600 transition-colors"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="mt-3 flex items-center gap-3">
                                <div className="flex items-center bg-gray-100 rounded-lg">
                                  <button
                                    onClick={() => updateQuantity(item.productId, item.variantId, Math.max(0, item.quantity - 1))}
                                    className="px-3 py-1 text-gray-600 hover:text-gray-800 text-lg font-medium"
                                  >
                                    -
                                  </button>
                                  <span className="px-3 py-1 text-lg font-semibold text-gray-800">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                                    className="px-3 py-1 text-gray-600 hover:text-gray-800 text-lg font-medium"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex flex-col gap-1">
                              <div className="text-sm text-gray-500">€{item.price.toFixed(2)} per item</div>
                              <div className="text-sm font-medium text-blue-600">€{(item.price * item.quantity).toFixed(2)}</div>
                              <div className="text-xs text-gray-500">+ {item.vatRate}% VAT will be added</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>€{calculateTotals().subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>VAT 7%</span>
                          <span>€{calculateTotals().vat7Total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>VAT 19%</span>
                          <span>€{calculateTotals().vat19Total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Total</span>
                          <span className="text-xl font-semibold text-blue-600">€{calculateTotals().total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSendOrder}
                      disabled={sending || orderItems.length === 0}
                      className="w-full flex justify-center items-center px-4 py-2 rounded-lg
                        bg-blue-600 text-white font-medium
                        hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                        disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm
                        transition-colors duration-200"
                    >
                      {sending ? (
                        <LoadingSpinner />
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Order
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Order Summary Modal/Drawer */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowCart(true)}
                className="fixed right-4 bottom-20 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
              >
                <ShoppingCart className="w-6 h-6" />
                {orderItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
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
