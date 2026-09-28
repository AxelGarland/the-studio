import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { CopyStatus } from "@prisma/client";

const bodySchema = z.object({ status: z.nativeEnum(CopyStatus) });

export async function PATCH(request: NextRequest, { params }: { params: { id: string; draftId: string } }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const draft = await prisma.socialCopyDraft.update({
    where: { id: params.draftId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ draft });
}
