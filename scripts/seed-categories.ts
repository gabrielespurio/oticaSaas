import { db } from "../server/db";
import { productCategories } from "../shared/schema";

async function seedCategories() {
  try {
    // Check if categories already exist
    const existingCategories = await db.select().from(productCategories).limit(1);
    
    if (existingCategories.length > 0) {
      console.log("Categories already exist");
      return;
    }

    // Create default product categories
    const categories = [
      {
        name: "Armações",
        description: "Armações de óculos de grau e sol"
      },
      {
        name: "Lentes",
        description: "Lentes de grau, multifocais e especiais"
      },
      {
        name: "Óculos de Sol",
        description: "Óculos de sol e acessórios"
      },
      {
        name: "Acessórios",
        description: "Cordões, estojos, lenços de limpeza e outros acessórios"
      },
      {
        name: "Lentes de Contato",
        description: "Lentes de contato e soluções"
      }
    ];

    const insertedCategories = await db.insert(productCategories).values(categories).returning();

    console.log("Categories created successfully:");
    insertedCategories.forEach(category => {
      console.log(`- ${category.name}: ${category.description}`);
    });
    
  } catch (error) {
    console.error("Error creating categories:", error);
  } finally {
    process.exit(0);
  }
}

seedCategories();