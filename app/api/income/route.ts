import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { incomeSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { clientName: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { mobileNumber: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, Date>).gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      (where.date as Record<string, Date>).lte = toDate;
    }
  }

  const [data, total] = await Promise.all([
    db.income.findMany({
      where,
      include: {
        category: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.income.count({ where }),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = incomeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const income = await db.income.create({
    data: {
      date: new Date(parsed.data.date),
      amount: parsed.data.amount,
      categoryId: parsed.data.categoryId,
      description: parsed.data.description,
      clientName: parsed.data.clientName,
      mobileNumber: parsed.data.mobileNumber,
      createdById: (session.user as { id: string }).id,
    },
    include: { category: true, createdBy: { select: { name: true } } },
  });

  await db.auditLog.create({
    data: {
      action: "CREATE",
      entity: "Income",
      entityId: income.id,
      userId: (session.user as { id: string }).id,
      details: JSON.stringify({ amount: income.amount, category: income.category.nameEn }),
    },
  });

  return NextResponse.json(income, { status: 201 });
}
