import { db } from "../server/db";
import { accountsPayable } from "../shared/schema";

async function fixAccountsPayable() {
  try {
    console.log('Checking accounts payable table...');
    
    // Try to query the accounts payable table to see if it works
    const result = await db.select().from(accountsPayable).limit(1);
    console.log('✓ Accounts payable table is working correctly');
    console.log('Found records:', result.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Error with accounts payable table:', error);
    process.exit(1);
  }
}

fixAccountsPayable();