import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, QuoteItem, Customer, Product } from '../shared/schema';

interface QuoteWithDetails {
  quote: Quote & { customer: Customer };
  items: (QuoteItem & { product: Product })[];
}

export class PDFService {
  static generateQuotePDF(data: QuoteWithDetails): Buffer {
    const { quote, items } = data;
    const doc = new jsPDF();
    
    // Company header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ÓticaManager', 20, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestão para Óticas', 20, 30);
    
    // Quote title and number
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Orçamento #${quote.quoteNumber}`, 20, 50);
    
    // Quote details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const quoteDate = new Date(quote.createdAt!).toLocaleDateString('pt-BR');
    const validUntil = new Date(quote.validUntil).toLocaleDateString('pt-BR');
    
    doc.text(`Data: ${quoteDate}`, 20, 65);
    doc.text(`Válido até: ${validUntil}`, 20, 75);
    doc.text(`Status: ${quote.status === 'pending' ? 'Pendente' : quote.status === 'approved' ? 'Aprovado' : 'Rejeitado'}`, 20, 85);
    
    // Customer information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados do Cliente:', 20, 105);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${quote.customer.fullName}`, 20, 120);
    doc.text(`Email: ${quote.customer.email}`, 20, 130);
    doc.text(`Telefone: ${quote.customer.phone || 'Não informado'}`, 20, 140);
    
    if (quote.customer.cpf) {
      doc.text(`CPF: ${quote.customer.cpf}`, 20, 150);
    }
    
    // Address if available
    if (quote.customer.street) {
      const addressParts = [
        quote.customer.street,
        quote.customer.number,
        quote.customer.neighborhood,
        quote.customer.city,
        quote.customer.state
      ].filter(Boolean);
      
      if (addressParts.length > 0) {
        doc.text(`Endereço: ${addressParts.join(', ')}`, 20, 160);
        if (quote.customer.zipCode) {
          doc.text(`CEP: ${quote.customer.zipCode}`, 20, 170);
        }
      }
    }
    
    // Items table
    const tableData = items.map(item => [
      item.product.name,
      item.product.sku || '-',
      item.quantity.toString(),
      `R$ ${parseFloat(item.unitPrice).toFixed(2)}`,
      `R$ ${parseFloat(item.totalPrice).toFixed(2)}`
    ]);
    
    autoTable(doc, {
      head: [['Produto', 'SKU', 'Qtd', 'Preço Unit.', 'Total']],
      body: tableData,
      startY: 190,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 60 }, // Product name
        1: { cellWidth: 30 }, // SKU
        2: { cellWidth: 20, halign: 'center' }, // Quantity
        3: { cellWidth: 30, halign: 'right' }, // Unit price
        4: { cellWidth: 30, halign: 'right' } // Total price
      }
    });
    
    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY || 180;
    
    // Summary section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const subtotal = parseFloat(quote.totalAmount);
    const discount = quote.discountAmount ? parseFloat(quote.discountAmount) : 0;
    const finalAmount = quote.finalAmount ? parseFloat(quote.finalAmount) : subtotal - discount;
    
    const summaryY = finalY + 20;
    
    // Draw summary box
    doc.setDrawColor(200, 200, 200);
    doc.rect(120, summaryY - 5, 70, 40);
    
    doc.text('Subtotal:', 125, summaryY + 5);
    doc.text(`R$ ${subtotal.toFixed(2)}`, 170, summaryY + 5);
    
    if (discount > 0) {
      doc.text('Desconto:', 125, summaryY + 15);
      doc.text(`- R$ ${discount.toFixed(2)}`, 170, summaryY + 15);
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total Final:', 125, summaryY + 25);
    doc.text(`R$ ${finalAmount.toFixed(2)}`, 170, summaryY + 25);
    
    // Notes section if available
    if (quote.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Observações:', 20, summaryY + 50);
      
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(quote.notes, 170);
      doc.text(splitNotes, 20, summaryY + 60);
    }
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Documento gerado automaticamente pelo ÓticaManager', 20, pageHeight - 20);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, pageHeight - 10);
    
    // Return PDF buffer
    return Buffer.from(doc.output('arraybuffer'));
  }
}