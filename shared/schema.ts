import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, uuid, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"), // admin, user, manager
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Customers (Patients) table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  cpf: text("cpf").unique(),
  birthDate: timestamp("birth_date"),
  street: varchar("street", { length: 255 }),
  number: varchar("number", { length: 20 }),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Product categories
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  categoryId: integer("category_id").references(() => productCategories.id),
  brand: text("brand"),
  model: text("model"),
  color: text("color"),
  size: text("size"),
  description: text("description"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  minStockLevel: integer("min_stock_level").notNull().default(5),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  doctorName: text("doctor_name"),
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  // Right eye
  rightSphere: decimal("right_sphere", { precision: 4, scale: 2 }),
  rightCylinder: decimal("right_cylinder", { precision: 4, scale: 2 }),
  rightAxis: integer("right_axis"),
  rightAdd: decimal("right_add", { precision: 3, scale: 2 }),
  // Left eye
  leftSphere: decimal("left_sphere", { precision: 4, scale: 2 }),
  leftCylinder: decimal("left_cylinder", { precision: 4, scale: 2 }),
  leftAxis: integer("left_axis"),
  leftAdd: decimal("left_add", { precision: 3, scale: 2 }),
  // PD
  rightPd: decimal("right_pd", { precision: 4, scale: 1 }),
  leftPd: decimal("left_pd", { precision: 4, scale: 1 }),
  notes: text("notes"),
  attachments: jsonb("attachments"), // Array of file URLs
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sales table
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  saleNumber: text("sale_number").notNull().unique(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // pix, cartao, dinheiro, crediario
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, partial
  installments: integer("installments").default(1), // Number of installments for crediario/cartao
  status: text("status").notNull().default("active"), // active, cancelled, returned
  saleDate: timestamp("sale_date").notNull().defaultNow(),
  notes: text("notes"),
});

