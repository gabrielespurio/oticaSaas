import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_lqeFQj63wbfM@ep-weathered-flower-ac8qi8qh-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle({ client: pool });

async function createMissingTables() {
  try {
    console.log('Checking and creating missing tables...');
    
    // Check if purchase_orders table exists
    const checkPurchaseOrders = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_orders'
      );
    `);
    
    if (!checkPurchaseOrders.rows[0].exists) {
      console.log('Creating purchase_orders table...');
      await db.execute(sql`
        CREATE TABLE "purchase_orders" (
          "id" serial PRIMARY KEY NOT NULL,
          "supplier_id" integer NOT NULL,
          "user_id" integer NOT NULL,
          "order_number" text NOT NULL,
          "order_date" timestamp DEFAULT now() NOT NULL,
          "expected_delivery_date" timestamp,
          "total_amount" numeric(10, 2) NOT NULL,
          "status" text DEFAULT 'pending' NOT NULL,
          "notes" text,
          "created_at" timestamp DEFAULT now() NOT NULL,
          CONSTRAINT "purchase_orders_order_number_unique" UNIQUE("order_number")
        );
      `);
      
      await db.execute(sql`
        ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" 
        FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action;
      `);
      
      await db.execute(sql`
        ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
      `);
    } else {
      console.log('purchase_orders table already exists');
    }
    
    // Check if purchase_order_items table exists
    const checkPurchaseOrderItems = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_order_items'
      );
    `);
    
    if (!checkPurchaseOrderItems.rows[0].exists) {
      console.log('Creating purchase_order_items table...');
      await db.execute(sql`
        CREATE TABLE "purchase_order_items" (
          "id" serial PRIMARY KEY NOT NULL,
          "purchase_order_id" integer NOT NULL,
          "product_id" integer NOT NULL,
          "quantity" integer NOT NULL,
          "unit_price" numeric(10, 2) NOT NULL,
          "total_price" numeric(10, 2) NOT NULL,
          "received_quantity" integer DEFAULT 0 NOT NULL
        );
      `);
      
      await db.execute(sql`
        ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" 
        FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE no action ON UPDATE no action;
      `);
      
      await db.execute(sql`
        ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_products_id_fk" 
        FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
      `);
    } else {
      console.log('purchase_order_items table already exists');
    }
    
    // Check if purchase_receipts table exists
    const checkPurchaseReceipts = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_receipts'
      );
    `);
    
    if (!checkPurchaseReceipts.rows[0].exists) {
      console.log('Creating purchase_receipts table...');
      await db.execute(sql`
        CREATE TABLE "purchase_receipts" (
          "id" serial PRIMARY KEY NOT NULL,
          "purchase_order_id" integer NOT NULL,
          "user_id" integer NOT NULL,
          "receipt_number" text NOT NULL,
          "receipt_date" timestamp NOT NULL,
          "notes" text,
          "created_at" timestamp DEFAULT now() NOT NULL,
          CONSTRAINT "purchase_receipts_receipt_number_unique" UNIQUE("receipt_number")
        );
      `);
      
      await db.execute(sql`
        ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_purchase_order_id_purchase_orders_id_fk" 
        FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE no action ON UPDATE no action;
      `);
      
      await db.execute(sql`
        ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
      `);
    } else {
      console.log('purchase_receipts table already exists');
    }
    
    // Check if purchase_receipt_items table exists
    const checkPurchaseReceiptItems = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_receipt_items'
      );
    `);
    
    if (!checkPurchaseReceiptItems.rows[0].exists) {
      console.log('Creating purchase_receipt_items table...');
      await db.execute(sql`
        CREATE TABLE "purchase_receipt_items" (
          "id" serial PRIMARY KEY NOT NULL,
          "receipt_id" integer NOT NULL,
          "purchase_order_item_id" integer NOT NULL,
          "received_quantity" integer NOT NULL,
          "notes" text
        );
      `);
      
      await db.execute(sql`
        ALTER TABLE "purchase_receipt_items" ADD CONSTRAINT "purchase_receipt_items_receipt_id_purchase_receipts_id_fk" 
        FOREIGN KEY ("receipt_id") REFERENCES "purchase_receipts"("id") ON DELETE no action ON UPDATE no action;
      `);
      
      await db.execute(sql`
        ALTER TABLE "purchase_receipt_items" ADD CONSTRAINT "purchase_receipt_items_purchase_order_item_id_purchase_order_items_id_fk" 
        FOREIGN KEY ("purchase_order_item_id") REFERENCES "purchase_order_items"("id") ON DELETE no action ON UPDATE no action;
      `);
    } else {
      console.log('purchase_receipt_items table already exists');
    }
    
    console.log('All missing tables created successfully!');
    
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createMissingTables();