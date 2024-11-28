import React, { useState } from 'react';
import { OrderItem } from '../types';
import { ChevronLeft, LogOut, ShoppingCart, Send, Trash2, Search, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../contexts/ProductsContext';
import { useOrders } from '../contexts/OrderContext';
import { Link } from 'react-router-dom';
import LanguageSelector from '../components/LanguageSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { products, categories } = useProducts();
  const { userData, logout } = useAuth();
  const { sendOrder } = useOrders();
  const { t } = useTranslation();

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

      return newItems;
    });
  };

  const removeItem = (productId: string, variantId: string) => {
    setOrderItems(prev => 
      prev.filter(item => !(item.productId === productId && item.variantId === variantId))
    );
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
      alert(t('products.orderSuccess'));
    } catch (err: any) {
      setError(err.message || t('products.orderError'));
    } finally {
      setSending(false);
    }
  };

  const getQuantity = (productId: string, variantId: string) => {
    const orderItem = orderItems.find(item => item.productId === productId && item.variantId === variantId);
    return orderItem?.quantity || 0;
  };

  const getTotalItems = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const clearOrder = () => {
    setOrderItems([]);
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto py-4 px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link to="/admin" className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-semibold">{t('products.title')}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <button onClick={handleLogout} className="btn btn-secondary flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className="card">
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    className="input pl-10"
                    placeholder={t('products.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>

                <div className="space-y-2">
                  <button
                    className={`btn w-full justify-start ${!selectedCategory ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    {t('products.allCategories')}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`btn w-full justify-start ${selectedCategory === category ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <div className="card">
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                      <div className="space-y-4">
                        {product.variants.map((variant) => (
                          <div key={variant.id} className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                            <div>
                              <span className="text-sm text-gray-600">{variant.size}</span>
                              <span className="ml-2 font-medium">${variant.price}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                className="btn btn-secondary p-1"
                                onClick={() => handleQuantityChange(product.id, product.name, variant.id, variant.size, variant.price, 
                                  getQuantity(product.id, variant.id) - 1)}
                              >
                                -
                              </button>
                              <span className="w-8 text-center">{getQuantity(product.id, variant.id)}</span>
                              <button
                                className="btn btn-secondary p-1"
                                onClick={() => handleQuantityChange(product.id, product.name, variant.id, variant.size, variant.price,
                                  getQuantity(product.id, variant.id) + 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary - Fixed at bottom on mobile */}
        {orderItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4 md:relative md:mt-6 md:shadow-none md:border-none">
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <ShoppingCart className="w-6 h-6 text-gray-600" />
                  <span className="font-medium">
                    {t('products.totalItems')}: {getTotalItems()}
                  </span>
                  <span className="font-medium">
                    {t('products.total')}: ${getTotalPrice()}
                  </span>
                </div>
                <div className="flex items-center space-x-4 w-full md:w-auto">
                  <button
                    className="btn btn-secondary flex-1 md:flex-none flex items-center justify-center space-x-2"
                    onClick={clearOrder}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t('products.clear')}</span>
                  </button>
                  <button
                    className="btn btn-primary flex-1 md:flex-none flex items-center justify-center space-x-2"
                    onClick={handleSendOrder}
                    disabled={sending}
                  >
                    {sending ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{t('products.send')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
    </div>
  );
}
