"use client";

import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import { Header } from "@/components/layout/header";
import { StatCard, HeroStatCard } from "@/components/dashboard/stat-card";
import { MonthlyBarChart, ProfitLineChart, CategoryPieChart } from "@/components/dashboard/charts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CalendarDays,
  Calendar,
  CalendarRange,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { DashboardStats } from "@/types";

function formatCurrency(amount: number) {
  return `৳${amount.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

export default function DashboardPage() {
  const { t } = useLanguage();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
    refetchInterval: 30000,
  });

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="flex flex-col min-h-full">
      <Header title={t("appName")} subtitle={t("appSubtitle")} />

      <div className="flex-1 px-4 py-4 space-y-5">
        {/* Hero Cards */}
        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <HeroStatCard
              title={t("totalIncome")}
              value={formatCurrency(stats?.totalIncome ?? 0)}
              icon={TrendingUp}
              color="green"
            />
            <HeroStatCard
              title={t("totalExpenses")}
              value={formatCurrency(stats?.totalExpenses ?? 0)}
              icon={TrendingDown}
              color="red"
            />
          </div>
          <HeroStatCard
            title={t("netProfit")}
            value={formatCurrency(stats?.netProfit ?? 0)}
            icon={DollarSign}
            color={(stats?.netProfit ?? 0) >= 0 ? "purple" : "red"}
          />
        </div>

        {/* Period Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title={t("todayIncome")}
            value={formatCurrency(stats?.todayIncome ?? 0)}
            icon={CalendarDays}
            color="blue"
          />
          <StatCard
            title={t("thisWeek")}
            value={formatCurrency(stats?.thisWeekIncome ?? 0)}
            icon={Calendar}
            color="orange"
          />
          <StatCard
            title={t("thisMonth")}
            value={formatCurrency(stats?.thisMonthIncome ?? 0)}
            icon={CalendarRange}
            color="purple"
          />
          <StatCard
            title={t("thisYear")}
            value={formatCurrency(stats?.thisYearIncome ?? 0)}
            icon={CalendarCheck}
            color="green"
          />
        </div>

        {/* Monthly Bar Chart */}
        <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Monthly Overview</h3>
            <Link href="/reports" className="text-xs text-primary flex items-center gap-1">
              {t("viewAll")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {stats?.monthlyData && stats.monthlyData.length > 0 ? (
            <MonthlyBarChart data={stats.monthlyData} />
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              {t("noData")}
            </div>
          )}
        </div>

        {/* Profit Line Chart */}
        {stats?.monthlyData && stats.monthlyData.length > 0 && (
          <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Trend Analysis</h3>
            <ProfitLineChart data={stats.monthlyData} />
          </div>
        )}

        {/* Income by Category Pie */}
        {stats?.incomeByCategory && stats.incomeByCategory.length > 0 && (
          <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Income by Category</h3>
            <CategoryPieChart data={stats.incomeByCategory} />
          </div>
        )}

        {/* Recent Transactions */}
        <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t("recentTransactions")}
            </h3>
            <Link href="/income" className="text-xs text-primary flex items-center gap-1">
              {t("viewAll")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {(stats.recentTransactions as unknown as Array<Record<string, unknown>>).slice(0, 6).map((tx, i) => {
                const isIncome = tx.type === "income";
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl ${isIncome ? "bg-emerald-500/15" : "bg-red-500/15"}`}
                      >
                        {isIncome ? (
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {(tx.category as Record<string, string>)?.nameEn}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(tx.date as string), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${isIncome ? "text-emerald-500" : "text-red-500"}`}
                      >
                        {isIncome ? "+" : "-"}৳{(tx.amount as number).toLocaleString()}
                      </p>
                      <Badge variant="secondary" className="text-[9px] mt-0.5">
                        {isIncome ? "Income" : "Expense"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">{t("noData")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="h-16 bg-card border-b border-border px-4 flex items-center">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  );
}
