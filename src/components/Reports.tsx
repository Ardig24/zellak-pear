// src/components/Reports.tsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { User, Product } from '../types';
import { useTranslation } from 'react-i18next';

export default function Reports() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [reportType, setReportType] = useState<'user' | 'product'>('user');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const productsSnapshot = await getDocs(collection(db, 'products'));
        
        setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[]);
        setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Reset selections and report data when switching report type
  const handleReportTypeChange = (type: 'user' | 'product') => {
    setReportType(type);
    setSelectedUser('');
    setSelectedProduct('');
    setReportData(null);
    setError(null);
  };

  const fetchUserReport = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Get the user's email first
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        throw new Error('User not found');
      }

      const userEmail = userDocSnap.data().email;
      if (!userEmail) {
        throw new Error('User email not found');
      }

      const ordersQuery = query(collection(db, 'orders'), where('userEmail', '==', userEmail));
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order: any) => sum + order.total, 0);
      const orderHistory = orders.map((order: any) => ({
        date: order.orderDate,
        amount: order.total,
        items: order.items
      }));

      setReportData({
        totalOrders,
        totalSpent,
        orderHistory
      });
    } catch (err) {
      setError('Failed to fetch user report');
      console.error('Error fetching user report:', err);
    }
    setLoading(false);
  };

  const fetchProductReport = async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const productOrders = orders.filter((order: any) => 
        order.items.some((item: any) => item.productId === productId)
      );

      const totalSold = productOrders.reduce((sum, order: any) => 
        sum + order.items.find((item: any) => item.productId === productId).quantity, 0
      );

      const revenue = productOrders.reduce((sum, order: any) => {
        const item = order.items.find((item: any) => item.productId === productId);
        return sum + (item.price * item.quantity);
      }, 0);

      // Format the orders to include proper dates
      const formattedOrders = productOrders.map((order: any) => ({
        ...order,
        orderDate: order.orderDate ? new Date(order.orderDate).toISOString() : new Date().toISOString(),
        items: order.items.map((item: any) => ({
          ...item,
          date: order.orderDate ? new Date(order.orderDate).toISOString() : new Date().toISOString()
        }))
      }));

      setReportData({
        totalSold,
        revenue,
        orders: formattedOrders
      });
    } catch (err) {
      setError('Failed to fetch product report');
      console.error('Error fetching product report:', err);
    }
    setLoading(false);
  };

  const handleGenerateReport = () => {
    if (reportType === 'user' && selectedUser) {
      fetchUserReport(selectedUser);
    } else if (reportType === 'product' && selectedProduct) {
      fetchProductReport(selectedProduct);
    }
  };

  if (loading && !reportData) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-black drop-shadow-lg">{t('reports.dashboard')}</h1>
      
      {/* Report Type Selection */}
      <div className="glass-panel p-4 sm:p-6 rounded-lg mb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 mb-4">
          <button
            className={`glass-button px-4 py-3 sm:py-2 rounded-lg transition-all duration-200 flex-1 ${
              reportType === 'user' 
                ? 'bg-orange-500/20 text-orange-800 font-bold' 
                : 'hover:bg-gray-500/20'
            }`}
            onClick={() => handleReportTypeChange('user')}
          >
            {t('reports.userReport')}
          </button>
          <button
            className={`glass-button px-4 py-3 sm:py-2 rounded-lg transition-all duration-200 flex-1 ${
              reportType === 'product' 
                ? 'bg-orange-500/20 text-orange-800 font-bold' 
                : 'hover:bg-gray-500/20'
            }`}
            onClick={() => handleReportTypeChange('product')}
          >
            {t('reports.productReport')}
          </button>
        </div>

        {/* Selection Dropdown */}
        {reportType === 'user' ? (
          <select
            className="glass-input w-full p-3 rounded-lg mb-4 text-black"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">{t('reports.selectUser')}</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username} - {user.companyName}
              </option>
            ))}
          </select>
        ) : (
          <select
            className="glass-input w-full p-3 rounded-lg mb-4 text-black"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">{t('reports.selectProduct')}</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        )}

        <button
          className="glass-button w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleGenerateReport}
          disabled={!(selectedUser || selectedProduct)}
        >
          {t('reports.generateReport')}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading && reportData && <LoadingSpinner />}

      {/* Report Results */}
      {reportData && !loading && (
        <div className="glass-panel rounded-lg p-4 sm:p-6">
          {reportType === 'user' ? (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-6 text-black">{t('reports.userReport')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="glass-panel p-4 rounded-lg">
                  <p className="text-base sm:text-lg font-semibold text-black">{t('reports.totalOrders')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-black">{reportData.totalOrders}</p>
                </div>
                <div className="glass-panel p-4 rounded-lg">
                  <p className="text-base sm:text-lg font-semibold text-black">{t('reports.totalSpent')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-black">€{reportData.totalSpent.toFixed(2)}</p>
                </div>
              </div>

              {/* Mobile View - Cards */}
              <div className="block sm:hidden">
                <h4 className="text-lg font-bold mb-4 text-black">{t('reports.orderHistory')}</h4>
                <div className="space-y-4">
                  {reportData.orderHistory.map((order: any, index: number) => (
                    <div key={index} className="glass-panel p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {new Date(order.date).toLocaleDateString()}
                        </span>
                        <span className="font-medium text-black">
                          €{order.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-black">
                        {order.items.length} {t('reports.items')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop View - Table */}
              <div className="hidden sm:block">
                <h4 className="text-xl font-bold mb-4 text-black">{t('reports.orderHistory')}</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full glass-table">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-black">{t('reports.date')}</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-black">{t('reports.amount')}</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-black">{t('reports.items')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/30">
                      {reportData.orderHistory.map((order: any, index: number) => (
                        <tr key={index} className="hover:bg-white/10 transition-colors duration-200">
                          <td className="px-4 py-3 text-black">
                            {new Date(order.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-black">
                            €{order.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-black">
                            {order.items.length} {t('reports.items')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-6 text-black">{t('reports.productReport')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="glass-panel p-4 rounded-lg">
                  <p className="text-base sm:text-lg font-semibold text-black">{t('reports.totalUnitsSold')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-black">{reportData.totalSold}</p>
                </div>
                <div className="glass-panel p-4 rounded-lg">
                  <p className="text-base sm:text-lg font-semibold text-black">{t('reports.totalRevenue')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-black">€{reportData.revenue.toFixed(2)}</p>
                </div>
              </div>

              {/* Mobile View - Cards */}
              <div className="block sm:hidden">
                <h4 className="text-lg font-bold mb-4 text-black">{t('reports.orderHistory')}</h4>
                <div className="space-y-4">
                  {reportData.orders.map((order: any, index: number) => {
                    const item = order.items.find((item: any) => item.productId === selectedProduct);
                    return (
                      <div key={index} className="glass-panel p-4 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </span>
                          <span className="font-medium text-black">
                            €{item.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-sm text-black">
                          {t('reports.quantity')}: {item.quantity}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop View - Table */}
              <div className="hidden sm:block">
                <h4 className="text-xl font-bold mb-4 text-black">{t('reports.orderHistory')}</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full glass-table">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-black">{t('reports.date')}</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-black">{t('reports.quantity')}</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-black">{t('reports.price')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/30">
                      {reportData.orders.map((order: any, index: number) => {
                        const item = order.items.find((item: any) => item.productId === selectedProduct);
                        return (
                          <tr key={index} className="hover:bg-white/10 transition-colors duration-200">
                            <td className="px-4 py-3 text-black">
                              {new Date(order.orderDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-black">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-black">
                              €{item.price.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
