import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { currentWeekStart } from "@/lib/week";

const createSchema = z.object({
  title: z.string().min(1).max(300),
  sourceUrl: z.string().max(500).optional().default(""),
  summary: z.string().min(1).max(2000),
});

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekOf = currentWeekStart();
  const items = await prisma.newsletterDigestItem.findMany({
    where: { weekOf },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ weekOf, items });
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const item = await prisma.newsletterDigestItem.create({
    data: { ...parsed.data, weekOf: currentWeekStart() },
  });

  return NextResponse.json({ item }, { status: 201 });
}
