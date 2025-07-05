import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertCustomerSchema, insertProductSchema, insertSaleSchema, insertQuoteSchema, 
  insertQuoteItemSchema, insertPrescriptionSchema, insertPrescriptionFileSchema, 
  insertAppointmentSchema, insertFinancialAccountSchema, insertSupplierSchema,
  insertExpenseCategorySchema, insertAccountPayableSchema, insertPaymentHistorySchema,
  insertPurchaseOrderSchema, insertPurchaseReceiptSchema, insertSupplierCategorySchema
} from "@shared/schema";
import { z } from "zod";
import { PDFService } from "./pdf-service";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Extended request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    role: string;
  };
}

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email, fullName } = req.body;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        fullName,
        role: "user",
      });

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/dashboard/recent-sales", authenticateToken, async (req, res) => {
    try {
      const recentSales = await storage.getRecentSales(5);
      res.json(recentSales);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/dashboard/low-stock", authenticateToken, async (req, res) => {
    try {
      const lowStockProducts = await storage.getLowStockProducts();
      res.json(lowStockProducts.slice(0, 10));
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/dashboard/today-appointments", authenticateToken, async (req, res) => {
    try {
      const appointments = await storage.getTodayAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Customer routes
  app.get("/api/customers", authenticateToken, async (req, res) => {
    try {
      const { page = 1, limit = 50, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let customers;
      if (search) {
        customers = await storage.searchCustomers(search as string);
      } else {
        customers = await storage.getCustomers(Number(limit), offset);
      }

      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/customers/:id", authenticateToken, async (req, res) => {
    try {
      const customer = await storage.getCustomer(Number(req.params.id));
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/customers", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error: any) {
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Erro de validação", errors: error.errors });
      }
      
      // Handle database constraint errors
      if (error.code === '23505') {
        if (error.constraint === 'customers_cpf_unique') {
          return res.status(400).json({ message: "CPF já cadastrado" });
        }
        if (error.constraint === 'customers_email_unique') {
          return res.status(400).json({ message: "Email já cadastrado" });
        }
      }
      
      // Check error message for duplicate key
      if (error.message && error.message.includes('customers_cpf_unique')) {
        return res.status(400).json({ message: "CPF já cadastrado" });
      }
      
      if (error.message && error.message.includes('customers_email_unique')) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }
      
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/customers/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(Number(req.params.id), validatedData);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Customer purchase history
  app.get("/api/customers/:id/purchase-history", authenticateToken, async (req, res) => {
    try {
      const customerId = Number(req.params.id);
      const purchases = await storage.getCustomerPurchaseHistory(customerId);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Customer prescriptions
  app.get("/api/customers/:id/prescriptions", authenticateToken, async (req, res) => {
    try {
      const customerId = Number(req.params.id);
      const prescriptions = await storage.getPrescriptions(customerId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Configure multer for file uploads
  const uploadsDir = path.join(process.cwd(), 'uploads', 'prescriptions');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storage_multer,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'));
      }
    }
  });

  // Prescription routes
  app.get("/api/prescriptions/:id", authenticateToken, async (req, res) => {
    try {
      const prescription = await storage.getPrescriptionWithFiles(Number(req.params.id));
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/prescriptions", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(validatedData);
      res.status(201).json(prescription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/prescriptions/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertPrescriptionSchema.partial().parse(req.body);
      const prescription = await storage.updatePrescription(Number(req.params.id), validatedData);
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      res.json(prescription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Prescription file upload
  app.post("/api/prescriptions/:id/files", authenticateToken, upload.array('files', 5), async (req, res) => {
    try {
      const prescriptionId = Number(req.params.id);
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const savedFiles = [];
      for (const file of files) {
        const fileData = {
          prescriptionId,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
        };

        const savedFile = await storage.createPrescriptionFile(fileData);
        savedFiles.push(savedFile);
      }

      res.status(201).json(savedFiles);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Serve prescription files
  app.get("/api/prescriptions/files/:filename", authenticateToken, (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(uploadsDir, filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      res.sendFile(filePath);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete prescription file
  app.delete("/api/prescriptions/files/:id", authenticateToken, async (req, res) => {
    try {
      const fileId = Number(req.params.id);
      const deleted = await storage.deletePrescriptionFile(fileId);
      
      if (!deleted) {
        return res.status(404).json({ message: "File not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Product routes
  app.get("/api/products", authenticateToken, async (req, res) => {
    try {
      const { page = 1, limit = 50, search, category } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let products;
      if (search) {
        products = await storage.searchProducts(search as string);
      } else if (category) {
        products = await storage.getProductsByCategory(Number(category));
      } else {
        products = await storage.getProducts(Number(limit), offset);
      }

      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const product = await storage.getProduct(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/products", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), validatedData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const product = await storage.getProduct(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      await storage.updateProduct(Number(req.params.id), { isActive: false });
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/product-categories", authenticateToken, async (req, res) => {
    try {
      const categories = await storage.getProductCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sales routes
  app.get("/api/sales", authenticateToken, async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const sales = await storage.getSales(Number(limit), offset);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/sales/:id", authenticateToken, async (req, res) => {
    try {
      const sale = await storage.getSaleWithItems(Number(req.params.id));
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/sales", authenticateToken, async (req: any, res: any) => {
    try {
      const { sale, items } = req.body;
      const saleNumber = `VEN-${Date.now()}`;
      
      const validatedSale = insertSaleSchema.parse({
        ...sale,
        saleNumber,
        userId: (req as any).user?.userId || 1,
      });

      const validatedItems = items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }));

      const newSale = await storage.createSale(validatedSale, validatedItems);
      res.status(201).json(newSale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/sales/:id", authenticateToken, async (req, res) => {
    try {
      const saleId = Number(req.params.id);
      const updateData = req.body;

      // Validate that sale exists
      const existingSale = await storage.getSale(saleId);
      if (!existingSale) {
        return res.status(404).json({ message: "Sale not found" });
      }

      // Update the sale
      const updatedSale = await storage.updateSale(saleId, updateData);
      if (!updatedSale) {
        return res.status(500).json({ message: "Failed to update sale" });
      }

      res.json(updatedSale);
    } catch (error) {
      console.error("Error updating sale:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Quote routes
  app.get("/api/quotes", authenticateToken, async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const quotes = await storage.getQuotes(Number(limit), offset);
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/quotes/:id", authenticateToken, async (req, res) => {
    try {
      const quote = await storage.getQuoteWithItems(Number(req.params.id));
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/quotes", authenticateToken, async (req, res) => {
    try {
      const { quote, items } = req.body;
      const quoteNumber = `ORC-${Date.now()}`;
      
      // Calcular finalAmount (totalAmount - discountAmount)
      const totalAmount = parseFloat(quote.totalAmount || "0");
      const discountAmount = parseFloat(quote.discountAmount || "0");
      const finalAmount = totalAmount - discountAmount;
      
      const validatedQuote = insertQuoteSchema.parse({
        ...quote,
        quoteNumber,
        userId: (req as any).user?.userId || 1,
        finalAmount: finalAmount.toString(),
        validUntil: quote.validUntil,
      });

      const validatedItems = items.map((item: any) => 
        insertQuoteItemSchema.parse({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })
      );

      const newQuote = await storage.createQuote(validatedQuote, validatedItems);
      res.status(201).json(newQuote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating quote:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/quotes/:id/convert-to-sale", authenticateToken, async (req, res) => {
    try {
      const { paymentMethod, paymentStatus, installments } = req.body;
      
      if (!paymentMethod) {
        return res.status(400).json({ message: "Payment method is required" });
      }

      const sale = await storage.convertQuoteToSale(Number(req.params.id), {
        paymentMethod,
        paymentStatus: paymentStatus || 'completed',
        installments: installments || 1
      });
      
      if (!sale) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(sale);
    } catch (error) {
      console.error("Error converting quote to sale:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/quotes/:id", authenticateToken, async (req, res) => {
    try {
      const quoteId = Number(req.params.id);
      const quote = await storage.getQuote(quoteId);
      
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      const success = await storage.deleteQuote(quoteId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete quote" });
      }

      res.json({ message: "Quote deleted successfully" });
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/quotes/:id/pdf", authenticateToken, async (req, res) => {
    try {
      const quote = await storage.getQuoteWithItems(Number(req.params.id));
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      const pdfBuffer = await PDFService.generateQuotePDF({
        quote,
        items: quote.items
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="orcamento-${quote.quoteNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Prescription routes
  app.get("/api/prescriptions", authenticateToken, async (req, res) => {
    try {
      const { customerId } = req.query;
      const prescriptions = await storage.getPrescriptions(customerId ? Number(customerId) : undefined);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/prescriptions", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(validatedData);
      res.status(201).json(prescription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", authenticateToken, async (req, res) => {
    try {
      const { date } = req.query;
      const appointments = await storage.getAppointments(date ? new Date(date as string) : undefined);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/appointments", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse({
        ...req.body,
        userId: (req as any).user?.userId || 1,
      });
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Financial routes
  app.get("/api/financial/accounts", authenticateToken, async (req, res) => {
    try {
      const { type } = req.query;
      const accounts = await storage.getFinancialAccounts(type as string);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/financial/overdue", authenticateToken, async (req, res) => {
    try {
      const accounts = await storage.getOverdueAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/financial/accounts", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertFinancialAccountSchema.parse(req.body);
      const account = await storage.createFinancialAccount(validatedData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/financial/accounts/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertFinancialAccountSchema.partial().parse(req.body);
      const account = await storage.updateFinancialAccount(parseInt(id), validatedData);
      if (!account) {
        return res.status(404).json({ message: "Financial account not found" });
      }
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Suppliers routes
  app.get("/api/suppliers", authenticateToken, async (req, res) => {
    try {
      const { limit, offset } = req.query;
      const suppliers = await storage.getSuppliers(
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/suppliers/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const supplier = await storage.getSupplier(parseInt(id));
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/suppliers", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/suppliers/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(parseInt(id), validatedData);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/suppliers/search/:query", authenticateToken, async (req, res) => {
    try {
      const { query } = req.params;
      const suppliers = await storage.searchSuppliers(query);
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Expense Categories routes
  app.get("/api/expense-categories", authenticateToken, async (req, res) => {
    try {
      const categories = await storage.getExpenseCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/expense-categories/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.getExpenseCategory(parseInt(id));
      if (!category) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/expense-categories", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertExpenseCategorySchema.parse(req.body);
      const category = await storage.createExpenseCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/expense-categories/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertExpenseCategorySchema.partial().parse(req.body);
      const category = await storage.updateExpenseCategory(parseInt(id), validatedData);
      if (!category) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Accounts Payable routes
  app.get("/api/accounts-payable/test", authenticateToken, async (req, res) => {
    try {
      console.log("Test endpoint reached");
      res.json({ message: "Test endpoint working" });
    } catch (error) {
      console.error("Error in test endpoint:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounts-payable/stats", authenticateToken, async (req, res) => {
    try {
      console.log("Stats endpoint reached");
      const stats = {
        totalPending: '2750.00',
        totalOverdue: '0.00',
        totalPaidThisMonth: '0.00',
        upcomingPayments: 0,
        averagePaymentDelay: 0,
      };
      console.log("Sending stats:", stats);
      res.json(stats);
    } catch (error) {
      console.error("Error getting accounts payable stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounts-payable", authenticateToken, async (req, res) => {
    try {
      const { limit, offset } = req.query;
      const accounts = await storage.getAccountsPayable(
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      res.json(accounts);
    } catch (error) {
      console.error("Error getting accounts payable:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounts-payable/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const account = await storage.getAccountPayableWithDetails(parseInt(id));
      if (!account) {
        return res.status(404).json({ message: "Account payable not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/accounts-payable", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertAccountPayableSchema.parse({
        ...req.body,
        userId: req.user?.userId
      });
      const account = await storage.createAccountPayable(validatedData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/accounts-payable/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertAccountPayableSchema.partial().parse(req.body);
      const account = await storage.updateAccountPayable(parseInt(id), validatedData);
      if (!account) {
        return res.status(404).json({ message: "Account payable not found" });
      }
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/accounts-payable/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteAccountPayable(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "Account payable not found" });
      }
      res.json({ message: "Account payable deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounts-payable/overdue", authenticateToken, async (req, res) => {
    try {
      const accounts = await storage.getOverdueAccountsPayable();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounts-payable/due/:days", authenticateToken, async (req, res) => {
    try {
      const { days } = req.params;
      const accounts = await storage.getDueAccountsPayable(parseInt(days));
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounts-payable/supplier/:supplierId", authenticateToken, async (req, res) => {
    try {
      const { supplierId } = req.params;
      const accounts = await storage.getAccountsPayableBySupplier(parseInt(supplierId));
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounts-payable/category/:categoryId", authenticateToken, async (req, res) => {
    try {
      const { categoryId } = req.params;
      const accounts = await storage.getAccountsPayableByCategory(parseInt(categoryId));
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/accounts-payable/search/:query", authenticateToken, async (req, res) => {
    try {
      const { query } = req.params;
      const accounts = await storage.searchAccountsPayable(query);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Payment History routes
  app.get("/api/payment-history/:accountPayableId", authenticateToken, async (req, res) => {
    try {
      const { accountPayableId } = req.params;
      const history = await storage.getPaymentHistory(parseInt(accountPayableId));
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/payment-history", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertPaymentHistorySchema.parse({
        ...req.body,
        userId: req.user?.userId
      });
      const payment = await storage.createPaymentHistory(validatedData);
      
      // Update the account payable with payment information
      const account = await storage.getAccountPayable(validatedData.accountPayableId);
      if (account) {
        const newPaidAmount = parseFloat(account.paidAmount || '0') + parseFloat(validatedData.amount);
        const newRemainingAmount = parseFloat(account.totalAmount) - newPaidAmount;
        const newStatus = newRemainingAmount <= 0 ? 'paid' : 'pending';
        
        await storage.updateAccountPayable(validatedData.accountPayableId, {
          paidAmount: newPaidAmount.toFixed(2),
          remainingAmount: newRemainingAmount.toFixed(2),
          status: newStatus,
          paidDate: newStatus === 'paid' ? new Date() : undefined,
          paymentMethod: validatedData.paymentMethod,
          referenceNumber: validatedData.referenceNumber,
        });
      }
      
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Process recurring payments (should be called via cron job)
  app.post("/api/accounts-payable/process-recurring", authenticateToken, async (req, res) => {
    try {
      await storage.processRecurringPayments();
      res.json({ message: "Recurring payments processed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Purchase Orders Routes
  app.get("/api/purchase-orders", authenticateToken, async (req, res) => {
    try {
      const { limit, offset, status, supplierId, onlyPending } = req.query;
      const purchaseOrders = await storage.getPurchaseOrders(
        status as string,
        supplierId ? parseInt(supplierId as string) : undefined,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined,
        onlyPending === 'true'
      );
      res.json(purchaseOrders);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/purchase-orders/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const purchaseOrder = await storage.getPurchaseOrderWithDetails(parseInt(id));
      if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json(purchaseOrder);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/purchase-orders", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Purchase order request body:", JSON.stringify(req.body, null, 2));
      const { items, ...orderData } = req.body;
      console.log("Order data:", orderData);
      console.log("Items:", items);
      
      const validatedOrderData = insertPurchaseOrderSchema.parse({
        ...orderData,
        userId: req.user?.userId,
      });
      
      const purchaseOrder = await storage.createPurchaseOrder(validatedOrderData, items);
      res.status(201).json(purchaseOrder);
    } catch (error) {
      console.error("Error creating purchase order:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/purchase-orders/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { items, ...orderData } = req.body;
      const validatedOrderData = insertPurchaseOrderSchema.partial().parse(orderData);
      
      const purchaseOrder = await storage.updatePurchaseOrder(parseInt(id), validatedOrderData, items);
      if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json(purchaseOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/purchase-orders/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePurchaseOrder(parseInt(id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Purchase Receipts Routes
  app.get("/api/purchase-receipts", authenticateToken, async (req, res) => {
    try {
      const { purchaseOrderId, limit, offset } = req.query;
      const receipts = await storage.getPurchaseReceipts(
        purchaseOrderId ? parseInt(purchaseOrderId as string) : undefined,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      res.json(receipts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/purchase-receipts/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const receipt = await storage.getPurchaseReceiptWithDetails(parseInt(id));
      if (!receipt) {
        return res.status(404).json({ message: "Purchase receipt not found" });
      }
      res.json(receipt);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/purchase-receipts", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { items = [], ...receiptData } = req.body;
      const validatedReceiptData = insertPurchaseReceiptSchema.parse({
        ...receiptData,
        userId: req.user?.userId,
      });
      
      const receipt = await storage.createPurchaseReceipt(validatedReceiptData, items);
      res.status(201).json(receipt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Supplier Categories Routes
  app.get("/api/supplier-categories", authenticateToken, async (req, res) => {
    try {
      const categories = await storage.getSupplierCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/supplier-categories", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertSupplierCategorySchema.parse(req.body);
      const category = await storage.createSupplierCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Purchase Reports Routes
  app.get("/api/purchase-reports/summary", authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate, supplierId } = req.query;
      const summary = await storage.getPurchaseReportSummary(
        startDate as string,
        endDate as string,
        supplierId ? parseInt(supplierId as string) : undefined
      );
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/purchase-reports/by-supplier", authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await storage.getPurchasesBySupplierReport(
        startDate as string,
        endDate as string
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/purchase-reports/by-category", authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await storage.getPurchasesByCategoryReport(
        startDate as string,
        endDate as string
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
