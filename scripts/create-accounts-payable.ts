import { db } from "../server/db";
import { accountsPayable, expenseCategories, suppliers } from "../shared/schema";

async function createAccountsPayable() {
  console.log("Creating sample accounts payable...");
  
  // Get existing suppliers and expense categories
  const existingSuppliers = await db.select().from(suppliers);
  const existingCategories = await db.select().from(expenseCategories);
  
  if (existingSuppliers.length === 0 || existingCategories.length === 0) {
    console.log("No suppliers or expense categories found. Please seed them first.");
    return;
  }
  
  // Create some accounts payable entries
  const accounts = [
    {
      supplierId: existingSuppliers[0].id,
      categoryId: existingCategories[0].id, // Aluguel
      userId: 1,
      description: 'Aluguel da loja - Janeiro 2025',
      totalAmount: '2500.00',
      remainingAmount: '2500.00',
      dueDate: new Date('2025-01-15'),
      status: 'pending' as const,
      notes: 'Pagamento mensal do aluguel'
    },
    {
      supplierId: existingSuppliers[1].id,
      categoryId: existingCategories[1].id, // Fornecedores
      userId: 1,
      description: 'Pagamento de produtos - Luxottica',
      totalAmount: '1200.00',
      remainingAmount: '1200.00',
      dueDate: new Date('2025-01-20'),
      status: 'pending' as const,
      notes: 'Pagamento referente à NF 12345'
    },
    {
      supplierId: existingSuppliers[2].id,
      categoryId: existingCategories[2].id, // Serviços
      userId: 1,
      description: 'Manutenção equipamentos - Dezembro 2024',
      totalAmount: '350.00',
      remainingAmount: '350.00',
      dueDate: new Date('2025-01-05'),
      status: 'pending' as const,
      notes: 'Manutenção preventiva dos equipamentos'
    },
    {
      supplierId: existingSuppliers[3].id,
      categoryId: existingCategories[3].id, // Marketing
      userId: 1,
      description: 'Campanha publicitária - Dezembro 2024',
      totalAmount: '800.00',
      remainingAmount: '800.00',
      dueDate: new Date('2025-01-10'),
      status: 'pending' as const,
      notes: 'Pagamento da campanha de final de ano'
    },
    {
      supplierId: existingSuppliers[4].id,
      categoryId: existingCategories[4].id, // Administrativo
      userId: 1,
      description: 'Material de escritório - Dezembro 2024',
      totalAmount: '150.00',
      remainingAmount: '150.00',
      dueDate: new Date('2025-01-08'),
      status: 'pending' as const,
      notes: 'Compra de materiais de escritório'
    }
  ];
  
  for (const account of accounts) {
    await db.insert(accountsPayable).values(account);
    console.log(`Created account payable: ${account.description} - R$ ${account.totalAmount}`);
  }
  
  console.log("✅ Sample accounts payable created successfully!");
}

createAccountsPayable().catch(console.error);