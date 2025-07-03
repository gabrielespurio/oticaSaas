import {
  users, customers, products, productCategories, prescriptions, prescriptionFiles,
  sales, saleItems, quotes, quoteItems, financialAccounts, appointments,
  type User, type InsertUser, type Customer, type InsertCustomer,
  type Product, type InsertProduct, type ProductCategory, type InsertProductCategory,
  type Prescription, type InsertPrescription, type PrescriptionFile, type InsertPrescriptionFile,
  type Sale, type InsertSale, type SaleItem, type InsertSaleItem, type Quote, type InsertQuote,
  type QuoteItem, type InsertQuoteItem, type FinancialAccount, type InsertFinancialAccount,
  type Appointment, type InsertAppointment
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, sql, like, or, ilike } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Customers
  getCustomers(limit?: number, offset?: number): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByCpf(cpf: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  searchCustomers(query: string): Promise<Customer[]>;
  getCustomerPurchaseHistory(customerId: number): Promise<(Sale & { items: (SaleItem & { product: Product })[] })[]>;

  // Product Categories
  getProductCategories(): Promise<ProductCategory[]>;
  getProductCategory(id: number): Promise<ProductCategory | undefined>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateProductCategory(id: number, category: Partial<InsertProductCategory>): Promise<ProductCategory | undefined>;

  // Products
  getProducts(limit?: number, offset?: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getLowStockProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  updateProductStock(id: number, quantity: number): Promise<Product | undefined>;
  searchProducts(query: string): Promise<Product[]>;

  // Prescriptions
  getPrescriptions(customerId?: number): Promise<Prescription[]>;
  getPrescription(id: number): Promise<Prescription | undefined>;
  getPrescriptionWithFiles(id: number): Promise<(Prescription & { files: PrescriptionFile[] }) | undefined>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined>;
  
  // Prescription Files
  getPrescriptionFiles(prescriptionId: number): Promise<PrescriptionFile[]>;
  createPrescriptionFile(file: InsertPrescriptionFile): Promise<PrescriptionFile>;
  deletePrescriptionFile(id: number): Promise<boolean>;

  // Sales
  getSales(limit?: number, offset?: number): Promise<(Sale & { customer: Customer; items: (SaleItem & { product: Product })[] })[]>;
  getSale(id: number): Promise<Sale | undefined>;
  getSaleWithItems(id: number): Promise<(Sale & { items: (SaleItem & { product: Product })[] }) | undefined>;
  getRecentSales(limit?: number): Promise<(Sale & { customer: Customer; items: (SaleItem & { product: Product })[] })[]>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale>;
  updateSale(id: number, sale: Partial<InsertSale>): Promise<Sale | undefined>;
  getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]>;

  // Quotes
  getQuotes(limit?: number, offset?: number): Promise<(Quote & { customer: Customer })[]>;
  getQuote(id: number): Promise<Quote | undefined>;
  getQuoteWithItems(id: number): Promise<(Quote & { customer: Customer; items: (QuoteItem & { product: Product })[] }) | undefined>;
  createQuote(quote: InsertQuote, items: InsertQuoteItem[]): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<boolean>;
  convertQuoteToSale(quoteId: number, paymentInfo?: { paymentMethod: string; paymentStatus: string; installments?: number }): Promise<Sale | undefined>;

  // Financial Accounts
  getFinancialAccounts(type?: string): Promise<any[]>;
  getFinancialAccount(id: number): Promise<FinancialAccount | undefined>;
  getOverdueAccounts(): Promise<FinancialAccount[]>;
  createFinancialAccount(account: InsertFinancialAccount): Promise<FinancialAccount>;
  updateFinancialAccount(id: number, account: Partial<InsertFinancialAccount>): Promise<FinancialAccount | undefined>;

  // Appointments
  getAppointments(date?: Date): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  getTodayAppointments(): Promise<(Appointment & { customer: Customer })[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;

  // Dashboard
  getDashboardStats(): Promise<{
    salesToday: string;
    activeCustomers: number;
    productsInStock: number;
    accountsReceivable: string;
    lowStockCount: number;
    overdueCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Customers
  async getCustomers(limit = 50, offset = 0): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.isActive, true)).limit(limit).offset(offset).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer || undefined;
  }

  async getCustomerByCpf(cpf: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.cpf, cpf));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: number, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers).set(updateData).where(eq(customers.id, id)).returning();
    return customer || undefined;
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    return await db.select().from(customers)
      .where(
        and(
          eq(customers.isActive, true),
          or(
            ilike(customers.fullName, `%${query}%`),
            ilike(customers.email, `%${query}%`),
            like(customers.phone, `%${query}%`),
            like(customers.cpf, `%${query}%`)
          )
        )
      )
      .limit(20);
  }

  async getCustomerPurchaseHistory(customerId: number): Promise<(Sale & { items: (SaleItem & { product: Product })[] })[]> {
    const customerSales = await db.select().from(sales)
      .where(eq(sales.customerId, customerId))
      .orderBy(desc(sales.saleDate));

    const salesWithItems = await Promise.all(
      customerSales.map(async (sale) => {
        const items = await db.select({
          id: saleItems.id,
          saleId: saleItems.saleId,
          productId: saleItems.productId,
          quantity: saleItems.quantity,
          unitPrice: saleItems.unitPrice,
          totalPrice: saleItems.totalPrice,
          product: products,
        })
          .from(saleItems)
          .innerJoin(products, eq(saleItems.productId, products.id))
          .where(eq(saleItems.saleId, sale.id));

        return { ...sale, items };
      })
    );

    return salesWithItems;
  }

  // Product Categories
  async getProductCategories(): Promise<ProductCategory[]> {
    return await db.select().from(productCategories).orderBy(productCategories.name);
  }

  async getProductCategory(id: number): Promise<ProductCategory | undefined> {
    const [category] = await db.select().from(productCategories).where(eq(productCategories.id, id));
    return category || undefined;
  }

  async createProductCategory(insertCategory: InsertProductCategory): Promise<ProductCategory> {
    const [category] = await db.insert(productCategories).values(insertCategory).returning();
    return category;
  }

  async updateProductCategory(id: number, updateData: Partial<InsertProductCategory>): Promise<ProductCategory | undefined> {
    const [category] = await db.update(productCategories).set(updateData).where(eq(productCategories.id, id)).returning();
    return category || undefined;
  }

  // Products
  async getProducts(limit = 50, offset = 0): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).limit(limit).offset(offset).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product || undefined;
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)))
      .orderBy(products.name);
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.stockQuantity} <= ${products.minStockLevel}`
        )
      )
      .orderBy(products.stockQuantity);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(updateData).where(eq(products.id, id)).returning();
    return product || undefined;
  }

  async updateProductStock(id: number, quantity: number): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set({ stockQuantity: sql`${products.stockQuantity} + ${quantity}` })
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(
        and(
          eq(products.isActive, true),
          or(
            like(products.name, `%${query}%`),
            like(products.sku, `%${query}%`),
            like(products.brand, `%${query}%`),
            like(products.model, `%${query}%`)
          )
        )
      )
      .limit(20);
  }

  // Prescriptions
  async getPrescriptions(customerId?: number): Promise<Prescription[]> {
    const query = db.select().from(prescriptions);
    if (customerId) {
      return await query.where(eq(prescriptions.customerId, customerId)).orderBy(desc(prescriptions.createdAt));
    }
    return await query.orderBy(desc(prescriptions.createdAt)).limit(50);
  }

  async getPrescription(id: number): Promise<Prescription | undefined> {
    const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return prescription || undefined;
  }

  async getPrescriptionWithFiles(id: number): Promise<(Prescription & { files: PrescriptionFile[] }) | undefined> {
    const prescription = await this.getPrescription(id);
    if (!prescription) return undefined;
    
    const files = await this.getPrescriptionFiles(id);
    return { ...prescription, files };
  }

  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const [prescription] = await db.insert(prescriptions).values(insertPrescription).returning();
    return prescription;
  }

  async updatePrescription(id: number, updateData: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const [prescription] = await db.update(prescriptions).set(updateData).where(eq(prescriptions.id, id)).returning();
    return prescription || undefined;
  }

  // Prescription Files
  async getPrescriptionFiles(prescriptionId: number): Promise<PrescriptionFile[]> {
    return await db.select().from(prescriptionFiles)
      .where(eq(prescriptionFiles.prescriptionId, prescriptionId))
      .orderBy(desc(prescriptionFiles.uploadedAt));
  }

  async createPrescriptionFile(insertFile: InsertPrescriptionFile): Promise<PrescriptionFile> {
    const [file] = await db.insert(prescriptionFiles).values(insertFile).returning();
    return file;
  }

  async deletePrescriptionFile(id: number): Promise<boolean> {
    const result = await db.delete(prescriptionFiles).where(eq(prescriptionFiles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Sales
  async getSales(limit = 50, offset = 0): Promise<(Sale & { customer: Customer; items: (SaleItem & { product: Product })[] })[]> {
    const salesData = await db.select({
      sale: sales,
      customer: customers,
    })
      .from(sales)
      .innerJoin(customers, eq(sales.customerId, customers.id))
      .orderBy(desc(sales.saleDate))
      .limit(limit)
      .offset(offset);

    const salesWithItems = await Promise.all(
      salesData.map(async ({ sale, customer }) => {
        const items = await db.select({
          id: saleItems.id,
          saleId: saleItems.saleId,
          productId: saleItems.productId,
          quantity: saleItems.quantity,
          unitPrice: saleItems.unitPrice,
          totalPrice: saleItems.totalPrice,
          product: products,
        })
          .from(saleItems)
          .innerJoin(products, eq(saleItems.productId, products.id))
          .where(eq(saleItems.saleId, sale.id));

        return { ...sale, customer, items };
      })
    );

    return salesWithItems;
  }

  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale || undefined;
  }

  async getSaleWithItems(id: number): Promise<(Sale & { items: (SaleItem & { product: Product })[] }) | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    if (!sale) return undefined;

    const items = await db.select({
      id: saleItems.id,
      saleId: saleItems.saleId,
      productId: saleItems.productId,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      totalPrice: saleItems.totalPrice,
      product: products,
    })
      .from(saleItems)
      .innerJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, id));

    return { ...sale, items };
  }

  async getRecentSales(limit = 10): Promise<(Sale & { customer: Customer; items: (SaleItem & { product: Product })[] })[]> {
    const recentSales = await db.select({
      sale: sales,
      customer: customers,
    })
      .from(sales)
      .innerJoin(customers, eq(sales.customerId, customers.id))
      .orderBy(desc(sales.saleDate))
      .limit(limit);

    const salesWithItems = await Promise.all(
      recentSales.map(async ({ sale, customer }) => {
        const items = await db.select({
          id: saleItems.id,
          saleId: saleItems.saleId,
          productId: saleItems.productId,
          quantity: saleItems.quantity,
          unitPrice: saleItems.unitPrice,
          totalPrice: saleItems.totalPrice,
          product: products,
        })
          .from(saleItems)
          .innerJoin(products, eq(saleItems.productId, products.id))
          .where(eq(saleItems.saleId, sale.id));

        return { ...sale, customer, items };
      })
    );

    return salesWithItems;
  }

  async createSale(insertSale: InsertSale, items: InsertSaleItem[]): Promise<Sale> {
    return await db.transaction(async (tx) => {
      const [sale] = await tx.insert(sales).values([insertSale]).returning();
      
      const saleItemsWithSaleId = items.map(item => ({ ...item, saleId: sale.id }));
      await tx.insert(saleItems).values(saleItemsWithSaleId);

      // Update stock quantities
      for (const item of items) {
        await tx.update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      // Create financial account entry based on payment method
      const saleNumber = sale.id.toString().padStart(6, '0');
      
      if (sale.paymentMethod === 'crediario') {
        // For crediário, create installments based on installments field
        const installmentCount = sale.installments || 1;
        const installmentAmount = parseFloat(sale.finalAmount) / installmentCount;
        const today = new Date();
        
        for (let i = 1; i <= installmentCount; i++) {
          const dueDate = new Date(today);
          dueDate.setMonth(dueDate.getMonth() + i);
          
          await tx.insert(financialAccounts).values({
            customerId: sale.customerId,
            saleId: sale.id,
            type: 'receivable',
            description: `Parcela ${i}/${installmentCount} - Venda #${saleNumber}`,
            amount: installmentAmount.toFixed(2),
            dueDate,
            status: 'pending', // A receber - parcela do crediário
          });
        }
      } else if ((sale.paymentMethod === 'cartao' || sale.paymentMethod === 'card') && sale.installments && sale.installments > 1) {
        // For card with installments - only create receivables if payment is not immediate
        const installmentCount = sale.installments;
        const installmentAmount = parseFloat(sale.finalAmount) / installmentCount;
        const today = new Date();
        
        for (let i = 1; i <= installmentCount; i++) {
          const dueDate = new Date(today);
          dueDate.setMonth(dueDate.getMonth() + i);
          
          await tx.insert(financialAccounts).values({
            customerId: sale.customerId,
            saleId: sale.id,
            type: 'receivable',
            description: `Parcela ${i}/${installmentCount} (Cartão) - Venda #${saleNumber}`,
            amount: installmentAmount.toFixed(2),
            dueDate,
            status: 'pending', // A receber - parcela do cartão
          });
        }
      }
      // Note: For dinheiro, pix, and cartao à vista (1x), no receivables are created
      // as these are immediate payments that don't generate accounts receivable

      return sale;
    });
  }

  async updateSale(id: number, updateData: Partial<InsertSale>): Promise<Sale | undefined> {
    const [sale] = await db.update(sales).set(updateData).where(eq(sales.id, id)).returning();
    return sale || undefined;
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return await db.select().from(sales)
      .where(and(gte(sales.saleDate, startDate), lte(sales.saleDate, endDate)))
      .orderBy(desc(sales.saleDate));
  }

  // Quotes
  async getQuotes(limit = 50, offset = 0): Promise<(Quote & { customer: Customer })[]> {
    return await db.select({
      id: quotes.id,
      customerId: quotes.customerId,
      userId: quotes.userId,
      quoteNumber: quotes.quoteNumber,
      totalAmount: quotes.totalAmount,
      discountAmount: quotes.discountAmount,
      finalAmount: quotes.finalAmount,
      status: quotes.status,
      validUntil: quotes.validUntil,
      notes: quotes.notes,
      createdAt: quotes.createdAt,
      customer: customers,
    })
      .from(quotes)
      .innerJoin(customers, eq(quotes.customerId, customers.id))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(quotes.createdAt));
  }

  async getQuote(id: number): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote || undefined;
  }

  async getQuoteWithItems(id: number): Promise<(Quote & { customer: Customer; items: (QuoteItem & { product: Product })[] }) | undefined> {
    const [quoteWithCustomer] = await db.select({
      id: quotes.id,
      customerId: quotes.customerId,
      userId: quotes.userId,
      quoteNumber: quotes.quoteNumber,
      totalAmount: quotes.totalAmount,
      discountAmount: quotes.discountAmount,
      finalAmount: quotes.finalAmount,
      status: quotes.status,
      validUntil: quotes.validUntil,
      notes: quotes.notes,
      createdAt: quotes.createdAt,
      customer: customers,
    })
      .from(quotes)
      .innerJoin(customers, eq(quotes.customerId, customers.id))
      .where(eq(quotes.id, id));

    if (!quoteWithCustomer) return undefined;

    const items = await db.select({
      id: quoteItems.id,
      quoteId: quoteItems.quoteId,
      productId: quoteItems.productId,
      quantity: quoteItems.quantity,
      unitPrice: quoteItems.unitPrice,
      totalPrice: quoteItems.totalPrice,
      product: products,
    })
      .from(quoteItems)
      .innerJoin(products, eq(quoteItems.productId, products.id))
      .where(eq(quoteItems.quoteId, id));

    return { ...quoteWithCustomer, items };
  }

  async createQuote(insertQuote: InsertQuote, items: InsertQuoteItem[]): Promise<Quote> {
    return await db.transaction(async (tx) => {
      const [quote] = await tx.insert(quotes).values([insertQuote]).returning();
      
      const quoteItemsWithQuoteId = items.map(item => ({ ...item, quoteId: quote.id }));
      await tx.insert(quoteItems).values(quoteItemsWithQuoteId);

      return quote;
    });
  }

  async updateQuote(id: number, updateData: Partial<InsertQuote>): Promise<Quote | undefined> {
    const [quote] = await db.update(quotes).set(updateData).where(eq(quotes.id, id)).returning();
    return quote || undefined;
  }

  async deleteQuote(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      try {
        // First delete all quote items
        await tx.delete(quoteItems).where(eq(quoteItems.quoteId, id));
        
        // Then delete the quote
        const result = await tx.delete(quotes).where(eq(quotes.id, id));
        
        return result.rowCount ? result.rowCount > 0 : false;
      } catch (error) {
        console.error("Error deleting quote:", error);
        return false;
      }
    });
  }

  async convertQuoteToSale(quoteId: number, paymentInfo?: { paymentMethod: string; paymentStatus: string; installments?: number }): Promise<Sale | undefined> {
    const quote = await this.getQuoteWithItems(quoteId);
    if (!quote) return undefined;

    const saleNumber = `VEN-${Date.now()}`;
    const insertSale: InsertSale = {
      customerId: quote.customerId,
      userId: quote.userId,
      saleNumber,
      totalAmount: quote.totalAmount,
      discountAmount: quote.discountAmount,
      finalAmount: quote.finalAmount,
      paymentMethod: paymentInfo?.paymentMethod || 'pending',
      paymentStatus: paymentInfo?.paymentStatus || 'pending',
      installments: paymentInfo?.installments || 1,
    };

    const saleItems: InsertSaleItem[] = quote.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      saleId: 0, // Will be set in createSale
    }));

    const sale = await this.createSale(insertSale, saleItems);
    await this.updateQuote(quoteId, { status: 'converted' });

    // Create financial accounts if payment is in installments or crediário
    if (paymentInfo?.paymentMethod === 'installment' && paymentInfo.installments && paymentInfo.installments > 1) {
      const installmentAmount = parseFloat(quote.finalAmount) / paymentInfo.installments;
      const today = new Date();
      
      for (let i = 1; i <= paymentInfo.installments; i++) {
        const dueDate = new Date(today);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        await this.createFinancialAccount({
          customerId: quote.customerId,
          type: 'receivable',
          description: `Parcela ${i}/${paymentInfo.installments} - Venda #${saleNumber}`,
          amount: installmentAmount.toFixed(2),
          dueDate,
          status: 'pending',
          saleId: sale.id,
        });
      }
    }

    return sale;
  }

  // Financial Accounts
  async getFinancialAccounts(type?: string): Promise<any[]> {
    const query = db.select({
      id: financialAccounts.id,
      customerId: financialAccounts.customerId,
      saleId: financialAccounts.saleId,
      type: financialAccounts.type,
      description: financialAccounts.description,
      amount: financialAccounts.amount,
      dueDate: financialAccounts.dueDate,
      paidDate: financialAccounts.paidDate,
      status: financialAccounts.status,
      createdAt: financialAccounts.createdAt,
      customerName: customers.fullName,
      saleNumber: sales.saleNumber,
    })
      .from(financialAccounts)
      .leftJoin(customers, eq(financialAccounts.customerId, customers.id))
      .leftJoin(sales, eq(financialAccounts.saleId, sales.id));
      
    if (type) {
      return await query.where(eq(financialAccounts.type, type)).orderBy(financialAccounts.dueDate);
    }
    return await query.orderBy(financialAccounts.dueDate);
  }

  async getFinancialAccount(id: number): Promise<FinancialAccount | undefined> {
    const [account] = await db.select().from(financialAccounts).where(eq(financialAccounts.id, id));
    return account || undefined;
  }

  async getOverdueAccounts(): Promise<FinancialAccount[]> {
    const today = new Date();
    return await db.select().from(financialAccounts)
      .where(
        and(
          eq(financialAccounts.status, 'pending'),
          lte(financialAccounts.dueDate, today)
        )
      )
      .orderBy(financialAccounts.dueDate);
  }

  async createFinancialAccount(insertAccount: InsertFinancialAccount): Promise<FinancialAccount> {
    const [account] = await db.insert(financialAccounts).values(insertAccount).returning();
    return account;
  }

  async updateFinancialAccount(id: number, updateData: Partial<InsertFinancialAccount>): Promise<FinancialAccount | undefined> {
    const [account] = await db.update(financialAccounts).set(updateData).where(eq(financialAccounts.id, id)).returning();
    return account || undefined;
  }

  // Appointments
  async getAppointments(date?: Date): Promise<Appointment[]> {
    const query = db.select().from(appointments);
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return await query
        .where(and(gte(appointments.appointmentDate, startOfDay), lte(appointments.appointmentDate, endOfDay)))
        .orderBy(appointments.appointmentDate);
    }
    return await query.orderBy(appointments.appointmentDate).limit(50);
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment || undefined;
  }

  async getTodayAppointments(): Promise<(Appointment & { customer: Customer })[]> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return await db.select({
      id: appointments.id,
      customerId: appointments.customerId,
      userId: appointments.userId,
      title: appointments.title,
      description: appointments.description,
      appointmentDate: appointments.appointmentDate,
      duration: appointments.duration,
      status: appointments.status,
      type: appointments.type,
      notes: appointments.notes,
      createdAt: appointments.createdAt,
      customer: customers,
    })
      .from(appointments)
      .innerJoin(customers, eq(appointments.customerId, customers.id))
      .where(and(gte(appointments.appointmentDate, startOfDay), lte(appointments.appointmentDate, endOfDay)))
      .orderBy(appointments.appointmentDate);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db.insert(appointments).values(insertAppointment).returning();
    return appointment;
  }

  async updateAppointment(id: number, updateData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [appointment] = await db.update(appointments).set(updateData).where(eq(appointments.id, id)).returning();
    return appointment || undefined;
  }

  // Dashboard
  async getDashboardStats(): Promise<{
    salesToday: string;
    activeCustomers: number;
    productsInStock: number;
    accountsReceivable: string;
    lowStockCount: number;
    overdueCount: number;
  }> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Sales today
    const [salesToday] = await db.select({
      total: sql<string>`COALESCE(SUM(${sales.finalAmount}), 0)`,
    })
      .from(sales)
      .where(and(gte(sales.saleDate, startOfDay), lte(sales.saleDate, endOfDay)));

    // Active customers count
    const [activeCustomers] = await db.select({
      count: count(),
    })
      .from(customers)
      .where(eq(customers.isActive, true));

    // Products in stock count
    const [productsInStock] = await db.select({
      total: sql<number>`COALESCE(SUM(${products.stockQuantity}), 0)`,
    })
      .from(products)
      .where(eq(products.isActive, true));

    // Accounts receivable total
    const [accountsReceivable] = await db.select({
      total: sql<string>`COALESCE(SUM(${financialAccounts.amount}), 0)`,
    })
      .from(financialAccounts)
      .where(and(eq(financialAccounts.type, 'receivable'), eq(financialAccounts.status, 'pending')));

    // Low stock products count
    const [lowStockCount] = await db.select({
      count: count(),
    })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.stockQuantity} <= ${products.minStockLevel}`
        )
      );

    // Overdue accounts count
    const [overdueCount] = await db.select({
      count: count(),
    })
      .from(financialAccounts)
      .where(
        and(
          eq(financialAccounts.status, 'pending'),
          lte(financialAccounts.dueDate, today)
        )
      );

    return {
      salesToday: salesToday.total || '0',
      activeCustomers: activeCustomers.count,
      productsInStock: productsInStock.total || 0,
      accountsReceivable: accountsReceivable.total || '0',
      lowStockCount: lowStockCount.count,
      overdueCount: overdueCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
