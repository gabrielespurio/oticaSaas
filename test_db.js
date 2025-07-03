const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');

const DATABASE_URL = "postgresql://neondb_owner:npg_lqeFQj63wbfM@ep-weathered-flower-ac8qi8qh-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function testQuery() {
  try {
    const pool = new Pool({ connectionString: DATABASE_URL });
    const db = drizzle({ client: pool });
    
    // Test basic query
    const result = await db.execute(`SELECT COUNT(*) FROM sales`);
    console.log('Sales count:', result.rows[0]);
    
    // Test sales with customer join
    const salesResult = await db.execute(`
      SELECT s.*, c.full_name 
      FROM sales s 
      INNER JOIN customers c ON s.customer_id = c.id 
      LIMIT 5
    `);
    console.log('Sales with customers:', salesResult.rows);
    
    pool.end();
  } catch (error) {
    console.error('Database error:', error);
  }
}

testQuery();
