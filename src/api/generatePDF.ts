import { generateOrderPDF } from '../services/pdfService';
import { OrderItem, OrderTotals, UserData } from '../types';

export const generatePDF = async (
  orderId: string,
  orderItems: OrderItem[],
  totals: OrderTotals,
  total: number,
  userData: UserData
): Promise<string> => {
  try {
    const base64PDF = await generateOrderPDF(orderId, orderItems, totals, total, userData);
    return base64PDF;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
