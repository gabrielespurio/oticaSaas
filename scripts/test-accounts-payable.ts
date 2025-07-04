import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_lqeFQj63wbfM@ep-weathered-flower-ac8qi8qh-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle({ client: pool });

async function testAccountsPayable() {
  try {
    console.log('Testing accounts payable functionality...');
    
    // Check if accounts_payable table exists and has data
    const accountsPayableCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM accounts_payable;
    `);
    
    console.log('Current accounts payable count:', accountsPayableCount.rows[0].count);
    
    // Get all accounts payable entries
    const accountsPayable = await db.execute(sql`
      SELECT 
        ap.*,
        s.name as supplier_name
      FROM accounts_payable ap
      LEFT JOIN suppliers s ON ap.supplier_id = s.id
      ORDER BY ap.created_at DESC
      LIMIT 10;
    `);
    
    console.log('Recent accounts payable entries:');
    accountsPayable.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, Description: ${row.description}, Amount: ${row.total_amount}, Supplier: ${row.supplier_name}, Created: ${row.created_at}`);
    });
    
    // Check recent purchase receipts
    const recentReceipts = await db.execute(sql`
      SELECT 
        pr.*,
        po.order_number,
        po.total_amount as order_amount,
        s.name as supplier_name
      FROM purchase_receipts pr
      JOIN purchase_orders po ON pr.purchase_order_id = po.id
      JOIN suppliers s ON po.supplier_id = s.id
      ORDER BY pr.created_at DESC
      LIMIT 5;
    `);
    
    console.log('\nRecent purchase receipts:');
    recentReceipts.rows.forEach((row, index) => {
      console.log(`${index + 1}. Receipt: ${row.receipt_number}, Order: ${row.order_number}, Amount: ${row.order_amount}, Supplier: ${row.supplier_name}, Created: ${row.created_at}`);
    });
    
  } catch (error) {
    console.error('Error testing accounts payable:', error);
  } finally {
    await pool.end();
  }
}

testAccountsPayable();