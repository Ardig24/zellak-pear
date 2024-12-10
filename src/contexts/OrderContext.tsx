import React, { createContext, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { OrderItem } from '../types';
import emailjs from '@emailjs/browser';

interface OrderContextType {
  sendOrder: (items: OrderItem[], userData: any) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | null>(null);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const sendOrderEmail = async (orderItems: OrderItem[], userData: any, orderId: string) => {
    try {
      const totals = orderItems.reduce((acc, item) => {
        const subtotal = Number(item.price) * Number(item.quantity);
        const vatAmount = (subtotal * item.vatRate) / 100;
        return {
          subtotal: acc.subtotal + subtotal,
          vat7Total: acc.vat7Total + (item.vatRate === 7 ? vatAmount : 0),
          vat19Total: acc.vat19Total + (item.vatRate === 19 ? vatAmount : 0),
        };
      }, { subtotal: 0, vat7Total: 0, vat19Total: 0 });
      
      const total = totals.subtotal + totals.vat7Total + totals.vat19Total;

      const orderDetailsString = orderItems.map(item => {
        const subtotal = Number(item.price) * Number(item.quantity);
        const vatAmount = (subtotal * item.vatRate) / 100;
        return `${item.productName} - ${item.size} - Quantity: ${item.quantity} - Price: €${Number(item.price).toFixed(2)} - Subtotal: €${subtotal.toFixed(2)} - VAT ${item.vatRate}%: €${vatAmount.toFixed(2)}`;
      }).join('\n');

      const templateParams = {
        to_email: import.meta.env.VITE_ADMIN_EMAIL,
        from_name: userData.companyName,
        company_name: userData.companyName,
        contact_number: userData.contactNumber || 'Not provided',
        address: userData.address || 'Not provided',
        email: userData.email || 'Not provided',
        category: userData.category,
        order_details: orderDetailsString,
        subtotal: `€${totals.subtotal.toFixed(2)}`,
        vat_7: `€${totals.vat7Total.toFixed(2)}`,
        vat_19: `€${totals.vat19Total.toFixed(2)}`,
        total_amount: `€${total.toFixed(2)}`,
        order_id: orderId
      };

      const response = await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      if (response.status === 200) {
        console.log('Order email sent successfully!');
        return true;
      }
    } catch (error) {
      console.error('Error sending order email:', error);
      // Don't throw here to prevent order failure due to email issues
    }
  };

  const sendOrder = async (items: OrderItem[], userData: any) => {
    try {
      if (!items.length) {
        throw new Error('Order cannot be empty');
      }

      const totals = items.reduce((acc, item) => {
        const subtotal = Number(item.price) * Number(item.quantity);
        const vatAmount = (subtotal * item.vatRate) / 100;
        return {
          subtotal: acc.subtotal + subtotal,
          vat7Total: acc.vat7Total + (item.vatRate === 7 ? vatAmount : 0),
          vat19Total: acc.vat19Total + (item.vatRate === 19 ? vatAmount : 0),
        };
      }, { subtotal: 0, vat7Total: 0, vat19Total: 0 });

      const total = totals.subtotal + totals.vat7Total + totals.vat19Total;

      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          variantId: item.variantId,
          size: item.size,
          quantity: Number(item.quantity),
          price: Number(item.price),
          total: Number(item.quantity) * Number(item.price),
          vatRate: item.vatRate,
          vatAmount: (Number(item.quantity) * Number(item.price) * item.vatRate) / 100
        })),
        userId: userData.id,
        userEmail: userData.email,
        companyName: userData.companyName,
        address: userData.address || '',
        contactNumber: userData.contactNumber || '',
        category: userData.category,
        status: 'pending',
        subtotal: totals.subtotal,
        vat7Total: totals.vat7Total,
        vat19Total: totals.vat19Total,
        total,
        createdAt: serverTimestamp(),
        orderDate: serverTimestamp()
      };

      console.log('Saving order to Firestore:', orderData);

      const ordersRef = collection(db, 'orders');
      const orderRef = await addDoc(ordersRef, orderData);

      console.log('Order saved to Firestore with ID:', orderRef.id);

      const hasEmailConfig = 
        import.meta.env.VITE_EMAILJS_SERVICE_ID && 
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID && 
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (hasEmailConfig) {
        await sendOrderEmail(items, userData, orderRef.id);
      } else {
        console.log('Email notification skipped - EmailJS not configured');
      }

      return orderRef.id;
    } catch (error: any) {
      console.error('Error in sendOrder:', error);
      throw new Error(
        error.message || 'Failed to send order. Please try again.'
      );
    }
  };

  return (
    <OrderContext.Provider value={{ sendOrder }}>
      {children}
    </OrderContext.Provider>
  );
}