import React, { createContext, useContext, useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { OrderItem, OrderTotals, UserData } from '../types';
import { useAuth } from './AuthContext';
import { generatePDF } from '../api/generatePDF';

interface OrderContextType {
  items: OrderItem[];
  addItem: (item: OrderItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  sendOrder: (orderItems: OrderItem[], userData: UserData) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const { currentUser } = useAuth();

  const addItem = (item: OrderItem) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(i => 
        i.productId === item.productId && i.size === item.size
      );

      if (existingItem) {
        return prevItems.map(i =>
          i.productId === item.productId && i.size === item.size
            ? { ...i, quantity: Number(i.quantity) + Number(item.quantity) }
            : i
        );
      }

      return [...prevItems, item];
    });
  };

  const removeItem = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const calculateTotals = (items: OrderItem[]): OrderTotals => {
    return items.reduce((acc, item) => {
      const subtotal = Number(item.price) * Number(item.quantity);
      const vatAmount = (subtotal * (item.vatRate || 0)) / 100;
      return {
        subtotal: acc.subtotal + subtotal,
        vat7Total: acc.vat7Total + ((item.vatRate === 7) ? vatAmount : 0),
        vat19Total: acc.vat19Total + ((item.vatRate === 19) ? vatAmount : 0),
      };
    }, { subtotal: 0, vat7Total: 0, vat19Total: 0 });
  };

  const sendOrderEmail = async (orderId: string, orderItems: OrderItem[], totals: OrderTotals, total: number, userData: UserData) => {
    try {
      console.log('Preparing to send email with items:', orderItems);

      // Generate PDF
      const pdfBase64 = await generatePDF(orderId, orderItems, totals, total, userData);
      
      const url = 'https://api.brevo.com/v3/smtp/email';
      
      // Format the email parameters
      const emailParams = {
        address: userData.address || 'Not provided',
        category: userData.category || '',
        company_name: userData.companyName || '',
        contact_number: userData.contactNumber || 'Not provided',
        username: userData.username || 'Not provided',
        order_id: orderId,
        products: orderItems.map(item => ({
          price: Number(item.price).toFixed(2),
          product_name: item.productName,
          quantity: item.quantity,
          subtotal: (Number(item.price) * Number(item.quantity)).toFixed(2)
        })),
        subtotal: totals.subtotal.toFixed(2),
        total_amount: total.toFixed(2),
        vat_19: totals.vat19Total.toFixed(2),
        vat_7: totals.vat7Total.toFixed(2)
      };

      const data = {
        to: [{
          email: import.meta.env.VITE_ADMIN_EMAIL,
          name: "Admin"
        }],
        templateId: 2,
        params: emailParams,
        sender: {
          name: "Zellak Bestellungen",
          email: "zellak.bestellungen@gmail.com"
        },
        subject: `Neue Bestellung von ${userData.username}`,
        attachment: [{
          name: `order-${orderId}.pdf`,
          content: pdfBase64
        }]
      };

      console.log('Sending email with parameters:', JSON.stringify(emailParams, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': import.meta.env.VITE_BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send email. Status:', response.status);
        console.error('Response data:', errorData);
        throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
      }

      const responseData = await response.json();
      console.log('Email sent successfully:', responseData);
      console.log('Template variables sent:', emailParams);

    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      console.log('Environment variables:', {
        adminEmail: import.meta.env.VITE_ADMIN_EMAIL,
        hasApiKey: !!import.meta.env.VITE_BREVO_API_KEY
      });
      throw error;
    }
  };

  const sendOrder = async (orderItems: OrderItem[], userData: UserData) => {
    if (!currentUser || !userData || orderItems.length === 0) {
      throw new Error('Cannot create order: no items in cart or user not logged in');
    }

    try {
      const totals = calculateTotals(orderItems);
      const total = totals.subtotal + totals.vat7Total + totals.vat19Total;

      const orderData = {
        items: orderItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          variantId: item.variantId,
          size: item.size,
          quantity: Number(item.quantity),
          price: Number(item.price),
          total: Number(item.quantity) * Number(item.price),
          vatRate: item.vatRate || 0,
          vatAmount: (Number(item.quantity) * Number(item.price) * (item.vatRate || 0)) / 100
        })),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        username: userData.username,
        companyName: userData.companyName,
        address: userData.address || '',
        contactNumber: userData.contactNumber || '',
        category: userData.category || '',
        status: 'pending',
        subtotal: totals.subtotal,
        vat7Total: totals.vat7Total,
        vat19Total: totals.vat19Total,
        total,
        createdAt: serverTimestamp(),
        orderDate: serverTimestamp()
      };

      const ordersRef = collection(db, 'orders');
      const orderRef = await addDoc(ordersRef, orderData);
      
      // Send order confirmation email
      await sendOrderEmail(orderRef.id, orderItems, totals, total, userData);
    } catch (error: any) {
      console.error('Error creating order:', error);
      throw new Error(error.message || 'Failed to create order. Please try again.');
    }
  };

  return (
    <OrderContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      sendOrder
    }}>
      {children}
    </OrderContext.Provider>
  );
}