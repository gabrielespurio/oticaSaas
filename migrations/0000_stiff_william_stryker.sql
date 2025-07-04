CREATE TABLE "accounts_payable" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer,
	"category_id" integer,
	"user_id" integer NOT NULL,
	"description" text NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"remaining_amount" numeric(10, 2) NOT NULL,
	"due_date" timestamp NOT NULL,
	"paid_date" timestamp,
	"payment_method" text,
	"reference_number" text,
	"installments" integer DEFAULT 1,
	"current_installment" integer DEFAULT 1,
	"is_recurring" boolean DEFAULT false,
	"recurring_type" text,
	"recurring_day" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"parent_id" integer,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"user_id" integer,
	"title" text NOT NULL,
	"description" text,
	"appointment_date" timestamp NOT NULL,
	"duration" integer DEFAULT 30,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"type" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text,
	"cpf" text,
	"birth_date" timestamp,
	"street" varchar(255),
	"number" varchar(20),
	"complement" text,
	"neighborhood" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6B7280',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"sale_id" integer,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"due_date" timestamp NOT NULL,
	"paid_date" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_payable_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" timestamp NOT NULL,
	"payment_method" text NOT NULL,
	"reference_number" text,
	"notes" text,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescription_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"prescription_id" integer NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"path" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"doctor_name" text,
	"issue_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"right_sphere" numeric(4, 2),
	"right_cylinder" numeric(4, 2),
	"right_axis" integer,
	"right_add" numeric(3, 2),
	"left_sphere" numeric(4, 2),
	"left_cylinder" numeric(4, 2),
	"left_axis" integer,
	"left_add" numeric(3, 2),
	"right_pd" numeric(4, 1),
	"left_pd" numeric(4, 1),
	"notes" text,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"barcode" text,
	"category_id" integer,
	"brand" text,
	"model" text,
	"color" text,
	"size" text,
	"description" text,
	"cost_price" numeric(10, 2),
	"sale_price" numeric(10, 2) NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"min_stock_level" integer DEFAULT 5 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"received_quantity" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "purchase_receipt_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt_id" integer NOT NULL,
	"purchase_order_item_id" integer NOT NULL,
	"received_quantity" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"quote_number" text NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"final_amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"valid_until" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_quote_number_unique" UNIQUE("quote_number")
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"sale_number" text NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"final_amount" numeric(10, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"installments" integer DEFAULT 1,
	"status" text DEFAULT 'active' NOT NULL,
	"sale_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	CONSTRAINT "sales_sale_number_unique" UNIQUE("sale_number")
);
--> statement-breakpoint
CREATE TABLE "supplier_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6B7280' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"cnpj" text,
	"street" varchar(255),
	"number" varchar(20),
	"complement" text,
	"neighborhood" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_account_payable_id_accounts_payable_id_fk" FOREIGN KEY ("account_payable_id") REFERENCES "public"."accounts_payable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_files" ADD CONSTRAINT "prescription_files_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_receipt_items" ADD CONSTRAINT "purchase_receipt_items_receipt_id_purchase_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."purchase_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_receipt_items" ADD CONSTRAINT "purchase_receipt_items_purchase_order_item_id_purchase_order_items_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;