import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const [
    totalIncomeAgg,
    totalExpenseAgg,
    todayIncomeAgg,
    weekIncomeAgg,
    monthIncomeAgg,
    yearIncomeAgg,
    recentIncomes,
    recentExpenses,
    monthlyRaw,
    incomeByCat,
    expenseByCat,
  ] = await Promise.all([
    db.income.aggregate({ _sum: { amount: true } }),
    db.expense.aggregate({ _sum: { amount: true } }),
    db.income.aggregate({ where: { date: { gte: todayStart } }, _sum: { amount: true } }),
    db.income.aggregate({ where: { date: { gte: weekStart } }, _sum: { amount: true } }),
    db.income.aggregate({ where: { date: { gte: monthStart } }, _sum: { amount: true } }),
    db.income.aggregate({ where: { date: { gte: yearStart } }, _sum: { amount: true } }),
    db.income.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: { category: true, createdBy: { select: { name: true } } },
    }),
    db.expense.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: { category: true, createdBy: { select: { name: true } } },
    }),
    // Monthly data for last 12 months (SQLite syntax)
    db.$queryRaw<Array<{ month: string; type: string; total: number }>>`
      SELECT 
        strftime('%Y-%m', date) as month,
        'income' as type,
        SUM(amount) as total
      FROM "Income"
      WHERE date >= ${new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString()}
      GROUP BY strftime('%Y-%m', date)
      UNION ALL
      SELECT 
        strftime('%Y-%m', date) as month,
        'expense' as type,
        SUM(amount) as total
      FROM "Expense"
      WHERE date >= ${new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString()}
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month
    `,
    db.income.groupBy({
      by: ["categoryId"],
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 6,
    }),
    db.expense.groupBy({
      by: ["categoryId"],
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 6,
    }),
  ]);

  // Fetch category names
  const incomeCatIds = incomeByCat.map((item) => item.categoryId);
  const expenseCatIds = expenseByCat.map((item) => item.categoryId);

  const [incomeCategories, expenseCategories] = await Promise.all([
    db.incomeCategory.findMany({ where: { id: { in: incomeCatIds } } }),
    db.expenseCategory.findMany({ where: { id: { in: expenseCatIds } } }),
  ]);

  const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  const incomeByCategoryData = incomeByCat.map((item, idx) => {
    const cat = incomeCategories.find((c) => c.id === item.categoryId);
    return {
      name: cat?.nameEn ?? "Unknown",
      value: Number(item._sum.amount ?? 0),
      color: COLORS[idx % COLORS.length],
    };
  });

  const expenseByCategoryData = expenseByCat.map((item, idx) => {
    const cat = expenseCategories.find((c) => c.id === item.categoryId);
    return {
      name: cat?.nameEn ?? "Unknown",
      value: Number(item._sum.amount ?? 0),
      color: COLORS[idx % COLORS.length],
    };
  });

  // Build monthly chart data
  const monthMap = new Map<string, { income: number; expense: number }>();
  for (const row of monthlyRaw as Array<{ month: string; type: string; total: number | bigint }>) {
    const key = row.month;
    if (!monthMap.has(key)) monthMap.set(key, { income: 0, expense: 0 });
    const entry = monthMap.get(key)!;
    if (row.type === "income") entry.income = Number(row.total);
    else entry.expense = Number(row.total);
  }

  const monthlyData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
      profit: data.income - data.expense,
    }));

  const totalIncome = Number(totalIncomeAgg._sum.amount ?? 0);
  const totalExpenses = Number(totalExpenseAgg._sum.amount ?? 0);

  const recentTransactions = [
    ...recentIncomes.map((income) => ({ ...income, type: "income" as const })),
    ...recentExpenses.map((expense) => ({ ...expense, type: "expense" as const })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    todayIncome: Number(todayIncomeAgg._sum.amount ?? 0),
    thisWeekIncome: Number(weekIncomeAgg._sum.amount ?? 0),
    thisMonthIncome: Number(monthIncomeAgg._sum.amount ?? 0),
    thisYearIncome: Number(yearIncomeAgg._sum.amount ?? 0),
    recentTransactions,
    monthlyData,
    incomeByCategory: incomeByCategoryData,
    expenseByCategory: expenseByCategoryData,
  });
}
