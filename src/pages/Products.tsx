import React, { useState } from 'react';
import { OrderItem } from '../types';
import { ChevronLeft, LogOut, ShoppingCart, Send, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../contexts/ProductsContext';
import { useOrders } from '../contexts/OrderContext';
import LanguageSelector from '../components/LanguageSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    console.log('handleQuantityChange called with:', {
      productId,
      productName,
      variantId,
      size,
      price,
      newQuantity,
      currentOrderItems: orderItems
    });

    if (newQuantity < 0) return;

    setOrderItems(prevItems => {
      // Find the exact variant we're updating using both productId AND variantId
      const existingItemIndex = prevItems.findIndex(
        item => item.productId === productId && item.variantId === variantId
      );

      // Make a copy of the previous items
      const newItems = [...prevItems];

      if (existingItemIndex >= 0) {
        // Update existing item
        if (newQuantity === 0) {
          // Remove item if quantity is 0
          newItems.splice(existingItemIndex, 1);
        } else {
          // Update quantity of existing item
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newQuantity
          };
        }
      } else if (newQuantity > 0) {
        // Add new item if it doesn't exist and quantity > 0
        newItems.push({
          productId,
          productName,
          variantId,
          size,
          quantity: newQuantity,
          price
        });
      }

      console.log('Setting new items:', newItems);
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

  if (!userData) return null;

  const filteredProducts = selectedCategory 
    ? products.filter((p) => p.category === selectedCategory)
    : [];

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            {selectedCategory ? (
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                {t('products.backToCategories')}
              </button>
            ) : (
              <h1 className="text-2xl font-bold text-gray-800">
                {t('products.categories')}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-red-600 hover:text-red-800"
            >
              <LogOut className="w-5 h-5 mr-2" />
              {t('common.logout')}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Products Section */}
        <div className="flex-1">
          {!selectedCategory ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
                >
                  <h2 className="text-xl font-semibold text-gray-800">
                    {category.name}
                  </h2>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow p-4 flex items-center"
                >
                  {product.icon && (
                    <img
                      src={product.icon}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="ml-4 flex-grow">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <div className="mt-2 space-y-2">
                      {product.variants.map((variant, index) => {
                        // Ensure we have a valid variant ID
                        const safeVariantId = variant.id || `${product.id}-variant-${index}`;
                        
                        const orderItem = orderItems.find(
                          item => 
                            item.productId === product.id && 
                            item.variantId === safeVariantId
                        );
                        
                        const currentQuantity = orderItem?.quantity || 0;
                        
                        console.log('Rendering variant:', {
                          productId: product.id,
                          variantId: safeVariantId,
                          currentQuantity,
                          orderItem
                        });

                        return (
                          <div
                            key={`${product.id}-${safeVariantId}`}
                            className="flex items-center justify-between"
                          >
                            <span className="text-gray-600">{variant.size}</span>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
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
                                className="px-2 py-1 border rounded hover:bg-gray-100"
                                disabled={currentQuantity === 0}
                              >
                                -
                              </button>
                              <span className="w-16 text-center">{currentQuantity}</span>
                              <button
                                type="button"
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
                                className="px-2 py-1 border rounded hover:bg-gray-100"
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
        <div className="w-96">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {t('products.orderSummary')}
              </h2>
              <div className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-orange-600" />
                <span className="text-orange-600 font-medium">
                  {orderItems.length} {t('products.items')}
                </span>
              </div>
            </div>

            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-center py-6">
                {t('products.emptyOrder')}
              </p>
            ) : (
              <>
                <div className="space-y-4 mb-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {orderItems.map((item) => (
                    <div
                      key={`order-${item.productId}-${item.variantId || 'fallback'}`}
                      className="flex justify-between items-start pb-4 border-b"
                    >
                      <div>
                        <h3 className="font-medium">{item.productName}</h3>
                        <p className="text-sm text-gray-600">{item.size}</p>
                        <p className="text-sm">
                          {item.quantity} × €{item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-4">
                          €{(item.quantity * item.price).toFixed(2)}
                        </span>
                        <button
                          onClick={() =>
                            removeItem(item.productId, item.variantId)
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg font-bold">
                      {t('products.total')}:
                    </span>
                    <span className="text-lg font-bold">
                      €{calculateTotal().toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={handleSendOrder}
                    disabled={orderItems.length === 0 || sending}
                    className="w-full flex items-center justify-center px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
}