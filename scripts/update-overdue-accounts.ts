import { db } from "../server/db";
import { accountsPayable } from "../shared/schema";
import { and, eq, lt } from "drizzle-orm";

async function updateOverdueAccounts() {
  console.log("Updating overdue accounts payable...");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  // Update all pending accounts that are past due date to 'overdue'
  const result = await db
    .update(accountsPayable)
    .set({ status: 'overdue' })
    .where(
      and(
        eq(accountsPayable.status, 'pending'),
        lt(accountsPayable.dueDate, today)
      )
    );
  
  console.log(`✅ Updated ${result.rowCount || 0} accounts to overdue status`);
  
  // Show current overdue accounts
  const overdueAccounts = await db
    .select({
      id: accountsPayable.id,
      description: accountsPayable.description,
      dueDate: accountsPayable.dueDate,
      status: accountsPayable.status,
      totalAmount: accountsPayable.totalAmount
    })
    .from(accountsPayable)
    .where(eq(accountsPayable.status, 'overdue'));
  
  console.log("\nCurrent overdue accounts:");
  overdueAccounts.forEach(account => {
    console.log(`- ${account.description}: R$ ${account.totalAmount} (venceu em ${account.dueDate.toLocaleDateString('pt-BR')})`);
  });
}

updateOverdueAccounts().catch(console.error);