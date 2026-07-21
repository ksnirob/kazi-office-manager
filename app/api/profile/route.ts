import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email or phone is required"),
  image: z
    .string()
    .nullable()
    .optional()
    .refine(
      (value) =>
        !value ||
        value.startsWith("data:image/png;base64,") ||
        value.startsWith("data:image/jpeg;base64,") ||
        value.startsWith("data:image/webp;base64,"),
      "Profile picture must be PNG, JPG, or WebP"
    )
    .refine((value) => !value || value.length <= 1_100_000, "Profile picture must be under 800KB"),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, image, currentPassword, newPassword } = parsed.data;

  if (newPassword && newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existingEmail = await db.user.findFirst({
    where: {
      email,
      NOT: { id: userId },
    },
  });

  if (existingEmail) {
    return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
  }

  const updateData: {
    name: string;
    email: string;
    image?: string | null;
    password?: string;
  } = {
    name,
    email,
  };

  if (image !== undefined) {
    updateData.image = image;
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatches) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });

  return NextResponse.json(updatedUser);
}
