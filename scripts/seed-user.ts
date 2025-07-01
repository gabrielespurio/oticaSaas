import bcrypt from "bcrypt";
import { db } from "../server/db";
import { users } from "../shared/schema";

async function seedDefaultUser() {
  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length > 0) {
      console.log("Users already exist");
      return;
    }

    // Create default admin user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("admin123", saltRounds);

    const defaultUser = {
      username: "admin",
      email: "admin@oticamanager.com",
      password: hashedPassword,
      fullName: "Administrador",
      role: "admin"
    };

    const insertedUser = await db.insert(users).values(defaultUser).returning();

    console.log("Default user created successfully:");
    console.log(`- Username: ${insertedUser[0].username}`);
    console.log(`- Email: ${insertedUser[0].email}`);
    console.log(`- Password: admin123`);
    console.log(`- Role: ${insertedUser[0].role}`);
    
  } catch (error) {
    console.error("Error creating default user:", error);
  } finally {
    process.exit(0);
  }
}

seedDefaultUser();