// Sale items table
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Quotes table
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  quoteNumber: text("quote_number").notNull().unique(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, expired, converted
  validUntil: timestamp("valid_until").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Quote items table
export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Financial accounts
export const financialAccounts = pgTable("financial_accounts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  saleId: integer("sale_id").references(() => sales.id),
  type: text("type").notNull(), // receivable, payable
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  status: text("status").notNull().default("pending"), // pending, paid, overdue
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").default(30), // minutes
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled, no-show
  type: text("type").notNull(), // consultation, pickup, adjustment, follow-up
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Prescription files table
export const prescriptionFiles = pgTable("prescription_files", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id").notNull().references(() => prescriptions.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // in bytes
  path: text("path").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  cnpj: text("cnpj").unique(),
  street: varchar("street", { length: 255 }),
  number: varchar("number", { length: 20 }),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Expense categories table
export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6B7280"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Accounts payable table
export const accountsPayable = pgTable("accounts_payable", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  categoryId: integer("category_id").references(() => expenseCategories.id),
  userId: integer("user_id").notNull().references(() => users.id),
  description: text("description").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  paymentMethod: text("payment_method"), // dinheiro, pix, boleto, cartao, transferencia
  referenceNumber: text("reference_number"), // numero do comprovante
  installments: integer("installments").default(1),
  currentInstallment: integer("current_installment").default(1),
  isRecurring: boolean("is_recurring").default(false),
  recurringType: text("recurring_type"), // monthly, quarterly, yearly
  recurringDay: integer("recurring_day"), // dia do mes para recorrencia
  status: text("status").notNull().default("pending"), // pending, paid, overdue, cancelled
  notes: text("notes"),
  parentId: integer("parent_id"), // para parcelas - self reference
  attachments: jsonb("attachments"), // para comprovantes
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payment history table
export const paymentHistory = pgTable("payment_history", {
  id: serial("id").primaryKey(),
  accountPayableId: integer("account_payable_id").notNull().references(() => accountsPayable.id),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  paymentMethod: text("payment_method").notNull(),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
  quotes: many(quotes),
  appointments: many(appointments),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  prescriptions: many(prescriptions),
  sales: many(sales),
  quotes: many(quotes),
  appointments: many(appointments),
  financialAccounts: many(financialAccounts),
}));

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  saleItems: many(saleItems),
  quoteItems: many(quoteItems),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  items: many(saleItems),
  financialAccounts: many(financialAccounts),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  customer: one(customers, {
    fields: [quotes.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [quotes.userId],
    references: [users.id],
  }),
  items: many(quoteItems),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
  product: one(products, {
    fields: [quoteItems.productId],
    references: [products.id],
  }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  customer: one(customers, {
    fields: [prescriptions.customerId],
    references: [customers.id],
  }),
  files: many(prescriptionFiles),
}));

export const prescriptionFilesRelations = relations(prescriptionFiles, ({ one }) => ({
  prescription: one(prescriptions, {
    fields: [prescriptionFiles.prescriptionId],
    references: [prescriptions.id],
  }),
}));

export const financialAccountsRelations = relations(financialAccounts, ({ one }) => ({
  customer: one(customers, {
    fields: [financialAccounts.customerId],
    references: [customers.id],
  }),
  sale: one(sales, {
    fields: [financialAccounts.saleId],
    references: [sales.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  customer: one(customers, {
    fields: [appointments.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  accountsPayable: many(accountsPayable),
}));

export const expenseCategoriesRelations = relations(expenseCategories, ({ many }) => ({
  accountsPayable: many(accountsPayable),
}));

export const accountsPayableRelations = relations(accountsPayable, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [accountsPayable.supplierId],
    references: [suppliers.id],
  }),
  category: one(expenseCategories, {
    fields: [accountsPayable.categoryId],
    references: [expenseCategories.id],
  }),
  user: one(users, {
    fields: [accountsPayable.userId],
    references: [users.id],
  }),
  installments: many(accountsPayable, {
    relationName: "installments",
  }),
  paymentHistory: many(paymentHistory),
}));

export const paymentHistoryRelations = relations(paymentHistory, ({ one }) => ({
  accountPayable: one(accountsPayable, {
    fields: [paymentHistory.accountPayableId],
    references: [accountsPayable.id],
  }),
  user: one(users, {
    fields: [paymentHistory.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
}).extend({
  issueDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  expiryDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => 
    !val ? null : typeof val === 'string' ? new Date(val) : val
  ),
  rightSphere: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => 
    val === null || val === undefined ? null : String(val)
  ),
  rightCylinder: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => 
    val === null || val === undefined ? null : String(val)
  ),
  rightAdd: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => 
    val === null || val === undefined ? null : String(val)
  ),
  leftSphere: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => 
    val === null || val === undefined ? null : String(val)
  ),
  leftCylinder: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => 
    val === null || val === undefined ? null : String(val)
  ),
  leftAdd: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => 
    val === null || val === undefined ? null : String(val)
  ),
  rightPd: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => 
    val === null || val === undefined ? null : String(val)
  ),
  leftPd: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => 
    val === null || val === undefined ? null : String(val)
  ),
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  saleDate: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
}).extend({
  validUntil: z.string().transform((val) => new Date(val)),
});

export const insertQuoteItemSchema = createInsertSchema(quoteItems).omit({
  id: true,
  quoteId: true,
});

export const insertFinancialAccountSchema = createInsertSchema(financialAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertPrescriptionFileSchema = createInsertSchema(prescriptionFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({
  id: true,
  createdAt: true,
});

export const insertAccountPayableSchema = createInsertSchema(accountsPayable).omit({
  id: true,
  createdAt: true,
}).extend({
  dueDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

export const insertPaymentHistorySchema = createInsertSchema(paymentHistory).omit({
  id: true,
  createdAt: true,
}).extend({
  paymentDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;

export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type InsertFinancialAccount = z.infer<typeof insertFinancialAccountSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type PrescriptionFile = typeof prescriptionFiles.$inferSelect;
export type InsertPrescriptionFile = z.infer<typeof insertPrescriptionFileSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;

export type AccountPayable = typeof accountsPayable.$inferSelect;
export type InsertAccountPayable = z.infer<typeof insertAccountPayableSchema>;

export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type InsertPaymentHistory = z.infer<typeof insertPaymentHistorySchema>;
