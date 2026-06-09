"use client";

import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Award, BarChart3 } from "lucide-react";
import type { DashboardStats } from "@/types";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function formatCurrency(n: number) {
  return `৳${n.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

export default function AnalyticsPage() {
  const { t } = useLanguage();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="h-16 bg-card border-b border-border" />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const topService = stats?.incomeByCategory?.[0];

  return (
    <div className="flex flex-col min-h-full">
      <Header title={t("analytics")} />

      <div className="flex-1 px-4 py-4 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
            <TrendingUp className="h-5 w-5 text-emerald-500 mb-2" />
            <p className="text-xs text-muted-foreground">{t("incomeTrend")}</p>
            <p className="text-xl font-bold text-emerald-500 mt-0.5">{formatCurrency(stats?.totalIncome ?? 0)}</p>
          </div>
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
            <TrendingDown className="h-5 w-5 text-red-500 mb-2" />
            <p className="text-xs text-muted-foreground">{t("expenseTrend")}</p>
            <p className="text-xl font-bold text-red-500 mt-0.5">{formatCurrency(stats?.totalExpenses ?? 0)}</p>
          </div>
        </div>

        {/* Most Profitable Service */}
        {topService && (
          <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-5 w-5" />
              <p className="text-sm font-semibold">{t("mostProfitableService")}</p>
            </div>
            <p className="text-2xl font-bold">{topService.name}</p>
            <p className="text-white/80 text-sm mt-1">Total: {formatCurrency(topService.value)}</p>
          </div>
        )}

        {/* Monthly Comparison */}
        {stats?.monthlyData && stats.monthlyData.length > 0 && (
          <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">{t("monthlyComparison")}</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.monthlyData.map((d) => ({ ...d, month: d.month.substring(5) }))} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 11 }}
                  formatter={(v) => [`৳${Number(v).toLocaleString()}`, ""]}
                />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Profit Trend */}
        {stats?.monthlyData && stats.monthlyData.length > 0 && (
          <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Profit Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={stats.monthlyData.map((d) => ({ ...d, month: d.month.substring(5) }))} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 11 }}
                  formatter={(v) => [`৳${Number(v).toLocaleString()}`, ""]}
                />
                <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366f1" }} name="Net Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Income Distribution Pie */}
        {stats?.incomeByCategory && stats.incomeByCategory.length > 0 && (
          <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Income Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.incomeByCategory} dataKey="value" cx="50%" cy="50%" outerRadius={80} paddingAngle={3} label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {stats.incomeByCategory.map((entry, i) => <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 11 }}
                  formatter={(v) => [`৳${Number(v).toLocaleString()}`, ""]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} formatter={(v) => v.length > 14 ? v.substring(0, 14) + "…" : v} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
