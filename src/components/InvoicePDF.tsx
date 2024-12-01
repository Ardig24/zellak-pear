import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface InvoiceProps {
  invoice: {
    id: string;
    createdAt: string;
    companyName: string;
    userEmail: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    total: number;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  customerInfo: {
    marginBottom: 30,
  },
  customerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  customerText: {
    fontSize: 12,
    color: '#333',
  },
  table: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCol: {
    flex: 1,
  },
  tableCell: {
    fontSize: 12,
    color: '#333',
  },
  tableCellRight: {
    fontSize: 12,
    color: '#333',
    textAlign: 'right',
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
  },
});

const InvoicePDF: React.FC<InvoiceProps> = ({ invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoice #{invoice.id}</Text>
        <Text style={styles.date}>{new Date(invoice.createdAt).toLocaleDateString()}</Text>
      </View>

      <View style={styles.customerInfo}>
        <Text style={styles.customerTitle}>Customer Details</Text>
        <Text style={styles.customerText}>{invoice.companyName}</Text>
        <Text style={styles.customerText}>{invoice.userEmail}</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Item</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCellRight}>Quantity</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCellRight}>Price</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCellRight}>Total</Text></View>
        </View>

        {invoice.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.name}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCellRight}>{item.quantity}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCellRight}>€{item.price.toFixed(2)}</Text></View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCellRight}>€{(item.quantity * item.price).toFixed(2)}</Text>
            </View>
          </View>
        ))}

        <View style={styles.total}>
          <View style={[styles.tableCol, { flex: 3 }]}>
            <Text style={styles.totalText}>Total:</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={[styles.totalText, styles.tableCellRight]}>€{invoice.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>
        Thank you for your business!
      </Text>
    </Page>
  </Document>
);

export default InvoicePDF;
