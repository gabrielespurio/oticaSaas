import { db } from "../server/db";
import { 
  users, 
  suppliers, 
  expenseCategories, 
  accountsPayable, 
  productCategories,
  products,
  customers
} from "../shared/schema";
import bcrypt from "bcrypt";

async function seedSampleData() {
  try {
    console.log('Seeding sample data to Neon database...');
    
    // Create default user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const [user] = await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      email: "admin@oticamanager.com",
      fullName: "Administrador",
      role: "admin",
    }).returning();
    console.log('✓ Created default user');
    
    // Create expense categories
    const categories = await db.insert(expenseCategories).values([
      { name: "Fornecedores", description: "Pagamentos a fornecedores" },
      { name: "Aluguel", description: "Pagamento de aluguel" },
      { name: "Utilidades", description: "Conta de luz, água, internet" },
      { name: "Marketing", description: "Despesas com marketing e publicidade" },
      { name: "Equipamentos", description: "Compra e manutenção de equipamentos" },
    ]).returning();
    console.log('✓ Created expense categories');
    
    // Create suppliers
    const suppliersList = await db.insert(suppliers).values([
      {
        name: "Ótica Distribuidora Ltda",
        email: "contato@oticadistribuidora.com",
        phone: "(11) 99999-1111",
        cnpj: "12.345.678/0001-90",
        address: "Rua das Lentes, 123",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
      },
      {
        name: "Armações Premium",
        email: "vendas@armacaespremium.com",
        phone: "(11) 99999-2222",
        cnpj: "98.765.432/0001-10",
        address: "Av. da Visão, 456",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-890",
      },
      {
        name: "Lentes e Cia",
        email: "contato@lentesecia.com",
        phone: "(11) 99999-3333",
        cnpj: "11.222.333/0001-44",
        address: "Rua dos Óculos, 789",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-123",
      },
    ]).returning();
    console.log('✓ Created suppliers');
    
    // Create accounts payable
    const accountsPayableData = await db.insert(accountsPayable).values([
      {
        supplierId: suppliersList[0].id,
        categoryId: categories[0].id,
        userId: user.id,
        description: "Compra de armações diversas - Pedido #001",
        totalAmount: "1500.00",
        remainingAmount: "1500.00",
        dueDate: new Date("2025-01-15"),
        status: "pending",
        installments: 1,
        currentInstallment: 1,
      },
      {
        supplierId: suppliersList[1].id,
        categoryId: categories[0].id,
        userId: user.id,
        description: "Lentes multifocais - Pedido #002",
        totalAmount: "800.00",
        remainingAmount: "800.00",
        dueDate: new Date("2025-01-20"),
        status: "pending",
        installments: 1,
        currentInstallment: 1,
      },
      {
        supplierId: suppliersList[2].id,
        categoryId: categories[0].id,
        userId: user.id,
        description: "Acessórios para óculos - Pedido #003",
        totalAmount: "450.00",
        remainingAmount: "450.00",
        dueDate: new Date("2025-01-25"),
        status: "pending",
        installments: 1,
        currentInstallment: 1,
      },
    ]).returning();
    console.log('✓ Created accounts payable');
    
    // Create product categories
    const productCategoriesList = await db.insert(productCategories).values([
      { name: "Armações", description: "Armações de óculos" },
      { name: "Lentes", description: "Lentes oftálmicas" },
      { name: "Óculos de Sol", description: "Óculos de sol" },
      { name: "Acessórios", description: "Acessórios para óculos" },
    ]).returning();
    console.log('✓ Created product categories');
    
    // Create customers
    const customersList = await db.insert(customers).values([
      {
        fullName: "João Silva",
        email: "joao@email.com",
        phone: "(11) 99999-4444",
        cpf: "123.456.789-00",
        birthDate: new Date("1985-05-15"),
        street: "Rua das Flores, 123",
        number: "123",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
      },
      {
        fullName: "Maria Santos",
        email: "maria@email.com",
        phone: "(11) 99999-5555",
        cpf: "987.654.321-00",
        birthDate: new Date("1990-08-20"),
        street: "Av. Principal, 456",
        number: "456",
        neighborhood: "Jardim",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-890",
      },
    ]).returning();
    console.log('✓ Created customers');
    
    // Create products
    const productsList = await db.insert(products).values([
      {
        name: "Armação Ray-Ban Classic",
        sku: "RB001",
        categoryId: productCategoriesList[0].id,
        brand: "Ray-Ban",
        model: "Classic",
        color: "Preto",
        description: "Armação clássica Ray-Ban",
        costPrice: "120.00",
        salePrice: "280.00",
        stockQuantity: 10,
        minStockLevel: 3,
      },
      {
        name: "Lente Multifocal Varilux",
        sku: "VAR001",
        categoryId: productCategoriesList[1].id,
        brand: "Varilux",
        model: "Comfort",
        description: "Lente multifocal premium",
        costPrice: "180.00",
        salePrice: "420.00",
        stockQuantity: 15,
        minStockLevel: 5,
      },
      {
        name: "Óculos de Sol Oakley",
        sku: "OAK001",
        categoryId: productCategoriesList[2].id,
        brand: "Oakley",
        model: "Sport",
        color: "Azul",
        description: "Óculos de sol esportivo",
        costPrice: "200.00",
        salePrice: "450.00",
        stockQuantity: 8,
        minStockLevel: 2,
      },
    ]).returning();
    console.log('✓ Created products');
    
    console.log('✅ Sample data seeded successfully!');
    console.log('Database now contains:');
    console.log(`- ${suppliersList.length} suppliers`);
    console.log(`- ${categories.length} expense categories`);
    console.log(`- ${accountsPayableData.length} accounts payable`);
    console.log(`- ${productsList.length} products`);
    console.log(`- ${customersList.length} customers`);
    console.log(`- 1 user (admin/admin123)`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedSampleData();