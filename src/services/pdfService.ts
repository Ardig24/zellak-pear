import { OrderItem, OrderTotals, UserData } from '../types';
import jsPDF from 'jspdf';

export const generateOrderPDF = async (
  orderId: string,
  orderItems: OrderItem[],
  totals: OrderTotals,
  total: number,
  userData: UserData
): Promise<string> => {
  // Create PDF with German character support
  const doc = new jsPDF();
  
  // Colors
  const primaryColor = [66, 133, 244];  // #4285f4
  const grayText = [102, 102, 102];     // #666666
  const darkText = [51, 51, 51];        // #333333
  
  // Header section
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 220, 40, 'F');
  
  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Auftragsbestätigung', 20, 25);
  doc.setFontSize(12);
  doc.text(`Bestellung #${orderId}`, 20, 35);
  
  // Reset text color for body
  doc.setTextColor(...darkText);
  
  // Date on the right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const today = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(today, 170, 35, { align: 'right' });
  
  // Customer Info Box
  const customerY = 50;
  doc.setFillColor(247, 247, 247);  // Light gray background
  doc.rect(20, customerY, 170, 40, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Kundeninformationen', 25, customerY + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...grayText);
  doc.text([
    `Firma: ${userData.companyName || 'Nicht angegeben'}`,
    `Benutzername: ${userData.username || 'Nicht angegeben'}`,
    `Telefon: ${userData.contactNumber || 'Nicht angegeben'}`
  ], 25, customerY + 20);
  
  // Products Table
  const tableY = 100;
  
  // Table Header
  doc.setFillColor(...primaryColor);
  doc.rect(20, tableY, 170, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Produkt', 25, tableY + 7);
  doc.text('Menge', 100, tableY + 7);
  doc.text('Preis', 130, tableY + 7);
  doc.text('MwSt.', 160, tableY + 7);
  
  // Table Content
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'normal');
  let y = tableY + 15;
  
  // Alternate row colors
  orderItems.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(20, y - 5, 170, 10, 'F');
    }
    
    doc.text(item.productName, 25, y);
    doc.text(item.quantity.toString(), 100, y);
    doc.text(`€${Number(item.price).toFixed(2)}`, 130, y);
    doc.text(`${item.vatRate}%`, 160, y);
    y += 10;
  });
  
  // Totals Section
  y += 10;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(110, y, 190, y);
  
  // Subtotals
  y += 10;
  doc.setTextColor(...grayText);
  doc.text('Zwischensumme:', 130, y);
  doc.setTextColor(...darkText);
  doc.text(`€${totals.subtotal.toFixed(2)}`, 170, y, { align: 'right' });
  
  y += 8;
  doc.setTextColor(...grayText);
  doc.text('MwSt. 7%:', 130, y);
  doc.setTextColor(...darkText);
  doc.text(`€${totals.vat7Total.toFixed(2)}`, 170, y, { align: 'right' });
  
  y += 8;
  doc.setTextColor(...grayText);
  doc.text('MwSt. 19%:', 130, y);
  doc.setTextColor(...darkText);
  doc.text(`€${totals.vat19Total.toFixed(2)}`, 170, y, { align: 'right' });
  
  // Total
  y += 10;
  doc.setFillColor(...primaryColor);
  doc.rect(110, y - 5, 80, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Gesamtsumme:', 130, y + 4);
  doc.text(`€${total.toFixed(2)}`, 170, y + 4, { align: 'right' });
  
  // Footer
  const footerY = 270;
  doc.setTextColor(...grayText);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Vielen Dank für Ihren Auftrag!', 105, footerY, { align: 'center' });
  
  // Return base64 string
  return doc.output('datauristring').split(',')[1];
};
