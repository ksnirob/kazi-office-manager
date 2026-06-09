import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = new URL(req.url).searchParams.get("type");

  const [incomeCategories, expenseCategories] = await Promise.all([
    type !== "expense"
      ? db.incomeCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } })
      : Promise.resolve([]),
    type !== "income"
      ? db.expenseCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } })
      : Promise.resolve([]),
  ]);

  if (type === "income") return NextResponse.json(incomeCategories);
  if (type === "expense") return NextResponse.json(expenseCategories);
  return NextResponse.json({ income: incomeCategories, expense: expenseCategories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, ...data } = body;
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (type === "income") {
    const cat = await db.incomeCategory.create({ data: parsed.data });
    return NextResponse.json(cat, { status: 201 });
  } else if (type === "expense") {
    const cat = await db.expenseCategory.create({ data: parsed.data });
    return NextResponse.json(cat, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
