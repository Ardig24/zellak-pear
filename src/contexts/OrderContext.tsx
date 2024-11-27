import React, { createContext, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { OrderItem } from '../types';
import emailjs from '@emailjs/browser';

// Add constants for EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

interface OrderContextType {
  sendOrder: (items: OrderItem[], userData: any) => Promise<string>;
}

const OrderContext = createContext<OrderContextType | null>(null);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

const sendOrderEmail = async (orderItems: OrderItem[], userData: any, orderId: string) => {
  try {
    const total = orderItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    
    const templateParams = {
      to_email: ADMIN_EMAIL || 'admin@example.com',
              from_name: userData.companyName,
      order_details: orderItems.map(item => ({
        productName: item.productName,
        size: item.size,
        quantity: item.quantity,
        price: Number(item.price).toFixed(2),
        subtotal: (Number(item.price) * Number(item.quantity)).toFixed(2)
      })),
      total: total.toFixed(2),
      customer_details: {
        company: userData.companyName,
        contact: userData.contactNumber || 'Not provided',
        address: userData.address || 'Not provided',
        email: userData.email || 'Not provided',
        category: userData.category
            },
      order_id: orderId
  };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
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

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const sendOrder = async (items: OrderItem[], userData: any) => {
    try {
      if (!items.length) {
        throw new Error('Order cannot be empty');
      }

      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          variantId: item.variantId,
          size: item.size,
          quantity: Number(item.quantity),
          price: Number(item.price),
          total: Number(item.quantity) * Number(item.price)
        })),
        userId: userData.id,
        userEmail: userData.email,
        companyName: userData.companyName,
        address: userData.address || '',
        contactNumber: userData.contactNumber || '',
        category: userData.category,
        status: 'pending',
        total: items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0),
        createdAt: serverTimestamp(),
        orderDate: new Date().toISOString()
      };

      console.log('Saving order to Firestore:', orderData);

      const ordersRef = collection(db, 'orders');
      const orderRef = await addDoc(ordersRef, orderData);

      console.log('Order saved to Firestore with ID:', orderRef.id);

      // Check if EmailJS is properly configured
      const hasEmailConfig = EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY;

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