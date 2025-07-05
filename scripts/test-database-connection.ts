import { db } from "../server/db";
import { accountsPayable, suppliers, expenseCategories, users } from "../shared/schema";

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test connection by counting records in key tables
    const accountsCount = await db.select({ count: accountsPayable.id }).from(accountsPayable);
    const suppliersCount = await db.select({ count: suppliers.id }).from(suppliers);
    const categoriesCount = await db.select({ count: expenseCategories.id }).from(expenseCategories);
    const usersCount = await db.select({ count: users.id }).from(users);
    
    console.log('Database connection successful!');
    console.log('Table counts:');
    console.log('- Accounts payable:', accountsCount.length);
    console.log('- Suppliers:', suppliersCount.length);
    console.log('- Categories:', categoriesCount.length);
    console.log('- Users:', usersCount.length);
    
    // Check if there are any accounts payable records
    if (accountsCount.length > 0) {
      const sampleAccount = await db.select().from(accountsPayable).limit(1);
      console.log('Sample account payable:', sampleAccount[0]);
    }
    
    console.log('✓ Database connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

testDatabaseConnection();