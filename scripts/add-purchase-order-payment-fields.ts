import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function addPurchaseOrderPaymentFields() {
  const DATABASE_URL = "postgresql://neondb_owner:npg_lqeFQj63wbfM@ep-weathered-flower-ac8qi8qh-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('Adding payment fields to purchase_orders table...');
    
    // Check if payment_date column exists
    const checkPaymentDate = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'purchase_orders' 
      AND column_name = 'payment_date'
    `);
    
    if (checkPaymentDate.rows.length === 0) {
      console.log('Adding payment_date column...');
      await pool.query(`
        ALTER TABLE purchase_orders 
        ADD COLUMN payment_date TIMESTAMP
      `);
    } else {
      console.log('✓ payment_date column already exists');
    }
    
    // Check if installments column exists
    const checkInstallments = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'purchase_orders' 
      AND column_name = 'installments'
    `);
    
    if (checkInstallments.rows.length === 0) {
      console.log('Adding installments column...');
      await pool.query(`
        ALTER TABLE purchase_orders 
        ADD COLUMN installments INTEGER DEFAULT 1 NOT NULL
      `);
    } else {
      console.log('✓ installments column already exists');
    }
    
    console.log('✅ Successfully added payment fields to purchase_orders table');
    
  } catch (error) {
    console.error('❌ Error adding payment fields:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addPurchaseOrderPaymentFields();