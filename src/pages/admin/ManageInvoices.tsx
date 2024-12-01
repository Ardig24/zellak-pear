import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useReactToPrint } from 'react-to-print';
import InvoicePDF from '../../components/InvoicePDF';
import { Download, Printer } from 'lucide-react';

interface Invoice {
  id: string;
  orderId: string;
  userEmail: string;
  companyName: string;
  invoiceNumber: string;
  total: number;
  createdAt: Timestamp;
  orderDate: string | Timestamp;
  items: any[];
  status: string;
}

export default function ManageInvoices() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const invoicesRef = collection(db, 'invoices');
      const q = query(invoicesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedInvoices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];

      setInvoices(fetchedInvoices);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(t('admin.invoices.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
  });

  const formatDate = (date: Timestamp | string) => {
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredInvoices = invoices.filter(invoice => {
    const searchLower = searchTerm.toLowerCase();
    return (
      invoice.userEmail?.toLowerCase().includes(searchLower) ||
      invoice.companyName?.toLowerCase().includes(searchLower) ||
      invoice.invoiceNumber?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        {t('admin.invoices.title')}
      </h1>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg mb-6 shadow-sm border border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('admin.invoices.searchPlaceholder')}
            className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <svg
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-white/30 border-b border-white/30">
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-1/6">
                  {t('admin.invoices.date')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-1/6">
                  {t('admin.invoices.company')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-1/6">
                  {t('admin.invoices.email')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-1/6">
                  {t('admin.invoices.total')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-1/6">
                  {t('admin.invoices.status')}
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider w-1/6">
                  {t('admin.invoices.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                    {searchTerm ? t('admin.invoices.noResults') : t('admin.invoices.noInvoices')}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="bg-white/20 hover:bg-white/30 transition-colors duration-200"
                  >
                    <td className="px-3 py-4 text-sm text-gray-800 whitespace-nowrap">
                      {formatDate(invoice.createdAt)}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-800 whitespace-nowrap">
                      {invoice.companyName}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-800 whitespace-nowrap">
                      {invoice.userEmail}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-800 whitespace-nowrap">
                      €{invoice.total.toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {t('admin.invoices.view')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">{t('admin.invoices.details')}</h3>
            <div className="flex space-x-2">
              <PDFDownloadLink
                document={<InvoicePDF invoice={selectedInvoice} />}
                fileName={`invoice-${selectedInvoice.id}.pdf`}
              >
                {({ loading }) => (
                  <button
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('admin.invoices.download')}
                  </button>
                )}
              </PDFDownloadLink>
              <button
                onClick={handlePrint}
                className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                {t('admin.invoices.print')}
              </button>
            </div>
          </div>

          {/* Printable Invoice Content */}
          <div ref={invoiceRef} className="bg-white rounded-lg p-6 shadow-lg">
            <div className="border-b pb-4 mb-4">
              <h4 className="text-2xl font-bold text-gray-800 mb-2">Invoice #{selectedInvoice.id}</h4>
              <p className="text-gray-600">{formatDate(selectedInvoice.createdAt)}</p>
            </div>

            <div className="mb-6">
              <h5 className="font-semibold text-gray-800 mb-2">{t('admin.invoices.customerDetails')}</h5>
              <p className="text-gray-700">{selectedInvoice.companyName}</p>
              <p className="text-gray-700">{selectedInvoice.userEmail}</p>
            </div>

            <div className="mb-6">
              <h5 className="font-semibold text-gray-800 mb-2">{t('admin.invoices.items')}</h5>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">{t('admin.invoices.item')}</th>
                    <th className="text-right py-2">{t('admin.invoices.quantity')}</th>
                    <th className="text-right py-2">{t('admin.invoices.price')}</th>
                    <th className="text-right py-2">{t('admin.invoices.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.name}</td>
                      <td className="text-right py-2">{item.quantity}</td>
                      <td className="text-right py-2">€{item.price.toFixed(2)}</td>
                      <td className="text-right py-2">€{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-right font-semibold py-4">{t('admin.invoices.total')}</td>
                    <td className="text-right font-bold py-4">€{selectedInvoice.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="text-gray-600 text-sm">
              <p>{t('admin.invoices.thankYou')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
