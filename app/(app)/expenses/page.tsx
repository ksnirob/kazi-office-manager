"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Filter, TrendingDown, Pencil, Trash2, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Expense, ExpenseCategory, PaginatedResponse } from "@/types";
import { ExpenseFormSheet } from "@/components/expenses/expense-form-sheet";

export default function ExpensesPage() {
  const { t, language } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (categoryId) params.set("categoryId", categoryId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  params.set("limit", "50");

  const { data, isLoading } = useQuery<PaginatedResponse<Expense>>({
    queryKey: ["expenses", search, categoryId, from, to],
    queryFn: () => fetch(`/api/expenses?${params}`).then((r) => r.json()),
  });

  const { data: categories } = useQuery<ExpenseCategory[]>({
    queryKey: ["expense-categories"],
    queryFn: () => fetch("/api/categories?type=expense").then((r) => r.json()),
  });

  const selectedCategory = categories?.find((category) => category.id === categoryId);
  const selectedCategoryLabel = selectedCategory
    ? language === "bn"
      ? selectedCategory.nameBn
      : selectedCategory.nameEn
    : undefined;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/expenses/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      toast.success("Expense deleted");
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const totalAmount = data?.data?.reduce((s, e) => s + e.amount, 0) ?? 0;
  const hasFilters = search || categoryId || from || to;

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title={t("expenseList")}
        subtitle={`${data?.total ?? 0} records`}
        rightAction={
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            className="h-8 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 border-0 text-white shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1" /> {t("addExpense")}
          </Button>
        }
      />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Summary Card */}
        <div className="rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">{t("totalExpenses")}</p>
              <p className="text-2xl font-bold mt-0.5">৳{totalAmount.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/20">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-white/70 mt-2">{data?.total ?? 0} transactions</p>
        </div>

        {/* Search & Filter */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search")}
                className="pl-9 rounded-xl h-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className={`h-10 w-10 rounded-xl shrink-0 ${showFilters ? "bg-primary text-primary-foreground border-primary" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
            {hasFilters && (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-xl shrink-0 text-destructive"
                onClick={() => { setSearch(""); setCategoryId(""); setFrom(""); setTo(""); }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="rounded-2xl bg-card border border-border/50 p-3 space-y-2">
              <Select value={categoryId} onValueChange={(value) => setCategoryId(value?.trim() ? value : "")}>
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder={t("allCategories")}>
                    {selectedCategoryLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value=" ">{t("allCategories")}</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {language === "bn" ? c.nameBn : c.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("from")}</p>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl h-10 text-sm" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("to")}</p>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl h-10 text-sm" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Expense List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-20 rounded-2xl" />))}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-16">
            <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">{t("noData")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.data?.map((item) => (
              <ExpenseCard
                key={item.id}
                item={item}
                language={language}
                onEdit={() => setEditItem(item)}
                onDelete={() => setDeleteId(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ExpenseFormSheet
        open={addOpen || !!editItem}
        onOpenChange={(open) => { if (!open) { setAddOpen(false); setEditItem(null); } }}
        editItem={editItem}
        categories={categories ?? []}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["expenses"] });
          qc.invalidateQueries({ queryKey: ["dashboard"] });
          setAddOpen(false);
          setEditItem(null);
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ExpenseCard({ item, language, onEdit, onDelete }: {
  item: Expense; language: string; onEdit: () => void; onDelete: () => void;
}) {
  const catName = language === "bn" ? item.category.nameBn : item.category.nameEn;
  return (
    <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-xl bg-red-500/15 shrink-0">
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs rounded-lg">{catName}</Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(item.date), "dd MMM yyyy")}
              </span>
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{item.description}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className="text-base font-bold text-red-500">৳{item.amount.toLocaleString()}</p>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-red-500/10 hover:text-red-500" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
