import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function addPurchaseOrderColumn() {
  const DATABASE_URL = "postgresql://neondb_owner:npg_lqeFQj63wbfM@ep-weathered-flower-ac8qi8qh-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('Adding purchase_order_id column to accounts_payable table...');
    
    // Check if the column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'accounts_payable' 
      AND column_name = 'purchase_order_id'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✓ Column purchase_order_id already exists');
      return;
    }
    
    // Add the column
    await pool.query(`
      ALTER TABLE accounts_payable 
      ADD COLUMN purchase_order_id INTEGER 
      REFERENCES purchase_orders(id)
    `);
    
    console.log('✓ Successfully added purchase_order_id column');
    
  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addPurchaseOrderColumn();