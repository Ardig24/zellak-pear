import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
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

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('orderDate', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('admin.orders.title')}</h1>
      
      {/* Status Filter */}
      <div className="mb-4">
        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'pending' | 'completed')}
          className="p-2 border rounded"
        >
          <option value="all">{t('admin.orders.all')}</option>
          <option value="pending">{t('admin.orders.pending')}</option>
          <option value="completed">{t('admin.orders.completed')}</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.orders.orderDate')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.orders.company')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.orders.contact')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.orders.total')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.orders.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.orders.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr 
                key={order.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(order.orderDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{order.companyName}</div>
                  <div className="text-sm text-gray-500">{order.category}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{order.userEmail}</div>
                  <div className="text-sm text-gray-500">{order.contactNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  €{order.total.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
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
                    className={`px-4 py-2 rounded ${
                      order.status === 'pending'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-yellow-600 text-white hover:bg-yellow-700'
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{t('admin.orders.orderDetails')}</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {t('admin.orders.close')}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">{t('admin.orders.company')}</h3>
                  <p>{selectedOrder.companyName}</p>
                  <p className="text-gray-600">{selectedOrder.category}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t('admin.orders.contact')}</h3>
                  <p>{selectedOrder.userEmail}</p>
                  <p>{selectedOrder.contactNumber}</p>
                  <p>{selectedOrder.address}</p>
                </div>
              </div>

              <h3 className="font-semibold mb-2">{t('admin.orders.items')}</h3>
              <table className="min-w-full mb-4">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">{t('admin.orders.productName')}</th>
                    <th className="px-4 py-2 text-left">{t('admin.orders.size')}</th>
                    <th className="px-4 py-2 text-left">{t('admin.orders.quantity')}</th>
                    <th className="px-4 py-2 text-left">{t('admin.orders.price')}</th>
                    <th className="px-4 py-2 text-left">{t('admin.orders.subtotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{item.productName}</td>
                      <td className="px-4 py-2">{item.size}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">€{item.price.toFixed(2)}</td>
                      <td className="px-4 py-2">€{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="border-t font-semibold">
                    <td colSpan={4} className="px-4 py-2 text-right">{t('admin.orders.total')}:</td>
                    <td className="px-4 py-2">€{selectedOrder.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
