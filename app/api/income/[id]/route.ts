import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { incomeSchema } from "@/lib/validations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const income = await db.income.findUnique({
    where: { id },
    include: { category: true, createdBy: { select: { name: true } } },
  });

  if (!income) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(income);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = incomeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const income = await db.income.update({
    where: { id },
    data: {
      date: new Date(parsed.data.date),
      amount: parsed.data.amount,
      categoryId: parsed.data.categoryId,
      description: parsed.data.description,
      clientName: parsed.data.clientName,
      mobileNumber: parsed.data.mobileNumber,
    },
    include: { category: true, createdBy: { select: { name: true } } },
  });

  await db.auditLog.create({
    data: {
      action: "UPDATE",
      entity: "Income",
      entityId: income.id,
      userId: (session.user as { id: string }).id,
    },
  });

  return NextResponse.json(income);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.income.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      action: "DELETE",
      entity: "Income",
      entityId: id,
      userId: (session.user as { id: string }).id,
    },
  });

  return NextResponse.json({ success: true });
}
