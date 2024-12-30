import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Percent } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

interface DiscountRule {
  id: string;
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  active: boolean;
  createdAt: Date;
}

export default function ManageDiscounts() {
  const { t } = useTranslation();
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch clients, products, and existing discount rules
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients
        const clientsSnapshot = await getDocs(collection(db, 'users'));
        const clientsData = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClients(clientsData);

        // Fetch products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);

        // Fetch discount rules
        const rulesSnapshot = await getDocs(collection(db, 'discountRules'));
        const rulesData = rulesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        setDiscountRules(rulesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedProduct || !discountValue) return;

    const client = clients.find(c => c.id === selectedClient);
    const product = sortedProducts.find(p => p.id === selectedProduct);

    console.log('Selected client:', {
      selectedId: selectedClient,
      client,
      username: client?.username,
      companyName: client?.companyName
    });

    console.log('Selected product:', {
      selectedId: selectedProduct,
      product
    });

    try {
      console.log('Creating new rule with data:', {
        clientId: client?.username || selectedClient,
        clientName: client?.companyName || client?.username || 'Unknown Client',
        productId: selectedProduct,
        productName: product?.name || 'Unknown Product',
        discountType,
        discountValue: Number(discountValue),
        active: true
      });

      const newRule = {
        clientId: client?.username || selectedClient,
        clientName: client?.companyName || client?.username || 'Unknown Client',
        productId: selectedProduct,
        productName: product?.name || 'Unknown Product',
        discountType,
        discountValue: Number(discountValue),
        active: true,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'discountRules'), newRule);
      console.log('Rule created with ID:', docRef.id);
      
      setDiscountRules(prev => [...prev, { id: docRef.id, ...newRule }]);
      
      // Reset form
      setSelectedClient('');
      setSelectedProduct('');
      setDiscountValue('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding discount rule:', error);
    }
  };

  const toggleRuleStatus = async (ruleId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'discountRules', ruleId), {
        active: !currentStatus
      });
      setDiscountRules(prev =>
        prev.map(rule =>
          rule.id === ruleId ? { ...rule, active: !currentStatus } : rule
        )
      );
    } catch (error) {
      console.error('Error toggling rule status:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      await deleteDoc(doc(db, 'discountRules', ruleId));
      setDiscountRules(prev => prev.filter(rule => rule.id !== ruleId));
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {t('admin.manageDiscounts')}
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('admin.addDiscountRule')}
        </button>
      </div>

      {/* Add New Rule Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">{t('admin.addDiscountRule')}</h2>
            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.selectClient')}
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  required
                >
                  <option value="">{t('admin.selectClient')}</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.companyName || client.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.selectProduct')}
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">{t('admin.selectProduct')}</option>
                  {sortedProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.discountType')}
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="percentage">{t('admin.percentageDiscount')}</option>
                  <option value="fixed">{t('admin.fixedDiscount')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.discountValue')}
                </label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  placeholder={discountType === 'percentage' ? '10' : '5.00'}
                  step={discountType === 'percentage' ? '1' : '0.01'}
                  min="0"
                  max={discountType === 'percentage' ? '100' : undefined}
                  required
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('admin.addRule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.client')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.product')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.discount')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {discountRules.map((rule) => (
              <tr key={rule.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{rule.clientName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{rule.productName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {rule.discountType === 'percentage' 
                      ? `${rule.discountValue}%`
                      : `€${rule.discountValue.toFixed(2)}`
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      rule.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {rule.active ? t('admin.active') : t('admin.inactive')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => toggleRuleStatus(rule.id, rule.active)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    {rule.active ? t('admin.deactivate') : t('admin.activate')}
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    {t('admin.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
