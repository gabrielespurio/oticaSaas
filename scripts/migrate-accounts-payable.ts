import { db } from "../server/db";
import { 
  suppliers, 
  expenseCategories, 
  accountsPayable, 
  paymentHistory 
} from "../shared/schema";

async function createAccountsPayableTables() {
  console.log("Creating accounts payable tables...");
  
  try {
    // Create suppliers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        cnpj TEXT UNIQUE,
        street VARCHAR(255),
        number VARCHAR(20),
        complement TEXT,
        neighborhood TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create expense categories table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#6B7280',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create accounts payable table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS accounts_payable (
        id SERIAL PRIMARY KEY,
        supplier_id INTEGER REFERENCES suppliers(id),
        category_id INTEGER REFERENCES expense_categories(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        description TEXT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        paid_amount DECIMAL(10, 2) DEFAULT 0,
        remaining_amount DECIMAL(10, 2) NOT NULL,
        due_date TIMESTAMP NOT NULL,
        paid_date TIMESTAMP,
        payment_method TEXT,
        reference_number TEXT,
        installments INTEGER DEFAULT 1,
        current_installment INTEGER DEFAULT 1,
        is_recurring BOOLEAN DEFAULT false,
        recurring_type TEXT,
        recurring_day INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        parent_id INTEGER,
        attachments JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create payment history table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payment_history (
        id SERIAL PRIMARY KEY,
        account_payable_id INTEGER NOT NULL REFERENCES accounts_payable(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        amount DECIMAL(10, 2) NOT NULL,
        payment_date TIMESTAMP NOT NULL,
        payment_method TEXT NOT NULL,
        reference_number TEXT,
        notes TEXT,
        attachments JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log("✅ Tables created successfully!");
    
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
}

async function seedDefaultData() {
  console.log("Seeding default data...");
  
  try {
    // Insert default expense categories
    await db.execute(`
      INSERT INTO expense_categories (name, description, color) VALUES
      ('Aluguel', 'Despesas com aluguel e locação', '#EF4444'),
      ('Fornecedores', 'Pagamentos a fornecedores de produtos', '#3B82F6'),
      ('Laboratório', 'Despesas com laboratório de lentes', '#10B981'),
      ('Serviços', 'Prestação de serviços diversos', '#F59E0B'),
      ('Água/Luz', 'Contas de água e energia elétrica', '#6366F1'),
      ('Telefone/Internet', 'Telecomunicações', '#8B5CF6'),
      ('Impostos', 'Impostos e taxas', '#EF4444'),
      ('Manutenção', 'Manutenção e reparos', '#14B8A6'),
      ('Marketing', 'Publicidade e marketing', '#F97316'),
      ('Outros', 'Outras despesas', '#6B7280')
      ON CONFLICT DO NOTHING;
    `);
    
    console.log("✅ Default data seeded successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  }
}

async function main() {
  try {
    await createAccountsPayableTables();
    await seedDefaultData();
    console.log("🎉 Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  }
}

main();