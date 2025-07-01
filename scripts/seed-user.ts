import { db } from "../server/db";
import { users } from "../shared/schema";
import bcrypt from "bcrypt";

async function seedDefaultUser() {
  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).limit(1);
    
    if (existingUser.length > 0) {
      console.log("Default user already exists");
      return;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const [user] = await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      email: "admin@opticamanager.com",
      fullName: "Administrador",
      role: "admin",
      isActive: true,
    }).returning();

    console.log("Default user created successfully:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Email: admin@opticamanager.com");
    
  } catch (error) {
    console.error("Error creating default user:", error);
  } finally {
    process.exit(0);
  }
}

seedDefaultUser();