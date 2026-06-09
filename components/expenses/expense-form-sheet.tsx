"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseInput } from "@/lib/validations";
import type { Resolver } from "react-hook-form";
import { useLanguage } from "@/contexts/language-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Expense, ExpenseCategory } from "@/types";
import { format } from "date-fns";

interface ExpenseFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: Expense | null;
  categories: ExpenseCategory[];
  onSuccess: () => void;
}

export function ExpenseFormSheet({ open, onOpenChange, editItem, categories, onSuccess }: ExpenseFormSheetProps) {
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema) as Resolver<ExpenseInput>,
    defaultValues: { date: format(new Date(), "yyyy-MM-dd") },
  });

  const categoryIdValue = watch("categoryId");
  const selectedCategoryLabel = categories.find((category) => category.id === categoryIdValue)
    ? language === "bn"
      ? categories.find((category) => category.id === categoryIdValue)?.nameBn
      : categories.find((category) => category.id === categoryIdValue)?.nameEn
    : undefined;

  useEffect(() => {
    if (editItem) {
      reset({
        date: format(new Date(editItem.date), "yyyy-MM-dd"),
        amount: editItem.amount,
        categoryId: editItem.categoryId,
        description: editItem.description ?? "",
      });
    } else {
      reset({ date: format(new Date(), "yyyy-MM-dd") });
    }
  }, [editItem, reset]);

  const onSubmit = async (data: ExpenseInput) => {
    setIsLoading(true);
    try {
      const url = editItem ? `/api/expenses/${editItem.id}` : "/api/expenses";
      const res = await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editItem ? "Expense updated!" : "Expense added!");
      onSuccess();
      reset();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[95vh] overflow-y-auto max-w-md mx-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-bold">
            {editItem ? t("editExpense") : t("addExpense")}
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("date")}</Label>
              <Input type="date" {...register("date")} className="rounded-xl h-10" />
              {errors.date && <p className="text-destructive text-xs">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("amount")} (৳)</Label>
              <Input type="number" step="0.01" placeholder="0.00" {...register("amount")} className="rounded-xl h-10" />
              {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("expenseCategory")}</Label>
            <Select
              key={`expense-cat-${categories.length}`}
              value={categoryIdValue ?? ""}
              onValueChange={(v) => { if (v) setValue("categoryId", v, { shouldValidate: true }); }}
            >
              <SelectTrigger className="rounded-xl h-10">
                <SelectValue placeholder={t("selectCategory")}>
                  {selectedCategoryLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {language === "bn" ? c.nameBn : c.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-destructive text-xs">{errors.categoryId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("description")}</Label>
            <Textarea {...register("description")} placeholder="Notes..." rows={2} className="rounded-xl resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl h-11" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 rounded-xl h-11 bg-gradient-to-r from-red-500 to-rose-600 border-0 text-white">
              {isLoading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("save")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
