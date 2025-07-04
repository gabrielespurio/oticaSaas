import { db } from "../server/db";
import { purchaseOrders, purchaseOrderItems, purchaseReceipts, purchaseReceiptItems, products, suppliers } from "../shared/schema";

async function createPurchaseData() {
  console.log("Creating sample purchase orders and receipts...");
  
  // Get existing suppliers and products
  const existingSuppliers = await db.select().from(suppliers);
  const existingProducts = await db.select().from(products);
  
  if (existingSuppliers.length === 0 || existingProducts.length === 0) {
    console.log("No suppliers or products found. Please seed them first.");
    return;
  }
  
  // Create first purchase order
  const order1 = await db.insert(purchaseOrders).values({
    supplierId: existingSuppliers[0].id,
    userId: 1,
    orderNumber: 'PO-001',
    orderDate: new Date(),
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    totalAmount: '1200.00',
    status: 'pending',
    notes: 'Pedido de armações para estoque'
  }).returning();
  
  // Create items for first order
  await db.insert(purchaseOrderItems).values([
    {
      purchaseOrderId: order1[0].id,
      productId: existingProducts[0].id,
      quantity: 10,
      unitPrice: '80.00',
      totalPrice: '800.00',
    },
    {
      purchaseOrderId: order1[0].id,
      productId: existingProducts[1].id,
      quantity: 5,
      unitPrice: '80.00',
      totalPrice: '400.00',
    }
  ]);
  
  console.log(`Created purchase order ${order1[0].orderNumber}`);
  
  // Create second purchase order
  const order2 = await db.insert(purchaseOrders).values({
    supplierId: existingSuppliers[1].id,
    userId: 1,
    orderNumber: 'PO-002',
    orderDate: new Date(),
    expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    totalAmount: '800.00',
    status: 'pending',
    notes: 'Pedido de lentes especiais'
  }).returning();
  
  // Create items for second order
  await db.insert(purchaseOrderItems).values([
    {
      purchaseOrderId: order2[0].id,
      productId: existingProducts[3].id, // Lentes Transitions
      quantity: 20,
      unitPrice: '40.00',
      totalPrice: '800.00',
    }
  ]);
  
  console.log(`Created purchase order ${order2[0].orderNumber}`);
  
  // Create a purchase receipt for first order
  const receipt1 = await db.insert(purchaseReceipts).values({
    purchaseOrderId: order1[0].id,
    userId: 1,
    receiptNumber: 'RC-001',
    receiptDate: new Date(),
    notes: 'Recebimento parcial do pedido PO-001'
  }).returning();
  
  // Get the order items for the receipt
  const orderItems = await db.select().from(purchaseOrderItems).where(
    (item) => item.purchaseOrderId === order1[0].id
  );
  
  // Create receipt items (partial delivery)
  await db.insert(purchaseReceiptItems).values([
    {
      receiptId: receipt1[0].id,
      purchaseOrderItemId: orderItems[0].id,
      receivedQuantity: 8, // Received 8 out of 10
      notes: 'Recebimento parcial - 2 unidades pendentes'
    },
    {
      receiptId: receipt1[0].id,
      purchaseOrderItemId: orderItems[1].id,
      receivedQuantity: 5, // Received all 5
      notes: 'Recebimento completo'
    }
  ]);
  
  console.log(`Created purchase receipt ${receipt1[0].receiptNumber}`);
  
  console.log("✅ Sample purchase data created successfully!");
}

createPurchaseData().catch(console.error);