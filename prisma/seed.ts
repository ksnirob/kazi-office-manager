import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const defaultIncomeCategories = [
  { nameEn: "New Marriage", nameBn: "নতুন বিবাহ", sortOrder: 1 },
  { nameEn: "Kabin Registration", nameBn: "কাবিন নিবন্ধন", sortOrder: 2 },
  { nameEn: "English Kabin", nameBn: "ইংরেজি কাবিন", sortOrder: 3 },
  { nameEn: "Other Kabin", nameBn: "অন্যান্য কাবিন", sortOrder: 4 },
  { nameEn: "Divorce Registration", nameBn: "তালাক নিবন্ধন", sortOrder: 5 },
  { nameEn: "Affidavit", nameBn: "হলফনামা", sortOrder: 6 },
  { nameEn: "Duplicate Certificate", nameBn: "ডুপ্লিকেট সার্টিফিকেট", sortOrder: 7 },
  { nameEn: "Court Marriage", nameBn: "আদালত বিবাহ", sortOrder: 8 },
  { nameEn: "Marriage Correction", nameBn: "বিবাহ সংশোধন", sortOrder: 9 },
  { nameEn: "Marriage Certificate Copy", nameBn: "বিবাহ সনদের কপি", sortOrder: 10 },
  { nameEn: "Other Income", nameBn: "অন্যান্য আয়", sortOrder: 11 },
];

const defaultExpenseCategories = [
  { nameEn: "Office Rent", nameBn: "অফিস ভাড়া", sortOrder: 1 },
  { nameEn: "Staff Salary", nameBn: "কর্মীর বেতন", sortOrder: 2 },
  { nameEn: "Electricity Bill", nameBn: "বিদ্যুৎ বিল", sortOrder: 3 },
  { nameEn: "Internet Bill", nameBn: "ইন্টারনেট বিল", sortOrder: 4 },
  { nameEn: "Transportation", nameBn: "যানবাহন", sortOrder: 5 },
  { nameEn: "Stationery", nameBn: "স্টেশনারি", sortOrder: 6 },
  { nameEn: "Printing", nameBn: "মুদ্রণ", sortOrder: 7 },
  { nameEn: "Government Fees", nameBn: "সরকারি ফি", sortOrder: 8 },
  { nameEn: "Miscellaneous", nameBn: "বিবিধ", sortOrder: 9 },
];

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@kazioffice.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@kazioffice.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin user created:", admin.email);

  // Create income categories
  for (const cat of defaultIncomeCategories) {
    await prisma.incomeCategory.upsert({
      where: { id: `default-income-${cat.sortOrder}` },
      update: {},
      create: {
        id: `default-income-${cat.sortOrder}`,
        ...cat,
        isDefault: true,
      },
    });
  }
  console.log("Income categories seeded");

  // Create expense categories
  for (const cat of defaultExpenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { id: `default-expense-${cat.sortOrder}` },
      update: {},
      create: {
        id: `default-expense-${cat.sortOrder}`,
        ...cat,
        isDefault: true,
      },
    });
  }
  console.log("Expense categories seeded");

  // Create sample data for current month
  const now = new Date();
  const incomeCategories = await prisma.incomeCategory.findMany();
  const expenseCategories = await prisma.expenseCategory.findMany();

  for (let i = 0; i < 15; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), Math.floor(Math.random() * 28) + 1);
    const cat = incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
    await prisma.income.create({
      data: {
        date,
        amount: Math.floor(Math.random() * 5000) + 500,
        categoryId: cat.id,
        balamNo: `BL-${100 + i}`,
        pageNo: `${20 + i}`,
        description: "Sample income entry",
        createdById: admin.id,
      },
    });
  }
  console.log("Sample income data seeded");

  for (let i = 0; i < 8; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), Math.floor(Math.random() * 28) + 1);
    const cat = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
    await prisma.expense.create({
      data: {
        date,
        amount: Math.floor(Math.random() * 3000) + 200,
        categoryId: cat.id,
        description: "Sample expense entry",
        createdById: admin.id,
      },
    });
  }
  console.log("Sample expense data seeded");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
