import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

function parseDateParam(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function emptyReport(fromDate: Date | null = null, toDate: Date | null = null) {
  return NextResponse.json({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    incomes: [],
    expenses: [],
    incomeByCategory: [],
    expenseByCategory: [],
    fromDate: fromDate?.toISOString() ?? null,
    toDate: toDate?.toISOString() ?? null,
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "monthly";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let fromDate: Date;
  let toDate: Date;

  const now = new Date();

  switch (type) {
    case "daily":
      fromDate = startOfDay(now);
      toDate = endOfDay(now);
      break;
    case "weekly":
      fromDate = startOfWeek(now);
      toDate = endOfWeek(now);
      break;
    case "monthly":
      fromDate = startOfMonth(now);
      toDate = endOfMonth(now);
      break;
    case "yearly":
      fromDate = startOfYear(now);
      toDate = endOfYear(now);
      break;
    case "custom":
      if (!from || !to) return emptyReport();
      fromDate = startOfDay(parseDateParam(from));
      toDate = endOfDay(parseDateParam(to));
      if (fromDate > toDate) return emptyReport(fromDate, toDate);
      break;
    default:
      fromDate = startOfMonth(now);
      toDate = endOfMonth(now);
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
