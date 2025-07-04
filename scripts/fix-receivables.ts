import { db } from "../server/db";
import { sales, financialAccounts } from "../shared/schema";
import { eq, and } from "drizzle-orm";

async function fixReceivables() {
  console.log("Fixing accounts receivable for existing sales...");
  
  // Get all sales that should have receivables but don't
  const salesWithoutReceivables = await db.select().from(sales).where(
    and(
      eq(sales.paymentStatus, "pending")
    )
  );
  
  for (const sale of salesWithoutReceivables) {
    console.log(`Processing sale ${sale.saleNumber} (${sale.paymentMethod})`);
    
    // Check if receivables already exist for this sale
    const existingReceivables = await db.select().from(financialAccounts).where(
      and(
        eq(financialAccounts.saleId, sale.id),
        eq(financialAccounts.type, "receivable")
      )
    );
    
    if (existingReceivables.length > 0) {
      console.log(`  - Already has ${existingReceivables.length} receivables`);
      continue;
    }
    
    // Create receivables based on payment method
    if (sale.paymentMethod === 'crediario') {
      // For crediário, create installments
      const installmentCount = sale.installments || 1;
      const installmentAmount = parseFloat(sale.finalAmount) / installmentCount;
      const today = new Date();
      
      for (let i = 1; i <= installmentCount; i++) {
        const dueDate = new Date(today);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        await db.insert(financialAccounts).values({
          customerId: sale.customerId,
          saleId: sale.id,
          type: 'receivable',
          description: `Parcela ${i}/${installmentCount} - Venda #${sale.saleNumber}`,
          amount: installmentAmount.toFixed(2),
          dueDate,
          status: 'pending',
        });
        
        console.log(`  - Created receivable ${i}/${installmentCount}: R$ ${installmentAmount.toFixed(2)}`);
      }
    } else if (sale.paymentMethod === 'cartao' && sale.installments && sale.installments > 1) {
      // For card with installments
      const installmentCount = sale.installments;
      const installmentAmount = parseFloat(sale.finalAmount) / installmentCount;
      const today = new Date();
      
      for (let i = 1; i <= installmentCount; i++) {
        const dueDate = new Date(today);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        await db.insert(financialAccounts).values({
          customerId: sale.customerId,
          saleId: sale.id,
          type: 'receivable',
          description: `Parcela ${i}/${installmentCount} (Cartão de Crédito) - Venda #${sale.saleNumber}`,
          amount: installmentAmount.toFixed(2),
          dueDate,
          status: 'pending',
        });
        
        console.log(`  - Created receivable ${i}/${installmentCount}: R$ ${installmentAmount.toFixed(2)}`);
      }
    } else if (sale.paymentStatus === 'pending') {
      // For any other pending payment, create a single receivable
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);
      
      await db.insert(financialAccounts).values({
        customerId: sale.customerId,
        saleId: sale.id,
        type: 'receivable',
        description: `Venda #${sale.saleNumber} - ${sale.paymentMethod === 'dinheiro' ? 'Dinheiro' : sale.paymentMethod === 'pix' ? 'PIX' : 'Pagamento'} Pendente`,
        amount: sale.finalAmount,
        dueDate,
        status: 'pending',
      });
      
      console.log(`  - Created single receivable: R$ ${sale.finalAmount}`);
    }
  }
  
  console.log("✅ Receivables fixed successfully!");
}

fixReceivables().catch(console.error);