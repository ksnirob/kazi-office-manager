"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, key: "dashboard" as const },
  { href: "/income", icon: TrendingUp, key: "income" as const },
  { href: "/expenses", icon: TrendingDown, key: "expenses" as const },
  { href: "/reports", icon: BarChart3, key: "reports" as const },
  { href: "/settings", icon: Settings, key: "settings" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-background/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around px-2 py-1 pb-safe">
        {navItems.map(({ href, icon: Icon, key }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[56px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive ? "bg-primary/15 scale-110" : ""
                )}
              >
                <Icon
                  className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "")}
                />
              </div>
              <span className="text-[10px] font-medium leading-none">
                {t(key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
