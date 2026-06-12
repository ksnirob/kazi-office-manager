"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Sector,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Download, Printer } from "lucide-react";
import { format } from "date-fns";
import type { ReportData } from "@/types";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];
const RADIAN = Math.PI / 180;

interface ActivePieShapeProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
  payload?: {
    name?: string;
    total?: number;
  };
}

function getSliceAmountLabel(props: ActivePieShapeProps) {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    payload,
  } = props;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.64;
  const label = formatSliceCurrency(payload?.total ?? 0);
  const x = cx + Math.cos(-midAngle * RADIAN) * radius;
  const y = cy + Math.sin(-midAngle * RADIAN) * radius;
  let rotation = ((-midAngle % 360) + 360) % 360;
  if (rotation > 90 && rotation < 270) rotation += 180;
  rotation = ((rotation + 180) % 360) - 180;

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#fff"
      fontSize={9.5}
      fontWeight={900}
      paintOrder="stroke"
      stroke="rgba(0,0,0,0.38)"
      strokeWidth={1.4}
      transform={`rotate(${rotation} ${x} ${y})`}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      {label}
    </text>
  );
}

function formatCurrency(n: number) {
  return `৳${n.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

function formatSliceCurrency(n: number) {
  return `\u09F3${n.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

function renderActivePieSlice(props: ActivePieShapeProps, isActive: boolean) {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle = 0,
    endAngle = 0,
    fill = "#6366f1",
  } = props;
  const offsetX = isActive ? Math.cos(-midAngle * RADIAN) * 9 : 0;
  const offsetY = isActive ? Math.sin(-midAngle * RADIAN) * 9 : 0;

  return (
    <g style={{ outline: "none" }}>
      <g
        transform={`translate(${offsetX} ${offsetY})`}
        style={{ transition: "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}
      >
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + (isActive ? 2 : 0)}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="hsl(var(--card))"
          strokeWidth={2}
          style={{ outline: "none", transition: "filter 220ms ease" }}
        />
        {getSliceAmountLabel(props)}
      </g>
    </g>
  );
}

export default function ReportsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("monthly");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeIncomeIndex, setActiveIncomeIndex] = useState<number | undefined>();
  const [activeExpenseIndex, setActiveExpenseIndex] = useState<number | undefined>();

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
                <h3 className="text-sm font-semibold mb-2">Income by Category</h3>
                <div className="report-pie-chart h-44 outline-none" onMouseDown={(event) => event.preventDefault()}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart
                      accessibilityLayer={false}
                      tabIndex={-1}
                      margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                      style={{ outline: "none" }}
                    >
                      <Pie
                        data={data.incomeByCategory}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={66}
                        paddingAngle={3}
                        shape={(props: ActivePieShapeProps, index: number) => renderActivePieSlice(props, index === activeIncomeIndex)}
                        onClick={(_, index: number, event) => {
                          (event.currentTarget as SVGElement & { blur?: () => void }).blur?.();
                          setActiveIncomeIndex(index);
                        }}
                        rootTabIndex={-1}
                        style={{ outline: "none", cursor: "pointer" }}
                      >
                        {data.incomeByCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} style={{ outline: "none" }} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
                  {data.incomeByCategory.map((item, i) => (
                    <div key={item.name} className="flex min-w-0 items-center gap-1.5 text-[10px] leading-tight text-muted-foreground">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="break-words">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expense by Category */}
            {data.expenseByCategory.length > 0 && (
              <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
                <h3 className="text-sm font-semibold mb-2">Expense by Category</h3>
                <div className="report-pie-chart h-44 outline-none" onMouseDown={(event) => event.preventDefault()}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart
                      accessibilityLayer={false}
                      tabIndex={-1}
                      margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                      style={{ outline: "none" }}
                    >
                      <Pie
                        data={data.expenseByCategory}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={66}
                        paddingAngle={3}
                        shape={(props: ActivePieShapeProps, index: number) => renderActivePieSlice(props, index === activeExpenseIndex)}
                        onClick={(_, index: number, event) => {
                          (event.currentTarget as SVGElement & { blur?: () => void }).blur?.();
                          setActiveExpenseIndex(index);
                        }}
                        rootTabIndex={-1}
                        style={{ outline: "none", cursor: "pointer" }}
                      >
                        {data.expenseByCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} style={{ outline: "none" }} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
                  {data.expenseByCategory.map((item, i) => (
                    <div key={item.name} className="flex min-w-0 items-center gap-1.5 text-[10px] leading-tight text-muted-foreground">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="break-words">{item.name}</span>
                    </div>
                  ))}
                </div>
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
