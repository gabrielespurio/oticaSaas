import PDFDocument from 'pdfkit';
import { Quote, QuoteItem, Customer, Product } from '../shared/schema';

interface QuoteWithDetails {
  quote: Quote & { customer: Customer };
  items: (QuoteItem & { product: Product })[];
}

export class PDFService {
  static generateQuotePDF(data: QuoteWithDetails): Promise<Buffer> {
    const { quote, items } = data;
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    
    doc.on('data', buffers.push.bind(buffers));
    
    // Company header
    doc.fontSize(20).font('Helvetica-Bold').text('ÓticaManager', 50, 50);
    doc.fontSize(12).font('Helvetica').text('Sistema de Gestão para Óticas', 50, 75);
    
    // Quote title and number
    doc.fontSize(16).font('Helvetica-Bold').text(`Orçamento #${quote.quoteNumber}`, 50, 110);
    
    // Quote details
    const quoteDate = new Date(quote.createdAt!).toLocaleDateString('pt-BR');
    const validUntil = new Date(quote.validUntil).toLocaleDateString('pt-BR');
    const statusText = quote.status === 'pending' ? 'Pendente' : 
                      quote.status === 'approved' ? 'Aprovado' : 'Rejeitado';
    
    doc.fontSize(10).font('Helvetica');
    doc.text(`Data: ${quoteDate}`, 50, 140);
    doc.text(`Válido até: ${validUntil}`, 50, 155);
    doc.text(`Status: ${statusText}`, 50, 170);
    
    // Customer information
    doc.fontSize(12).font('Helvetica-Bold').text('Dados do Cliente:', 50, 200);
    
    doc.fontSize(10).font('Helvetica');
    let yPos = 220;
    doc.text(`Nome: ${quote.customer.fullName}`, 50, yPos);
    yPos += 15;
    
    if (quote.customer.email) {
      doc.text(`Email: ${quote.customer.email}`, 50, yPos);
      yPos += 15;
    }
    
    if (quote.customer.phone) {
      doc.text(`Telefone: ${quote.customer.phone}`, 50, yPos);
      yPos += 15;
    }
    
    if (quote.customer.cpf) {
      doc.text(`CPF: ${quote.customer.cpf}`, 50, yPos);
      yPos += 15;
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
        doc.text(`Endereço: ${addressParts.join(', ')}`, 50, yPos);
        yPos += 15;
        
        if (quote.customer.zipCode) {
          doc.text(`CEP: ${quote.customer.zipCode}`, 50, yPos);
          yPos += 15;
        }
      }
    }
    
    // Items table header
    yPos += 20;
    doc.fontSize(12).font('Helvetica-Bold').text('Itens do Orçamento:', 50, yPos);
    yPos += 25;
    
    // Table header
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Produto', 50, yPos);
    doc.text('SKU', 200, yPos);
    doc.text('Qtd', 280, yPos);
    doc.text('Preço Unit.', 320, yPos);
    doc.text('Total', 400, yPos);
    yPos += 20;
    
    // Draw header line
    doc.moveTo(50, yPos - 5).lineTo(500, yPos - 5).stroke();
    
    // Items
    doc.fontSize(9).font('Helvetica');
    items.forEach(item => {
      doc.text(item.product.name.substring(0, 20), 50, yPos);
      doc.text(item.product.sku || '-', 200, yPos);
      doc.text(item.quantity.toString(), 280, yPos);
      doc.text(`R$ ${parseFloat(item.unitPrice).toFixed(2)}`, 320, yPos);
      doc.text(`R$ ${parseFloat(item.totalPrice).toFixed(2)}`, 400, yPos);
      yPos += 15;
    });
    
    // Draw bottom line
    doc.moveTo(50, yPos).lineTo(500, yPos).stroke();
    yPos += 20;
    
    // Summary
    const subtotal = parseFloat(quote.totalAmount);
    const discount = quote.discountAmount ? parseFloat(quote.discountAmount) : 0;
    const finalAmount = quote.finalAmount ? parseFloat(quote.finalAmount) : subtotal - discount;
    
    doc.fontSize(10).font('Helvetica');
    doc.text(`Subtotal: R$ ${subtotal.toFixed(2)}`, 400, yPos);
    yPos += 15;
    
    if (discount > 0) {
      doc.text(`Desconto: -R$ ${discount.toFixed(2)}`, 400, yPos);
      yPos += 15;
    }
    
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Total Final: R$ ${finalAmount.toFixed(2)}`, 400, yPos);
    yPos += 30;
    
    // Notes
    if (quote.notes) {
      doc.fontSize(12).font('Helvetica-Bold').text('Observações:', 50, yPos);
      yPos += 20;
      doc.fontSize(10).font('Helvetica').text(quote.notes, 50, yPos, { width: 450 });
    }
    
    // Footer
    const pageHeight = doc.page.height;
    doc.fontSize(8).font('Helvetica');
    doc.text('Documento gerado automaticamente pelo ÓticaManager', 50, pageHeight - 50);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 50, pageHeight - 35);
    
    doc.end();
    
    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }
}