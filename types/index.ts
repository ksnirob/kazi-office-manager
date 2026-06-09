export type Role = "ADMIN" | "MANAGER" | "STAFF";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface IncomeCategory {
  id: string;
  nameEn: string;
  nameBn: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  _count?: { incomes: number };
}

export interface ExpenseCategory {
  id: string;
  nameEn: string;
  nameBn: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  _count?: { expenses: number };
}

export interface Income {
  id: string;
  date: string;
  amount: number;
  categoryId: string;
  category: IncomeCategory;
  description?: string;
  clientName?: string;
  mobileNumber?: string;
  createdById: string;
  createdBy: { name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  categoryId: string;
  category: ExpenseCategory;
  description?: string;
  createdById: string;
  createdBy: { name: string };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  todayIncome: number;
  thisWeekIncome: number;
  thisMonthIncome: number;
  thisYearIncome: number;
  recentTransactions: Array<Income | Expense>;
  monthlyData: Array<{
    month: string;
    income: number;
    expense: number;
    profit: number;
  }>;
  incomeByCategory: Array<{ name: string; value: number; color: string }>;
  expenseByCategory: Array<{ name: string; value: number; color: string }>;
}

export interface ReportData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomes: Income[];
  expenses: Expense[];
  incomeByCategory: Array<{ name: string; total: number }>;
  expenseByCategory: Array<{ name: string; total: number }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
}
