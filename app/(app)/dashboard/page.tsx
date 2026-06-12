"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import { Header } from "@/components/layout/header";
import { StatCard, HeroStatCard } from "@/components/dashboard/stat-card";
import { MonthlyBarChart } from "@/components/dashboard/charts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CalendarDays,
  ArrowRight,
  Users,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { DashboardStats } from "@/types";

function formatCurrency(amount: number) {
  return `৳${amount.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [monthsRange, setMonthsRange] = useState("6");
  const [userSummaryMonth, setUserSummaryMonth] = useState(format(new Date(), "yyyy-MM"));

  const params = useMemo(() => {
    const searchParams = new URLSearchParams();
    searchParams.set("month", selectedMonth);
    searchParams.set("months", monthsRange);
    searchParams.set("userSummaryMonth", userSummaryMonth);
    return searchParams.toString();
  }, [selectedMonth, monthsRange, userSummaryMonth]);

  const selectedRangeLabel = monthsRange === "12" ? t("last12Months") : t("last6Months");
  const selectedMonthLabel = format(new Date(`${selectedMonth}-01T00:00:00`), "MMMM yyyy");

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard", selectedMonth, monthsRange, userSummaryMonth],
    queryFn: () => fetch(`/api/dashboard?${params}`).then((r) => r.json()),
    placeholderData: (previousData) => previousData,
    refetchInterval: 30000,
  });

  const userSummaryLabel = stats?.userSummaryMonth
    ? format(new Date(`${stats.userSummaryMonth}-01T00:00:00`), "MMMM yyyy")
    : selectedMonthLabel;

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="flex flex-col min-h-full">
      <Header title={t("appName")} subtitle={selectedMonthLabel} />

      <div className="flex-1 px-4 py-4 space-y-5">
        <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("selectedMonth")}
              </p>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="rounded-xl h-10"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("overviewRange")}
              </p>
              <Select value={monthsRange} onValueChange={setMonthsRange}>
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue>{selectedRangeLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="6">{t("last6Months")}</SelectItem>
                  <SelectItem value="12">{t("last12Months")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

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

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title={t("todayIncome")}
            value={formatCurrency(stats?.todayIncome ?? 0)}
            icon={CalendarDays}
            color="blue"
          />
          <StatCard
            title={t("todayExpense")}
            value={formatCurrency(stats?.todayExpense ?? 0)}
            icon={TrendingDown}
            color="orange"
          />
        </div>

        <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("monthlyOverview")}</h3>
              <p className="text-xs text-muted-foreground mt-1">{selectedRangeLabel}</p>
            </div>
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

        <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{t("teamSummary")}</h3>
            </div>
            <Input
              type="month"
              value={userSummaryMonth}
              onChange={(event) => setUserSummaryMonth(event.target.value)}
              className="h-9 w-36 rounded-xl text-xs"
            />
          </div>

          {stats?.userSections.length ? (
            <div className="space-y-3">
              {stats.userSections.map((user) => (
                <div key={user.userId} className="rounded-2xl border border-border/50 p-3 bg-background/60">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{userSummaryLabel}</p>
                    </div>
                    {/* <Badge variant="secondary" className="rounded-lg text-[10px] uppercase tracking-wide">
                      {user.role}
                    </Badge> */}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-emerald-500/10 p-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("totalIncome")}</p>
                      <p className="text-sm font-semibold text-emerald-600 mt-1">{formatCurrency(user.totalIncome)}</p>
                    </div>
                    <div className="rounded-xl bg-red-500/10 p-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("totalExpenses")}</p>
                      <p className="text-sm font-semibold text-red-600 mt-1">{formatCurrency(user.totalExpenses)}</p>
                    </div>
                    <div className="rounded-xl bg-primary/10 p-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("netProfit")}</p>
                      <p className={`text-sm font-semibold mt-1 ${user.netProfit >= 0 ? "text-primary" : "text-red-600"}`}>
                        {formatCurrency(user.netProfit)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">{t("noUsers")}</p>
          )}
        </div>

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
              {(stats.recentTransactions as unknown as Array<Record<string, unknown>>).slice(0, 6).map((tx, index) => {
                const isIncome = tx.type === "income";
                return (
                  <div
                    key={index}
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
                          {language === "bn"
                            ? ((tx.category as Record<string, string>)?.nameBn ?? (tx.category as Record<string, string>)?.nameEn)
                            : (tx.category as Record<string, string>)?.nameEn}
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
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((item) => (
            <Skeleton key={item} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
