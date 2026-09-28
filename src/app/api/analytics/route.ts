import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { Platform } from "@prisma/client";

const createSchema = z.object({
  weekOf: z.string(),
  channel: z.nativeEnum(Platform),
  followers: z.number().int().optional(),
  views: z.number().int().optional(),
  conversions: z.number().int().optional(),
  notes: z.string().max(1000).optional(),
});

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshots = await prisma.metricSnapshot.findMany({
    orderBy: [{ weekOf: "desc" }, { channel: "asc" }],
    take: 60,
  });

  return NextResponse.json({ snapshots });
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { weekOf, channel, ...rest } = parsed.data;
  const snapshot = await prisma.metricSnapshot.upsert({
    where: { weekOf_channel: { weekOf: new Date(weekOf), channel } },
    update: rest,
    create: { weekOf: new Date(weekOf), channel, ...rest },
  });

  return NextResponse.json({ snapshot }, { status: 201 });
}
