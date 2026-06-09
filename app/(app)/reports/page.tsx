"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Download, Printer } from "lucide-react";
import { format } from "date-fns";
import type { ReportData } from "@/types";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

function formatCurrency(n: number) {
  return `৳${n.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

export default function ReportsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("monthly");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const params = new URLSearchParams();
  if (activeTab === "custom") {
    params.set("type", "custom");
    if (from) params.set("from", from);
    if (to) params.set("to", to);
  } else {
    params.set("type", activeTab);
  }

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ["reports", activeTab, from, to],
    queryFn: () => fetch(`/api/reports?${params}`).then((r) => r.json()),
  });

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ["Type", "Date", "Category", "Amount", "Description"],
      ...data.incomes.map((i) => ["Income", format(new Date(i.date), "dd/MM/yyyy"), i.category.nameEn, i.amount, i.description ?? ""]),
      ...data.expenses.map((e) => ["Expense", format(new Date(e.date), "dd/MM/yyyy"), e.category.nameEn, e.amount, e.description ?? ""]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${activeTab}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title={t("reports")}
        rightAction={
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={handleExportCSV}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Period Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full rounded-2xl h-10 bg-muted/50">
            <TabsTrigger value="daily" className="flex-1 rounded-xl text-xs">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1 rounded-xl text-xs">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="flex-1 rounded-xl text-xs">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" className="flex-1 rounded-xl text-xs">Yearly</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1 rounded-xl text-xs">Custom</TabsTrigger>
          </TabsList>

          {activeTab === "custom" && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("from")}</p>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl h-10 text-sm" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("to")}</p>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl h-10 text-sm" />
              </div>
            </div>
          )}
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        ) : data ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Income</p>
                </div>
                <p className="text-base font-bold text-emerald-500">{formatCurrency(data.totalIncome)}</p>
              </div>
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Expense</p>
                </div>
                <p className="text-base font-bold text-red-500">{formatCurrency(data.totalExpenses)}</p>
              </div>
              <div className={`rounded-2xl p-3 ${data.netProfit >= 0 ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-orange-500/10 border border-orange-500/20"}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className={`h-3.5 w-3.5 ${data.netProfit >= 0 ? "text-indigo-500" : "text-orange-500"}`} />
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Profit</p>
                </div>
                <p className={`text-base font-bold ${data.netProfit >= 0 ? "text-indigo-500" : "text-orange-500"}`}>
                  {formatCurrency(data.netProfit)}
                </p>
              </div>
            </div>

            {/* Income by Category Chart */}
            {data.incomeByCategory.length > 0 && (
              <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
                <h3 className="text-sm font-semibold mb-3">Income by Category</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.incomeByCategory} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => v.length > 12 ? v.substring(0, 12) + "…" : v} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 11 }}
                      formatter={(v) => [`৳${Number(v).toLocaleString()}`, ""]}
                    />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {data.incomeByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Expense by Category */}
            {data.expenseByCategory.length > 0 && (
              <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
                <h3 className="text-sm font-semibold mb-3">Expense by Category</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={data.expenseByCategory} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                      {data.expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 11 }}
                      formatter={(v) => [`৳${Number(v).toLocaleString()}`, ""]}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Transactions List */}
            <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">
                Transactions ({data.incomes.length + data.expenses.length})
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {[
                  ...data.incomes.map((i) => ({ ...i, txType: "income" })),
                  ...data.expenses.map((e) => ({ ...e, txType: "expense" })),
                ]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((tx, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={tx.txType === "income" ? "default" : "destructive"}
                          className="text-[10px] rounded-lg"
                        >
                          {tx.txType === "income" ? "IN" : "OUT"}
                        </Badge>
                        <div>
                          <p className="text-xs font-medium">{tx.category.nameEn}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(tx.date), "dd MMM yy")}
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${tx.txType === "income" ? "text-emerald-500" : "text-red-500"}`}>
                        {tx.txType === "income" ? "+" : "-"}৳{tx.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
