"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  color?: "green" | "red" | "blue" | "purple" | "orange";
  className?: string;
}

const colorMap = {
  green: "from-emerald-500 to-green-600",
  red: "from-red-500 to-rose-600",
  blue: "from-blue-500 to-indigo-600",
  purple: "from-violet-500 to-purple-600",
  orange: "from-orange-500 to-amber-600",
};

const bgMap = {
  green: "bg-emerald-500/15",
  red: "bg-red-500/15",
  blue: "bg-blue-500/15",
  purple: "bg-violet-500/15",
  orange: "bg-orange-500/15",
};

const textMap = {
  green: "text-emerald-500",
  red: "text-red-500",
  blue: "text-blue-500",
  purple: "text-violet-500",
  orange: "text-orange-500",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4 bg-card border border-border/50 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {trend !== undefined && (
            <div
              className={cn(
                "flex items-center gap-0.5 mt-1 text-xs font-medium",
                trend >= 0 ? "text-emerald-500" : "text-red-500"
              )}
            >
              <span>{trend >= 0 ? "↑" : "↓"}</span>
              <span>{Math.abs(trend)}% vs last month</span>
            </div>
          )}
        </div>
        <div className={cn("p-2.5 rounded-xl", bgMap[color])}>
          <Icon className={cn("h-5 w-5", textMap[color])} />
        </div>
      </div>
    </div>
  );
}

export function HeroStatCard({
  title,
  value,
  icon: Icon,
  color = "blue",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5 text-white shadow-xl",
        `bg-gradient-to-br ${colorMap[color]}`
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-1.5 rounded-xl bg-white/20">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}
