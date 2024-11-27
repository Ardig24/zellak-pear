// src/components/Reports.tsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { User, Product } from '../types';

export default function Reports() {
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
      const ordersQuery = query(collection(db, 'orders'), where('userId', '==', userId));
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order: any) => sum + order.totalAmount, 0);
      const orderHistory = orders.map((order: any) => ({
        date: order.date,
        amount: order.totalAmount,
        items: order.items
      }));

      setReportData({
        totalOrders,
        totalSpent,
        orderHistory
      });
    } catch (err) {
      setError('Failed to fetch user report');
    }
    setLoading(false);
  };

  const fetchProductReport = async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orders = ordersSnapshot.docs.map(doc => doc.data());

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

      setReportData({
        totalSold,
        revenue,
        orders: productOrders
      });
    } catch (err) {
      setError('Failed to fetch product report');
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
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Reports Dashboard</h2>
      
      {/* Report Type Selection */}
      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${
              reportType === 'user' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => handleReportTypeChange('user')}
          >
            User Report
          </button>
          <button
            className={`px-4 py-2 rounded ${
              reportType === 'product' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => handleReportTypeChange('product')}
          >
            Product Report
          </button>
        </div>

        {/* Selection Dropdown */}
        {reportType === 'user' ? (
          <select
            className="w-full p-2 border rounded mb-4"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">Select a user</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username} - {user.companyName}
              </option>
            ))}
          </select>
        ) : (
          <select
            className="w-full p-2 border rounded mb-4"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">Select a product</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        )}

        <button
          className="bg-orange-600 text-white px-4 py-2 rounded disabled:bg-gray-300"
          onClick={handleGenerateReport}
          disabled={!(selectedUser || selectedProduct)}
        >
          Generate Report
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading && reportData && <LoadingSpinner />}

      {/* Report Results */}
      {reportData && !loading && (
        <div className="bg-white rounded-lg shadow p-6">
          {reportType === 'user' ? (
            <div>
              <h3 className="text-xl font-semibold mb-4">User Report</h3>
              <p>Total Orders: {reportData.totalOrders}</p>
              <p>Total Spent: €{reportData.totalSpent.toFixed(2)}</p>
              <h4 className="font-semibold mt-4 mb-2">Order History</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orderHistory.map((order: any, index: number) => (
                      <tr key={index}>
                        <td className="border px-4 py-2">
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                        <td className="border px-4 py-2">
                          €{order.amount.toFixed(2)}
                        </td>
                        <td className="border px-4 py-2">
                          {order.items.length} items
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-semibold mb-4">Product Report</h3>
              <p>Total Units Sold: {reportData.totalSold}</p>
              <p>Total Revenue: €{reportData.revenue.toFixed(2)}</p>
              <h4 className="font-semibold mt-4 mb-2">Order History</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Quantity</th>
                      <th className="px-4 py-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orders.map((order: any, index: number) => (
                      <tr key={index}>
                        <td className="border px-4 py-2">
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                        <td className="border px-4 py-2">
                          {order.items.find((item: any) => 
                            item.productId === selectedProduct
                          ).quantity}
                        </td>
                        <td className="border px-4 py-2">
                          €{order.items.find((item: any) => 
                            item.productId === selectedProduct
                          ).price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
