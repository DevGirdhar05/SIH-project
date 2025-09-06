import { db } from "../server/db";
import { departments, wards, categories, users } from "../shared/schema";
import { authService } from "../server/services/auth";

async function seed() {
  console.log("Starting database seeding...");

  try {
    // Create departments
    const deptData = [
      { name: "Public Works", code: "PWD", email: "pwd@city.gov", phone: "+91-123-456-7890" },
      { name: "Electricity Board", code: "EB", email: "electricity@city.gov", phone: "+91-123-456-7891" },
      { name: "Water Department", code: "WD", email: "water@city.gov", phone: "+91-123-456-7892" },
      { name: "Sanitation", code: "SAN", email: "sanitation@city.gov", phone: "+91-123-456-7893" },
      { name: "Parks & Recreation", code: "PR", email: "parks@city.gov", phone: "+91-123-456-7894" },
    ];

    const createdDepts = await db.insert(departments).values(deptData).returning();
    console.log(`Created ${createdDepts.length} departments`);

    // Create wards
    const wardData = [
      { name: "Ward 1 - Central", code: "W001" },
      { name: "Ward 2 - North", code: "W002" },
      { name: "Ward 3 - South", code: "W003" },
      { name: "Ward 4 - East", code: "W004" },
      { name: "Ward 5 - West", code: "W005" },
      { name: "Ward 6 - Industrial", code: "W006" },
      { name: "Ward 7 - Residential", code: "W007" },
      { name: "Ward 8 - Commercial", code: "W008" },
    ];

    const createdWards = await db.insert(wards).values(wardData).returning();
    console.log(`Created ${createdWards.length} wards`);

    // Create categories
    const categoryData = [
      { name: "Pothole", code: "pothole", icon: "🛣️", slaHours: 168, priorityWeight: 3, departmentId: createdDepts[0].id }, // 7 days
      { name: "Street Light Out", code: "streetlight", icon: "💡", slaHours: 72, priorityWeight: 2, departmentId: createdDepts[1].id }, // 3 days
      { name: "Garbage Overflow", code: "garbage", icon: "🗑️", slaHours: 24, priorityWeight: 4, departmentId: createdDepts[3].id }, // 1 day
      { name: "Water Leakage", code: "water", icon: "💧", slaHours: 48, priorityWeight: 5, departmentId: createdDepts[2].id }, // 2 days
      { name: "Traffic Light Issue", code: "traffic", icon: "🚦", slaHours: 12, priorityWeight: 5, departmentId: createdDepts[0].id }, // 12 hours
      { name: "Tree Fall", code: "tree", icon: "🌳", slaHours: 24, priorityWeight: 4, departmentId: createdDepts[4].id }, // 1 day
      { name: "Road Damage", code: "road", icon: "🛤️", slaHours: 120, priorityWeight: 3, departmentId: createdDepts[0].id }, // 5 days
      { name: "Drainage Block", code: "drainage", icon: "🚰", slaHours: 48, priorityWeight: 4, departmentId: createdDepts[3].id }, // 2 days
      { name: "Illegal Dumping", code: "dumping", icon: "🚫", slaHours: 72, priorityWeight: 3, departmentId: createdDepts[3].id }, // 3 days
      { name: "Park Maintenance", code: "park", icon: "🌲", slaHours: 168, priorityWeight: 2, departmentId: createdDepts[4].id }, // 7 days
    ];

    const createdCategories = await db.insert(categories).values(categoryData).returning();
    console.log(`Created ${createdCategories.length} categories`);

    // Create admin user
    const adminPassword = await authService.hashPassword("admin123");
    const adminUser = {
      name: "Admin User",
      email: "admin@civicconnect.com",
      password: adminPassword,
      role: "ADMIN" as const,
      phone: "+91-987-654-3210",
      locale: "en",
      isActive: true,
    };

    const createdAdmin = await db.insert(users).values(adminUser).returning();
    console.log(`Created admin user: ${createdAdmin[0].email}`);

    // Create some sample officers
    const officerPassword = await authService.hashPassword("officer123");
    const officerData = [
      {
        name: "John Smith",
        email: "john.smith@city.gov",
        password: officerPassword,
        role: "OFFICER" as const,
        phone: "+91-987-654-3211",
        wardId: createdWards[0].id,
        locale: "en",
        isActive: true,
      },
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@city.gov", 
        password: officerPassword,
        role: "SUPERVISOR" as const,
        phone: "+91-987-654-3212",
        wardId: createdWards[1].id,
        locale: "en",
        isActive: true,
      },
      {
        name: "Mike Wilson",
        email: "mike.wilson@city.gov",
        password: officerPassword,
        role: "OFFICER" as const,
        phone: "+91-987-654-3213",
        wardId: createdWards[2].id,
        locale: "en",
        isActive: true,
      },
    ];

    const createdOfficers = await db.insert(users).values(officerData).returning();
    console.log(`Created ${createdOfficers.length} officer users`);

    // Create a sample citizen user
    const citizenPassword = await authService.hashPassword("citizen123");
    const citizenUser = {
      name: "Jane Citizen",
      email: "jane@example.com",
      password: citizenPassword,
      role: "CITIZEN" as const,
      phone: "+91-987-654-3214",
      locale: "en",
      isActive: true,
    };

    const createdCitizen = await db.insert(users).values(citizenUser).returning();
    console.log(`Created citizen user: ${createdCitizen[0].email}`);

    console.log("Database seeding completed successfully!");
    console.log("\nDefault login credentials:");
    console.log("Admin: admin@civicconnect.com / admin123");
    console.log("Officer: john.smith@city.gov / officer123");
    console.log("Supervisor: sarah.johnson@city.gov / officer123");
    console.log("Citizen: jane@example.com / citizen123");

  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed().catch(console.error);