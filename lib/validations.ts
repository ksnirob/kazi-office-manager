import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const incomeSchema = z.object({
  date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  balamNo: z.string().optional(),
  pageNo: z.string().regex(/^\d*$/, "Page number must contain only numbers").optional(),
});

export const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

export const categorySchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameBn: z.string().min(1, "Bengali name is required"),
});

export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type IncomeInput = z.infer<typeof incomeSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type UserInput = z.infer<typeof userSchema>;
