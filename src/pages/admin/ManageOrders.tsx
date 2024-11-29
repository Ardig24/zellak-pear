import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useTranslation } from 'react-i18next';

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
  companyName: string;
  userEmail: string;
  address: string;
  contactNumber: string;
  category: string;
  status: 'pending' | 'completed';
  total: number;
  orderDate: string;
}

export default function ManageOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { t } = useTranslation();

  // Add formatDate function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        let orderDate = data.orderDate;
        if (!orderDate || isNaN(new Date(orderDate).getTime())) {
          orderDate = doc.createTime?.toDate().toISOString() || new Date().toISOString();
        }
        return {
          id: doc.id,
          ...data,
          orderDate
        };
      }) as Order[];

      ordersData.sort((a, b) => {
        const dateA = new Date(a.orderDate).getTime();
        const dateB = new Date(b.orderDate).getTime();
        return dateB - dateA;
      });

      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: 'pending' | 'completed') => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col space-y-4 min-w-0">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-black drop-shadow-lg">{t('admin.orders.title')}</h1>
          
          {/* Status Filter */}
          <div className="mb-6">
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'pending' | 'completed')}
              className="w-full sm:w-auto glass-input px-4 py-2 rounded-lg text-black"
            >
              <option value="all">{t('admin.orders.all')}</option>
              <option value="pending">{t('admin.orders.pending')}</option>
              <option value="completed">{t('admin.orders.completed')}</option>
            </select>
          </div>

          {/* Mobile View - Cards */}
          <div className="lg:hidden">
            <div className="max-h-[calc(100vh-250px)] overflow-y-auto space-y-4 pr-2">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="glass-panel p-4 rounded-lg space-y-4 hover:bg-white/10 transition-colors duration-200"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="font-medium text-black">{order.companyName}</div>
                      <div className="text-sm text-gray-600">{order.category}</div>
                    </div>
                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                      order.status === 'completed' 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {t(`orders.${order.status}`)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-gray-600">{t('admin.orders.contact')}:</div>
                      <div className="text-black">{order.userEmail}</div>
                      <div className="text-black">{order.contactNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-600">{t('admin.orders.total')}:</div>
                      <div className="text-black font-medium">€{order.total.toFixed(2)}</div>
                      <div className="text-gray-600 text-xs">
                        {formatDate(order.orderDate)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(
                        order.id, 
                        order.status === 'pending' ? 'completed' : 'pending'
                      );
                    }}
                    className={`w-full glass-button px-4 py-2 rounded-lg transition-all duration-200 ${
                      order.status === 'pending'
                        ? 'hover:bg-green-500/30'
                        : 'hover:bg-yellow-500/30'
                    }`}
                  >
                    {order.status === 'pending' 
                      ? t('admin.orders.markCompleted')
                      : t('admin.orders.markPending')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop View - Table */}
          <div className="hidden lg:block glass-panel rounded-lg">
            <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
              <table className="min-w-full glass-table">
                <thead className="sticky top-0 bg-white/80 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                      {t('admin.orders.orderDate')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                      {t('admin.orders.company')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                      {t('admin.orders.contact')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                      {t('admin.orders.total')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                      {t('admin.orders.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase tracking-wider">
                      {t('admin.orders.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30">
                  {filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-black">{order.companyName}</div>
                        <div className="text-sm text-gray-600">{order.category}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-black">{order.userEmail}</div>
                        <div className="text-sm text-gray-600">{order.contactNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        €{order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full ${
                          order.status === 'completed' 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {t(`orders.${order.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(
                              order.id, 
                              order.status === 'pending' ? 'completed' : 'pending'
                            );
                          }}
                          className={`glass-button px-4 py-2 rounded-lg transition-all duration-200 ${
                            order.status === 'pending'
                              ? 'hover:bg-green-500/30'
                              : 'hover:bg-yellow-500/30'
                          }`}
                        >
                          {order.status === 'pending' 
                            ? t('admin.orders.markCompleted')
                            : t('admin.orders.markPending')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Details Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="glass-panel rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-black drop-shadow-lg">
                      {t('admin.orders.orderDetails')}
                    </h2>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-300 hover:text-black transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    <div className="glass-panel p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-black">{t('admin.orders.company')}</h3>
                      <p className="text-black">{selectedOrder.companyName}</p>
                      <p className="text-gray-600">{selectedOrder.category}</p>
                    </div>
                    <div className="glass-panel p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-black">{t('admin.orders.contact')}</h3>
                      <p className="text-black">{selectedOrder.userEmail}</p>
                      <p className="text-black">{selectedOrder.contactNumber}</p>
                      <p className="text-black">{selectedOrder.address}</p>
                    </div>
                  </div>

                  <div className="glass-panel p-4 rounded-lg">
                    <h3 className="font-semibold mb-4 text-black">{t('admin.orders.items')}</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full glass-table mb-4">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-black">{t('admin.orders.productName')}</th>
                            <th className="px-4 py-2 text-left text-black">{t('admin.orders.size')}</th>
                            <th className="px-4 py-2 text-left text-black">{t('admin.orders.quantity')}</th>
                            <th className="px-4 py-2 text-left text-black">{t('admin.orders.price')}</th>
                            <th className="px-4 py-2 text-left text-black">{t('admin.orders.total')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-black">{item.productName}</td>
                              <td className="px-4 py-2 text-black">{item.size}</td>
                              <td className="px-4 py-2 text-black">{item.quantity}</td>
                              <td className="px-4 py-2 text-black">€{item.price.toFixed(2)}</td>
                              <td className="px-4 py-2 text-black">€{(item.quantity * item.price).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end border-t border-gray-200/30 pt-4">
                      <div className="text-right">
                        <span className="text-lg font-bold text-black">
                          {t('admin.orders.total')}: €{selectedOrder.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="flex-1 glass-button bg-gray-500/30 hover:bg-gray-600/30 text-black py-2"
                    >
                      {t('common.close')}
                    </button>
                    <button
                      onClick={() => {
                        handleStatusChange(
                          selectedOrder.id,
                          selectedOrder.status === 'pending' ? 'completed' : 'pending'
                        );
                        setSelectedOrder(null);
                      }}
                      className={`flex-1 glass-button py-2 ${
                        selectedOrder.status === 'pending'
                          ? 'bg-green-500/30 hover:bg-green-600/30'
                          : 'bg-yellow-500/30 hover:bg-yellow-600/30'
                      }`}
                    >
                      {selectedOrder.status === 'pending'
                        ? t('admin.orders.markCompleted')
                        : t('admin.orders.markPending')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
