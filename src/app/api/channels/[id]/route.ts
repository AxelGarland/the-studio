import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { ChannelStatus } from "@prisma/client";

const bodySchema = z.object({
  handle: z.string().max(200).optional(),
  status: z.nativeEnum(ChannelStatus).optional(),
  notes: z.string().max(2000).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const channel = await prisma.channel.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ channel });
}
