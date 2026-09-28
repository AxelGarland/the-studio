import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { IdeaType } from "@prisma/client";

const createSchema = z.object({
  type: z.nativeEnum(IdeaType),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
});

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const ideas = await prisma.idea.findMany({
    where: {
      ...(type ? { type: type as IdeaType } : {}),
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { copyDrafts: { select: { id: true } } },
  });

  return NextResponse.json({ ideas });
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const idea = await prisma.idea.create({
    data: { ...parsed.data, createdById: userId },
  });

  return NextResponse.json({ idea }, { status: 201 });
}
