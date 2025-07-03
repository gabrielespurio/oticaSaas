import { db } from "../server/db";
import { customers, sales, saleItems, products, users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedSampleData() {
  try {
    console.log("Creating sample customers and sales...");

    // Get the admin user
    const [adminUser] = await db.select().from(users).where(eq(users.username, "admin"));
    if (!adminUser) {
      console.error("Admin user not found. Please run seed-user.ts first.");
      return;
    }

    // Get some products
    const productList = await db.select().from(products).limit(3);
    if (productList.length === 0) {
      console.error("No products found. Please run seed-products.ts first.");
      return;
    }

    // Create sample customers
    const customer1 = await db.insert(customers).values([{
      fullName: "João Silva",
      email: "joao@email.com",
      phone: "(11) 99999-1234",
      cpf: "123.456.789-00",
      street: "Rua das Flores",
      number: "123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
    }]).returning();

    const customer2 = await db.insert(customers).values([{
      fullName: "Maria Santos",
      email: "maria@email.com",
      phone: "(11) 88888-5678",
      cpf: "987.654.321-00",
      street: "Av. Paulista",
      number: "456",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
    }]).returning();

    // Create sample sales with different payment methods

    // Sale 1: Cash payment (no receivable created)
    const sale1 = await db.insert(sales).values({
      customerId: customer1[0].id,
      userId: adminUser.id,
      saleNumber: "VEN-000001",
      totalAmount: "350.00",
      discountAmount: "50.00",
      finalAmount: "300.00",
      paymentMethod: "dinheiro",
      paymentStatus: "paid",
      installments: 1,
    }).returning();

    await db.insert(saleItems).values([
      {
        saleId: sale1[0].id,
        productId: productList[0].id,
        quantity: 1,
        unitPrice: "300.00",
        totalPrice: "300.00",
      }
    ]);

    // Sale 2: Crediário with 3 installments
    const sale2 = await db.insert(sales).values({
      customerId: customer2[0].id,
      userId: adminUser.id,
      saleNumber: "VEN-000002",
      totalAmount: "600.00",
      discountAmount: "0.00",
      finalAmount: "600.00",
      paymentMethod: "crediario",
      paymentStatus: "pending",
      installments: 3,
    }).returning();

    await db.insert(saleItems).values([
      {
        saleId: sale2[0].id,
        productId: productList[1].id,
        quantity: 2,
        unitPrice: "300.00",
        totalPrice: "600.00",
      }
    ]);

    // Sale 3: Card payment with 2 installments
    const sale3 = await db.insert(sales).values({
      customerId: customer1[0].id,
      userId: adminUser.id,
      saleNumber: "VEN-000003",
      totalAmount: "450.00",
      discountAmount: "0.00",
      finalAmount: "450.00",
      paymentMethod: "cartao",
      paymentStatus: "pending",
      installments: 2,
    }).returning();

    await db.insert(saleItems).values([
      {
        saleId: sale3[0].id,
        productId: productList[2].id,
        quantity: 1,
        unitPrice: "450.00",
        totalPrice: "450.00",
      }
    ]);

    console.log("Sample data created successfully:");
    console.log(`- Customer 1: ${customer1[0].fullName} (ID: ${customer1[0].id})`);
    console.log(`- Customer 2: ${customer2[0].fullName} (ID: ${customer2[0].id})`);
    console.log(`- Sale 1: VEN-000001 - R$ 300,00 (Dinheiro) - No receivables`);
    console.log(`- Sale 2: VEN-000002 - R$ 600,00 (Crediário 3x) - 3 receivables created`);
    console.log(`- Sale 3: VEN-000003 - R$ 450,00 (Cartão 2x) - 2 receivables created`);
  } catch (error) {
    console.error("Error creating sample data:", error);
  }
}

seedSampleData();