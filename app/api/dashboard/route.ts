import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";

function parseMonthParam(value: string | null) {
  const fallback = format(new Date(), "yyyy-MM");
  const selectedMonth = value && /^\d{4}-\d{2}$/.test(value) ? value : fallback;

  return {
    selectedMonth,
    selectedMonthDate: new Date(`${selectedMonth}-01T00:00:00`),
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const { selectedMonth, selectedMonthDate } = parseMonthParam(searchParams.get("month"));
  const { selectedMonth: userSummaryMonth } = parseMonthParam(searchParams.get("userSummaryMonth"));
  const monthsParam = Number(searchParams.get("months") ?? "6");
  const monthsRange = monthsParam === 12 ? 12 : 6;

  const monthStart = startOfMonth(selectedMonthDate);
  const monthEnd = endOfMonth(selectedMonthDate);
  const userSummaryDate = new Date(`${userSummaryMonth}-01T00:00:00`);
  const userSummaryStart = startOfMonth(userSummaryDate);
  const userSummaryEnd = endOfMonth(userSummaryDate);
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const overviewStart = startOfMonth(subMonths(selectedMonthDate, monthsRange - 1));
  const overviewEnd = endOfMonth(selectedMonthDate);

  const [
    totalIncomeAgg,
    totalExpenseAgg,
    todayIncomeAgg,
    todayExpenseAgg,
    recentIncomes,
    recentExpenses,
    overviewIncomes,
    overviewExpenses,
    users,
    incomeByUser,
    expenseByUser,
  ] = await Promise.all([
    db.income.aggregate({ where: { date: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } }),
    db.expense.aggregate({ where: { date: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } }),
    db.income.aggregate({ where: { date: { gte: todayStart, lte: todayEnd } }, _sum: { amount: true } }),
    db.expense.aggregate({ where: { date: { gte: todayStart, lte: todayEnd } }, _sum: { amount: true } }),
    db.income.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      take: 8,
      orderBy: { date: "desc" },
      include: { category: true, createdBy: { select: { name: true } } },
    }),
    db.expense.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      take: 8,
      orderBy: { date: "desc" },
      include: { category: true, createdBy: { select: { name: true } } },
    }),
    db.income.findMany({
      where: { date: { gte: overviewStart, lte: overviewEnd } },
      select: { date: true, amount: true },
    }),
    db.expense.findMany({
      where: { date: { gte: overviewStart, lte: overviewEnd } },
      select: { date: true, amount: true },
    }),
    db.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
    db.income.groupBy({
      by: ["createdById"],
      where: { date: { gte: userSummaryStart, lte: userSummaryEnd } },
      _sum: { amount: true },
    }),
    db.expense.groupBy({
      by: ["createdById"],
      where: { date: { gte: userSummaryStart, lte: userSummaryEnd } },
      _sum: { amount: true },
    }),
  ]);

  const monthKeys = Array.from({ length: monthsRange }, (_, index) =>
    format(startOfMonth(subMonths(selectedMonthDate, monthsRange - index - 1)), "yyyy-MM")
  );

  const monthMap = new Map<string, { income: number; expense: number }>(
    monthKeys.map((month) => [month, { income: 0, expense: 0 }])
  );

  for (const income of overviewIncomes) {
    const monthKey = format(income.date, "yyyy-MM");
    const currentMonth = monthMap.get(monthKey);
    if (!currentMonth) continue;
    currentMonth.income += income.amount;
  }

  for (const expense of overviewExpenses) {
    const monthKey = format(expense.date, "yyyy-MM");
    const currentMonth = monthMap.get(monthKey);
    if (!currentMonth) continue;
    currentMonth.expense += expense.amount;
  }

  const monthlyData = monthKeys.map((month) => {
    const totals = monthMap.get(month) ?? { income: 0, expense: 0 };
    return {
      month,
      income: totals.income,
      expense: totals.expense,
      profit: totals.income - totals.expense,
    };
  });

  const incomeByUserMap = new Map(
    incomeByUser.map((item) => [item.createdById, Number(item._sum.amount ?? 0)])
  );
  const expenseByUserMap = new Map(
    expenseByUser.map((item) => [item.createdById, Number(item._sum.amount ?? 0)])
  );

  const userSections = users.map((user) => {
    const income = incomeByUserMap.get(user.id) ?? 0;
    const expense = expenseByUserMap.get(user.id) ?? 0;

    return {
      userId: user.id,
      name: user.name,
      role: user.role as "ADMIN" | "MANAGER" | "STAFF",
      totalIncome: income,
      totalExpenses: expense,
      netProfit: income - expense,
    };
  });

  const recentTransactions = [
    ...recentIncomes.map((income) => ({ ...income, type: "income" as const })),
    ...recentExpenses.map((expense) => ({ ...expense, type: "expense" as const })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const totalIncome = Number(totalIncomeAgg._sum.amount ?? 0);
  const totalExpenses = Number(totalExpenseAgg._sum.amount ?? 0);

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    todayIncome: Number(todayIncomeAgg._sum.amount ?? 0),
    todayExpense: Number(todayExpenseAgg._sum.amount ?? 0),
    selectedMonth,
    monthsRange,
    userSummaryMonth,
    userSections,
    recentTransactions,
    monthlyData,
  });
}
