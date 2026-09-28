import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roles = await prisma.agentRole.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ roles });
}
