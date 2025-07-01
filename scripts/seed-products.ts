import { db } from "../server/db";
import { products, productCategories } from "../shared/schema";

async function seedProducts() {
  try {
    // Check if products already exist
    const existingProducts = await db.select().from(products).limit(1);
    
    if (existingProducts.length > 0) {
      console.log("Products already exist");
      return;
    }

    // Get categories
    const categories = await db.select().from(productCategories);
    if (categories.length === 0) {
      console.log("No categories found. Please run seed-categories first.");
      return;
    }

    const armacaoCategory = categories.find(c => c.name === "Armações");
    const lenteCategory = categories.find(c => c.name === "Lentes");
    const oculosSolCategory = categories.find(c => c.name === "Óculos de Sol");
    const acessoriosCategory = categories.find(c => c.name === "Acessórios");

    // Create sample products
    const sampleProducts = [
      // Armações
      {
        name: "Armação Ray-Ban Aviador",
        sku: "ARM-RB-DO-A1B",
        barcode: "1234567890123",
        categoryId: armacaoCategory?.id || 1,
        brand: "Ray-Ban",
        model: "Aviador",
        color: "Dourado",
        size: "58mm",
        description: "Armação clássica aviador em metal dourado com lentes transparentes",
        costPrice: "120.00",
        salePrice: "280.00",
        stockQuantity: 15,
        minStockLevel: 5,
        isActive: true,
      },
      {
        name: "Armação Oakley Holbrook",
        sku: "ARM-OA-PR-B2C",
        barcode: "1234567890124",
        categoryId: armacaoCategory?.id || 1,
        brand: "Oakley",
        model: "Holbrook",
        color: "Preto",
        size: "55mm",
        description: "Armação esportiva em acetato preto com design moderno",
        costPrice: "180.00",
        salePrice: "420.00",
        stockQuantity: 8,
        minStockLevel: 5,
        isActive: true,
      },
      {
        name: "Armação Guess Feminina",
        sku: "ARM-GU-RO-C3D",
        barcode: "1234567890125",
        categoryId: armacaoCategory?.id || 1,
        brand: "Guess",
        model: "Fashion",
        color: "Rosa",
        size: "52mm",
        description: "Armação feminina delicada em acetato rosa com detalhes dourados",
        costPrice: "90.00",
        salePrice: "220.00",
        stockQuantity: 3,
        minStockLevel: 5,
        isActive: true,
      },
      // Lentes
      {
        name: "Lentes Transitions",
        sku: "LEN-TR-CL-D4E",
        barcode: "1234567890126",
        categoryId: lenteCategory?.id || 2,
        brand: "Transitions",
        model: "Signature",
        color: "Clara",
        size: "Padrão",
        description: "Lentes fotossensíveis que escurecem automaticamente no sol",
        costPrice: "150.00",
        salePrice: "350.00",
        stockQuantity: 25,
        minStockLevel: 10,
        isActive: true,
      },
      {
        name: "Lentes Multifocais Varilux",
        sku: "LEN-VA-CL-E5F",
        barcode: "1234567890127",
        categoryId: lenteCategory?.id || 2,
        brand: "Varilux",
        model: "Comfort",
        color: "Clara",
        size: "Padrão",
        description: "Lentes progressivas para visão nítida em todas as distâncias",
        costPrice: "200.00",
        salePrice: "480.00",
        stockQuantity: 12,
        minStockLevel: 8,
        isActive: true,
      },
      // Óculos de Sol
      {
        name: "Óculos Ray-Ban Wayfarer",
        sku: "SOL-RB-PR-F6G",
        barcode: "1234567890128",
        categoryId: oculosSolCategory?.id || 3,
        brand: "Ray-Ban",
        model: "Wayfarer",
        color: "Preto",
        size: "54mm",
        description: "Óculos de sol clássico com proteção UV400",
        costPrice: "180.00",
        salePrice: "420.00",
        stockQuantity: 2,
        minStockLevel: 5,
        isActive: true,
      },
      {
        name: "Óculos Oakley Holbrook",
        sku: "SOL-OA-AZ-G7H",
        barcode: "1234567890129",
        categoryId: oculosSolCategory?.id || 3,
        brand: "Oakley",
        model: "Holbrook",
        color: "Azul",
        size: "57mm",
        description: "Óculos esportivo com lentes polarizadas",
        costPrice: "220.00",
        salePrice: "520.00",
        stockQuantity: 6,
        minStockLevel: 5,
        isActive: true,
      },
      // Acessórios
      {
        name: "Cordão para Óculos Premium",
        sku: "ACC-CO-PR-H8I",
        barcode: "1234567890130",
        categoryId: acessoriosCategory?.id || 4,
        brand: "Generic",
        model: "Premium",
        color: "Preto",
        size: "Único",
        description: "Cordão ajustável em couro sintético premium",
        costPrice: "8.00",
        salePrice: "25.00",
        stockQuantity: 45,
        minStockLevel: 20,
        isActive: true,
      },
      {
        name: "Estojo Rígido para Óculos",
        sku: "ACC-ES-MA-I9J",
        barcode: "1234567890131",
        categoryId: acessoriosCategory?.id || 4,
        brand: "Generic",
        model: "Standard",
        color: "Marrom",
        size: "Médio",
        description: "Estojo protetor rígido com forro macio",
        costPrice: "15.00",
        salePrice: "40.00",
        stockQuantity: 1,
        minStockLevel: 10,
        isActive: true,
      },
      {
        name: "Lenço de Limpeza Microfibra",
        sku: "ACC-LE-AZ-J0K",
        barcode: "1234567890132",
        categoryId: acessoriosCategory?.id || 4,
        brand: "CleanVision",
        model: "MicroClean",
        color: "Azul",
        size: "15x15cm",
        description: "Lenço especial para limpeza de lentes sem riscar",
        costPrice: "3.00",
        salePrice: "12.00",
        stockQuantity: 85,
        minStockLevel: 50,
        isActive: true,
      }
    ];

    const insertedProducts = await db.insert(products).values(sampleProducts).returning();

    console.log("Sample products created successfully:");
    insertedProducts.forEach(product => {
      console.log(`- ${product.name} (${product.sku}) - ${product.stockQuantity} unidades`);
    });
    
  } catch (error) {
    console.error("Error creating products:", error);
  } finally {
    process.exit(0);
  }
}

seedProducts();