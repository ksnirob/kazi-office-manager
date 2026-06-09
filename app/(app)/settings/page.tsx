"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import { useTheme } from "@/contexts/theme-context";
import { useSession, signOut } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Moon,
  Sun,
  Languages,
  LogOut,
  Tag,
  Plus,
  ChevronRight,
  User,
  Shield,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import type { IncomeCategory, ExpenseCategory } from "@/types";

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [newIncomeCat, setNewIncomeCat] = useState({ nameEn: "", nameBn: "" });
  const [newExpenseCat, setNewExpenseCat] = useState({ nameEn: "", nameBn: "" });
  const [incomeCatOpen, setIncomeCatOpen] = useState(false);
  const [expenseCatOpen, setExpenseCatOpen] = useState(false);

  const { data: categories } = useQuery<{ income: IncomeCategory[]; expense: ExpenseCategory[] }>({
    queryKey: ["categories-all"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  });

  const addIncomeCat = useMutation({
    mutationFn: (data: { nameEn: string; nameBn: string }) =>
      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: "income" }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success("Income category added!");
      qc.invalidateQueries({ queryKey: ["income-categories"] });
      qc.invalidateQueries({ queryKey: ["categories-all"] });
      setNewIncomeCat({ nameEn: "", nameBn: "" });
      setIncomeCatOpen(false);
    },
    onError: () => toast.error("Failed to add category"),
  });

  const addExpenseCat = useMutation({
    mutationFn: (data: { nameEn: string; nameBn: string }) =>
      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: "expense" }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success("Expense category added!");
      qc.invalidateQueries({ queryKey: ["expense-categories"] });
      qc.invalidateQueries({ queryKey: ["categories-all"] });
      setNewExpenseCat({ nameEn: "", nameBn: "" });
      setExpenseCatOpen(false);
    },
    onError: () => toast.error("Failed to add category"),
  });

  const role = (session?.user as { role?: string })?.role;

  return (
    <div className="flex flex-col min-h-full">
      <Header title={t("settings")} />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Profile Card */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <User className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold">{session?.user?.name}</p>
              <p className="text-white/80 text-sm">{session?.user?.email}</p>
              <Badge className="mt-1 bg-white/20 text-white border-0 text-xs rounded-lg">
                <Shield className="h-3 w-3 mr-1" />
                {role ?? "Staff"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Appearance</p>
          </div>

          <div className="divide-y divide-border/50">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
                <span className="text-sm font-medium">
                  {theme === "dark" ? t("darkMode") : t("lightMode")}
                </span>
              </div>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`relative w-11 h-6 rounded-full transition-colors ${theme === "dark" ? "bg-indigo-500" : "bg-slate-300"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Languages className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{t("language")}</span>
              </div>
              <div className="flex rounded-xl overflow-hidden border border-border">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${language === "en" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage("bn")}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${language === "bn" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}
                >
                  বাং
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("categoryManagement")}
            </p>
          </div>

          <div className="divide-y divide-border/50">
            {/* Income Categories */}
            <Dialog open={incomeCatOpen} onOpenChange={setIncomeCatOpen}>
              <DialogTrigger
                className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
              >
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-emerald-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium">Income Categories</p>
                      <p className="text-xs text-muted-foreground">{categories?.income?.length ?? 0} categories</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-sm">
                <DialogHeader>
                  <DialogTitle>Income Categories</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {categories?.income?.map((c) => (
                      <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{c.nameEn}</p>
                          <p className="text-xs text-muted-foreground">{c.nameBn}</p>
                        </div>
                        {c.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <p className="text-sm font-medium">{t("addCustomCategory")}</p>
                  <Input
                    placeholder="English name"
                    value={newIncomeCat.nameEn}
                    onChange={(e) => setNewIncomeCat((p) => ({ ...p, nameEn: e.target.value }))}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="বাংলা নাম"
                    value={newIncomeCat.nameBn}
                    onChange={(e) => setNewIncomeCat((p) => ({ ...p, nameBn: e.target.value }))}
                    className="rounded-xl"
                  />
                  <Button
                    onClick={() => addIncomeCat.mutate(newIncomeCat)}
                    disabled={!newIncomeCat.nameEn || !newIncomeCat.nameBn}
                    className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 border-0"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Add Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Expense Categories */}
            <Dialog open={expenseCatOpen} onOpenChange={setExpenseCatOpen}>
              <DialogTrigger
                className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
              >
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-red-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium">Expense Categories</p>
                      <p className="text-xs text-muted-foreground">{categories?.expense?.length ?? 0} categories</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-sm">
                <DialogHeader>
                  <DialogTitle>Expense Categories</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {categories?.expense?.map((c) => (
                      <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{c.nameEn}</p>
                          <p className="text-xs text-muted-foreground">{c.nameBn}</p>
                        </div>
                        {c.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <p className="text-sm font-medium">{t("addCustomCategory")}</p>
                  <Input
                    placeholder="English name"
                    value={newExpenseCat.nameEn}
                    onChange={(e) => setNewExpenseCat((p) => ({ ...p, nameEn: e.target.value }))}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="বাংলা নাম"
                    value={newExpenseCat.nameBn}
                    onChange={(e) => setNewExpenseCat((p) => ({ ...p, nameBn: e.target.value }))}
                    className="rounded-xl"
                  />
                  <Button
                    onClick={() => addExpenseCat.mutate(newExpenseCat)}
                    disabled={!newExpenseCat.nameEn || !newExpenseCat.nameBn}
                    className="w-full rounded-xl bg-red-500 hover:bg-red-600 border-0"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Add Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* PWA Info */}
        <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">App Info</p>
          </div>
          <div className="px-4 py-3.5 flex items-center gap-3">
            <Smartphone className="h-4 w-4 text-indigo-500" />
            <div>
              <p className="text-sm font-medium">Kazi Office PWA</p>
              <p className="text-xs text-muted-foreground">Version 1.0.0 • Install for offline use</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full rounded-2xl h-12 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("logout")}
        </Button>
      </div>
    </div>
  );
}
