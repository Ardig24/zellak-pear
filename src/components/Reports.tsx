// src/components/Reports.tsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { User, Product } from '../types';
import { useTranslation } from 'react-i18next';

// Utility function to format date as DD/MM/YYYY
const formatDate = (date: Date | string | { seconds: number } | undefined): string => {
  if (!date) return 'N/A';
  
  let dateObj: Date;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'object' && 'seconds' in date) {
    dateObj = new Date(date.seconds * 1000);
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    return 'N/A';
  }

  if (isNaN(dateObj.getTime())) return 'N/A';

  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

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
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], // Last month
    endDate: new Date().toISOString().split('T')[0] // Today
  });

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

      // Get all orders first
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter orders by user email and date range
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);

      console.log('Filtering orders for user:', userEmail);
      console.log('Date range:', startDate, ' to ', endDate);
      console.log('All orders:', allOrders);

      const filteredOrders = allOrders.filter((order: any) => {
        if (!order.userEmail || !order.orderDate) return false;
        
        let orderDate;
        if (order.orderDate instanceof Date) {
          orderDate = order.orderDate;
        } else if (order.orderDate.seconds) {
          orderDate = new Date(order.orderDate.seconds * 1000);
        } else if (typeof order.orderDate === 'string') {
          orderDate = new Date(order.orderDate);
        }

        if (!orderDate || isNaN(orderDate.getTime())) return false;

        return (
          order.userEmail === userEmail &&
          orderDate >= startDate &&
          orderDate <= endDate
        );
      });

      console.log('Filtered orders:', filteredOrders);

      const totalOrders = filteredOrders.length;
      const totalSpent = filteredOrders.reduce((sum, order: any) => {
        return sum + (typeof order.total === 'number' ? order.total : 0);
      }, 0);

      const orderHistory = filteredOrders
        .map((order: any) => {
          let orderDate;
          if (order.orderDate instanceof Date) {
            orderDate = order.orderDate;
          } else if (order.orderDate.seconds) {
            orderDate = new Date(order.orderDate.seconds * 1000);
          } else if (typeof order.orderDate === 'string') {
            orderDate = new Date(order.orderDate);
          } else {
            orderDate = new Date();
          }

          return {
            date: orderDate,
            amount: order.total || 0,
            items: Array.isArray(order.items) ? order.items : []
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by date descending (newest first)
        .map(order => ({
          ...order,
          date: order.date.toISOString() // Convert back to ISO string after sorting
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
      // Get the product details first to verify it exists
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (!productDoc.exists()) {
        throw new Error('Product not found');
      }

      // Get all orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log('All orders for product report:', allOrders);

      // Filter and process orders
      const processedOrders = allOrders
        .filter((order: any) => {
          // First check if order has valid date and items
          if (!order.orderDate || !order.items || !Array.isArray(order.items)) {
            return false;
          }

          // Check if order contains the product
          return order.items.some((item: any) => item && item.productId === productId);
        })
        .map((order: any) => {
          // Parse the date
          let orderDate;
          if (order.orderDate instanceof Date) {
            orderDate = order.orderDate;
          } else if (order.orderDate.seconds) {
            orderDate = new Date(order.orderDate.seconds * 1000);
          } else if (typeof order.orderDate === 'string') {
            orderDate = new Date(order.orderDate);
          } else {
            orderDate = new Date();
          }

          // Find the specific product in the order
          const productItem = order.items.find((item: any) => item.productId === productId);

          return {
            date: orderDate,
            quantity: productItem?.quantity || 0,
            price: productItem?.price || 0,
            total: (productItem?.quantity || 0) * (productItem?.price || 0)
          };
        })
        .filter((order) => {
          // Filter by date range
          const startDate = new Date(dateRange.startDate);
          const endDate = new Date(dateRange.endDate);
          endDate.setHours(23, 59, 59, 999);
          
          return order.date >= startDate && order.date <= endDate;
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by date descending
        .map(order => ({
          ...order,
          date: order.date.toISOString() // Convert date back to string for display
        }));

      // Calculate totals
      const totalSold = processedOrders.reduce((sum, order) => sum + order.quantity, 0);
      const revenue = processedOrders.reduce((sum, order) => sum + order.total, 0);

      setReportData({
        totalSold,
        revenue,
        orders: processedOrders
      });
    } catch (err) {
      console.error('Error fetching product report:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch product report');
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
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">{t('reports.dashboard')}</h1>
      
      {/* Report Type Selection */}
      <div className="bg-white shadow-md p-4 sm:p-6 rounded-lg mb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 mb-4">
          <button
            className={`px-4 py-3 sm:py-2 rounded-lg transition-all duration-200 flex-1 ${
              reportType === 'user' 
                ? 'bg-blue-600 text-white font-bold' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => handleReportTypeChange('user')}
          >
            {t('reports.userReport')}
          </button>
          <button
            className={`px-4 py-3 sm:py-2 rounded-lg transition-all duration-200 flex-1 ${
              reportType === 'product' 
                ? 'bg-blue-600 text-white font-bold' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => handleReportTypeChange('product')}
          >
            {t('reports.productReport')}
          </button>
        </div>

        {/* Date Range Selection */}
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">
              {t('reports.startDate')}
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              max={dateRange.endDate}
              className="w-full p-3 rounded-lg text-gray-700 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">
              {t('reports.endDate')}
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              min={dateRange.startDate}
              max={new Date().toISOString().split('T')[0]}
              className="w-full p-3 rounded-lg text-gray-700 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
            />
          </div>
        </div>

        {/* Selection Dropdown */}
        {reportType === 'user' ? (
          <select
            className="w-full p-3 rounded-lg mb-4 text-gray-700 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
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
            className="w-full p-3 rounded-lg mb-4 text-gray-700 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
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
          className="w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
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
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
          {reportType === 'user' ? (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">{t('reports.userReport')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-base sm:text-lg font-semibold text-gray-700">{t('reports.totalOrders')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">{reportData.totalOrders}</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-base sm:text-lg font-semibold text-gray-700">{t('reports.totalSpent')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">€{reportData.totalSpent.toFixed(2)}</p>
                </div>
              </div>

              {/* Mobile View - Cards */}
              <div className="block sm:hidden">
                <h4 className="text-lg font-bold mb-4 text-gray-800">{t('reports.orderHistory')}</h4>
                <div className="space-y-4">
                  {reportData.orderHistory.map((order: any, index: number) => (
                    <div key={index} className="bg-gray-100 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {formatDate(order.date)}
                        </span>
                        <span className="font-medium text-gray-800">
                          €{order.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-800">
                        {order.items.length} {t('reports.items')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop View - Table */}
              <div className="hidden sm:block">
                <h4 className="text-xl font-bold mb-4 text-gray-800">{t('reports.orderHistory')}</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-800">{t('reports.date')}</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-800">{t('reports.amount')}</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-800">{t('reports.items')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.orderHistory.map((order: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-100 transition-colors duration-200">
                          <td className="px-4 py-3 text-gray-800">
                            {formatDate(order.date)}
                          </td>
                          <td className="px-4 py-3 text-gray-800">
                            €{order.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-gray-800">
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
              <h3 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">{t('reports.productReport')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-base sm:text-lg font-semibold text-gray-700">{t('reports.totalUnitsSold')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">{reportData.totalSold}</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-base sm:text-lg font-semibold text-gray-700">{t('reports.totalRevenue')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">€{reportData.revenue.toFixed(2)}</p>
                </div>
              </div>

              {/* Mobile View - Cards */}
              <div className="block sm:hidden">
                <h4 className="text-lg font-bold mb-4 text-gray-800">{t('reports.orderHistory')}</h4>
                <div className="space-y-4">
                  {reportData.orders.map((order: any, index: number) => (
                    <div key={index} className="bg-gray-100 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {formatDate(order.date)}
                        </span>
                        <span className="font-medium text-gray-800">
                          €{order.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-800">
                        {t('reports.quantity')}: {order.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop View - Table */}
              <div className="hidden sm:block">
                <h4 className="text-xl font-bold mb-4 text-gray-800">{t('reports.orderHistory')}</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-800">{t('reports.date')}</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-800">{t('reports.quantity')}</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-800">{t('reports.price')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.orders.map((order: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-100 transition-colors duration-200">
                          <td className="px-4 py-3 text-gray-800">
                            {formatDate(order.date)}
                          </td>
                          <td className="px-4 py-3 text-gray-800">
                            {order.quantity}
                          </td>
                          <td className="px-4 py-3 text-gray-800">
                            €{order.price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
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
