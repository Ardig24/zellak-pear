import React, { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { Order, OrderItem } from '../types';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff'
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableCell: {
    padding: 5,
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  total: {
    marginTop: 20,
    fontSize: 14,
    textAlign: 'right',
  }
});

interface OrderInvoiceProps {
  order: Order;
  onClose?: () => void;
}

const InvoiceDocument: React.FC<{ order: Order }> = ({ order }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>INVOICE</Text>
        
        {/* Basic Info */}
        <Text style={styles.text}>Order ID: {order.id}</Text>
        <Text style={styles.text}>Date: {new Date(order.orderDate).toLocaleDateString()}</Text>
        
        {/* Company Info */}
        <Text style={styles.text}>Company: {order.companyName}</Text>
        <Text style={styles.text}>Address: {order.address}</Text>
        <Text style={styles.text}>Contact: {order.contactNumber}</Text>
        <Text style={styles.text}>Email: {order.userEmail}</Text>
        
        {/* Items Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text>Product</Text>
            </View>
            <View style={styles.tableCell}>
              <Text>Size</Text>
            </View>
            <View style={styles.tableCell}>
              <Text>Quantity</Text>
            </View>
            <View style={styles.tableCell}>
              <Text>Price</Text>
            </View>
            <View style={styles.tableCell}>
              <Text>Total</Text>
            </View>
          </View>
          
          {/* Items */}
          {order.items.map((item: OrderItem, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text>{item.productName}</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>{item.size}</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>€{item.price.toFixed(2)}</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>€{item.total.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>
        
        {/* Total */}
        <Text style={styles.total}>Total Amount: €{order.total.toFixed(2)}</Text>
      </View>
    </Page>
  </Document>
);

const OrderInvoice: React.FC<OrderInvoiceProps> = ({ order, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saveInvoice = async () => {
      try {
        // Create invoice number (YYYY-MM-[4-digit-sequence])
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const invoiceNumber = `${year}-${month}-${random}`;

        // Save invoice to Firestore
        const invoiceData = {
          orderId: order.id,
          invoiceNumber,
          companyName: order.companyName,
          userEmail: order.userEmail,
          address: order.address,
          contactNumber: order.contactNumber,
          items: order.items,
          total: order.total,
          createdAt: Timestamp.now(),
          orderDate: order.orderDate,
          status: 'pending'  // Always set initial status to pending
        };

        await addDoc(collection(db, 'invoices'), invoiceData);
      } catch (err) {
        console.error('Error saving invoice:', err);
        setError('Failed to save invoice');
      }
    };

    // Save the invoice when component mounts
    saveInvoice();

    // Set loading to false after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [order]);

  if (error) {
    return (
      <div className="w-full p-4 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full h-[70vh] relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      )}
      <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
        <InvoiceDocument order={order} />
      </PDFViewer>
    </div>
  );
};

export default OrderInvoice;
