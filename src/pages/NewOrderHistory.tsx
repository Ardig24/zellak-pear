import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import i18n from '../i18n';

interface OrderItem {
  productName: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  orderDate: any;
}

export default function NewOrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    // Set default language to German
    i18n.changeLanguage('de');
  }, []);

  useEffect(() => {
    if (!currentUser?.email) return;

    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userEmail', '==', currentUser.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // Sort orders by date, newest first
      ordersData.sort((a, b) => {
        const dateA = new Date(a.orderDate).getTime();
        const dateB = new Date(b.orderDate).getTime();
        return dateB - dateA;
      });

      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled'
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case 'pending':
        return t('orders.pending');
      case 'completed':
        return t('orders.completed');
      case 'cancelled':
        return t('orders.cancelled');
      default:
        return status;
    }
  };

  const formatDate = (date: any) => {
    return new Date(date).toLocaleString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen app-page pb-20 lg:pb-6">
      {/* Header */}
      <div className="glass-panel shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/products')}
                className="glass-button flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-gray-700 hover:text-gray-900"
              >
                <ChevronLeft className="w-5 h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t('orders.backToProducts')}</span>
              </button>
              <h1 className="ml-4 sm:ml-8 text-xl sm:text-2xl font-bold text-gray-800">{t('orders.myOrders')}</h1>
            </div>

            {/* Language Selector */}
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="glass-panel text-center py-12 rounded-lg">
            <p className="text-gray-700 text-lg">{t('orders.noOrders')}</p>
          </div>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="lg:hidden">
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-4 pr-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="glass-panel p-4 rounded-lg space-y-3 hover:bg-white/10 transition-colors duration-200"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">{formatDate(order.orderDate)}</div>
                        <div className="font-bold text-gray-800">€{order.total.toFixed(2)}</div>
                      </div>
                      <span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusStyle(order.status)}`}>
                        {getStatusTranslation(order.status)}
                      </span>
                    </div>
                    {order.status === 'pending' && (
                      <div className="pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelOrder(order.id);
                          }}
                          className="w-full glass-button text-red-600 hover:text-red-700 font-medium py-2"
                        >
                          {t('orders.cancel')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop View - Table */}
            <div className="hidden lg:block glass-panel rounded-lg">
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                <table className="min-w-full glass-table">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {t('orders.orderDate')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {t('orders.total')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {t('orders.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {t('orders.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {orders.map((order) => (
                      <tr 
                        key={order.id} 
                        className="hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                          {formatDate(order.orderDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                          €{order.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full ${getStatusStyle(order.status)}`}>
                            {getStatusTranslation(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {order.status === 'pending' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelOrder(order.id);
                              }}
                              className="glass-button text-red-600 hover:text-red-700 font-medium"
                            >
                              {t('orders.cancel')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-panel rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {t('orders.orderDetails')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(selectedOrder.orderDate)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                      <div>
                        <p className="font-medium text-gray-800">{item.productName}</p>
                        <p className="text-sm text-gray-600">
                          {item.size} - {item.quantity}x €{item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium text-gray-800">
                        €{(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">{t('orders.total')}</span>
                    <span className="text-lg font-bold text-gray-800">
                      €{selectedOrder.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="w-full glass-button bg-gray-600/90 hover:bg-gray-700/90 text-white py-2"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
