import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "monthly";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let fromDate: Date;
  let toDate: Date = new Date();
  toDate.setHours(23, 59, 59, 999);

  const now = new Date();

  switch (type) {
    case "daily":
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "weekly":
      fromDate = new Date(now);
      fromDate.setDate(now.getDate() - now.getDay());
      fromDate.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "yearly":
      fromDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom":
      fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
      if (to) {
        toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
      }
      break;
    default:
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const dateFilter = { gte: fromDate, lte: toDate };

  const [incomes, expenses] = await Promise.all([
    db.income.findMany({
      where: { date: dateFilter },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    db.expense.findMany({
      where: { date: dateFilter },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const totalIncome = incomes.reduce((s: number, i: { amount: number }) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s: number, e: { amount: number }) => s + e.amount, 0);

  // Group by category
  const incomeByCategory = (Object.values(
    incomes.reduce((acc: Record<string, { name: string; total: number }>, item) => {
      const key = item.categoryId;
      if (!acc[key]) acc[key] = { name: item.category.nameEn, total: 0 };
      acc[key].total += item.amount;
      return acc;
    }, {})
  ) as Array<{ name: string; total: number }>).sort((a, b) => b.total - a.total);

  const expenseByCategory = (Object.values(
    expenses.reduce((acc: Record<string, { name: string; total: number }>, item) => {
      const key = item.categoryId;
      if (!acc[key]) acc[key] = { name: item.category.nameEn, total: 0 };
      acc[key].total += item.amount;
      return acc;
    }, {})
  ) as Array<{ name: string; total: number }>).sort((a, b) => b.total - a.total);

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    incomes,
    expenses,
    incomeByCategory,
    expenseByCategory,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
  });
}
