"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useLanguage } from "@/contexts/language-context";

interface MonthlyChartProps {
  data: Array<{
    month: string;
    income: number;
    expense: number;
    profit: number;
  }>;
}

export function MonthlyBarChart({ data }: MonthlyChartProps) {
  const { t } = useLanguage();

  const formatted = data.map((d) => ({
    ...d,
    month: d.month.substring(5), // Show only MM part
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px",
            fontSize: 12,
          }}
          formatter={(value) => [`৳${Number(value).toLocaleString()}`, ""]}
        />
        <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name={t("totalIncome")} />
        <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name={t("totalExpenses")} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProfitLineChart({ data }: MonthlyChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    month: d.month.substring(5),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px",
            fontSize: 12,
          }}
          formatter={(value) => [`৳${Number(value).toLocaleString()}`, ""]}
        />
        <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Income" />
        <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Expense" />
        <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Profit" />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface CategoryPieChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px",
            fontSize: 12,
          }}
          formatter={(value) => [`৳${Number(value).toLocaleString()}`, ""]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value) => (value.length > 12 ? value.substring(0, 12) + "…" : value)}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
