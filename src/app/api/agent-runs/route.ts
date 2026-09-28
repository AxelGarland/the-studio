import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const runs = await prisma.agentRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { role: true, idea: { select: { id: true, title: true } } },
  });

  return NextResponse.json({ runs });
}
