import { OrderItem, OrderTotals, UserData } from '../types';
import jsPDF from 'jspdf';

const generateOrderPDF = async (
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
  
  // Helper function to truncate text
  const truncateText = (text: string, maxWidth: number) => {
    const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize();
    if (textWidth <= maxWidth) return text;
    
    let truncated = text;
    while (doc.getStringUnitWidth(truncated + '...') * doc.getFontSize() > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  };

  // Column positions and widths
  const columns = {
    product: { x: 25, width: 55 },   // Slightly shorter product column
    vat: { x: 85, width: 20 },       // Moved closer to product
    quantity: { x: 105, width: 20 },  // Adjusted position
    price: { x: 125, width: 25 },     // Adjusted position
    total: { x: 150, width: 25 }      // Adjusted position
  };

  // Table width constant
  const tableWidth = 160;  // Slightly reduced from 170 to prevent overflow

  // Table Header
  doc.setFillColor(...primaryColor);
  doc.rect(20, tableY, tableWidth, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Produkt', columns.product.x, tableY + 7);
  doc.text('MwSt.', columns.vat.x, tableY + 7);
  doc.text('Menge', columns.quantity.x, tableY + 7);
  doc.text('Preis', columns.price.x, tableY + 7);
  doc.text('Total', columns.total.x, tableY + 7);
  
  // Table Content
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'normal');
  let y = tableY + 15;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const variantRowHeight = 10;
  const productSpacing = 8; 
  const footerHeight = 30;

  // Group items by product name
  const groupedItems = orderItems.reduce((groups, item) => {
    if (!groups[item.productName]) {
      groups[item.productName] = [];
    }
    groups[item.productName].push(item);
    return groups;
  }, {} as { [key: string]: typeof orderItems });

  // Iterate through grouped items
  let rowIndex = 0;
  const entries = Object.entries(groupedItems);
  
  for (let i = 0; i < entries.length; i++) {
    const [productName, items] = entries[i];
    
    // Check if we need a new page for the product group
    const groupHeight = (variantRowHeight * items.length) + productSpacing;
    if (y + groupHeight > pageHeight - footerHeight - margin) {
      doc.addPage();
      y = margin + 15;
      
      // Redraw table header on new page
      doc.setFillColor(...primaryColor);
      doc.rect(20, y - 15, tableWidth, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Produkt', columns.product.x, y - 8);
      doc.text('MwSt.', columns.vat.x, y - 8);
      doc.text('Menge', columns.quantity.x, y - 8);
      doc.text('Preis', columns.price.x, y - 8);
      doc.text('Total', columns.total.x, y - 8);
      
      doc.setTextColor(...darkText);
      doc.setFont('helvetica', 'normal');
    }

    // Set background for the entire group
    if (rowIndex % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(20, y - 5, tableWidth, groupHeight + 5, 'F');
    }
    
    // Product name (no truncation)
    doc.setFontSize(10);
    doc.setTextColor(...darkText);
    doc.text(productName, columns.product.x, y);
    
    // Add each variant
    items.forEach((item, index) => {
      const variantY = y + ((index + 1) * variantRowHeight);
      
      // Check if variant needs a new page
      if (variantY > pageHeight - footerHeight - margin) {
        doc.addPage();
        y = margin + 15;
        
        // Redraw header on new page
        doc.setFillColor(...primaryColor);
        doc.rect(20, y - 15, tableWidth, 10, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Produkt', columns.product.x, y - 8);
        doc.text('MwSt.', columns.vat.x, y - 8);
        doc.text('Menge', columns.quantity.x, y - 8);
        doc.text('Preis', columns.price.x, y - 8);
        doc.text('Total', columns.total.x, y - 8);
        
        doc.setTextColor(...darkText);
        doc.setFont('helvetica', 'normal');
      }
      
      // Variant details with truncation
      doc.setFontSize(8);
      doc.setTextColor(...grayText);
      const variantText = item.size.replace(/^%\s*/, '');
      const truncatedVariant = truncateText(`└ ${variantText}`, columns.product.width - 2); 
      doc.text(truncatedVariant, columns.product.x + 5, variantY);
      
      // Reset style for other columns
      doc.setFontSize(10);
      doc.setTextColor(...darkText);
      
      const total = Number(item.price) * item.quantity;
      
      doc.text(`${item.vatRate}%`, columns.vat.x, variantY);
      doc.text(item.quantity.toString(), columns.quantity.x, variantY);
      doc.text(`€${Number(item.price).toFixed(2)}`, columns.price.x, variantY);
      doc.text(`€${total.toFixed(2)}`, columns.total.x, variantY);
    });
    
    y += groupHeight;
    
    // Add separator line between products (except for the last product)
    if (i < entries.length - 1) {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.line(20, y + 2, 20 + tableWidth, y + 2);
      y += productSpacing;
    }
    
    rowIndex++;
  };

  // Add totals section at current Y position
  y += 10;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(110, y, 190, y);

  // Check if totals section needs a new page
  if (y > pageHeight - footerHeight - margin - 40) {
    doc.addPage();
    y = margin + 15;
  }
  
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
  
  // Footer - Add at the bottom of the current page
  y = pageHeight - margin;
  doc.setTextColor(...grayText);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Vielen Dank für Ihren Auftrag!', 105, y - 10, { align: 'center' });
  
  // Add page numbers if there are multiple pages
  const pageCount = doc.internal.getNumberOfPages();
  if (pageCount > 1) {
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Seite ${i} von ${pageCount}`, 105, pageHeight - 5, { align: 'center' });
    }
  }
  
  // Return base64 string
  return doc.output('datauristring').split(',')[1];
};

export { generateOrderPDF };
