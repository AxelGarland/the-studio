import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { IdeaStatus } from "@prisma/client";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(4000).optional(),
  status: z.nativeEnum(IdeaStatus).optional(),
});

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const idea = await prisma.idea.findUnique({
    where: { id: params.id },
    include: {
      copyDrafts: { orderBy: { platform: "asc" } },
      agentRuns: { orderBy: { createdAt: "desc" }, take: 10, include: { role: true } },
    },
  });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ idea });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const idea = await prisma.idea.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ idea });
}
