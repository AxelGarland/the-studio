import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { runAgent, DEFAULT_MODEL } from "@/lib/ai/anthropic";

const bodySchema = z.object({
  input: z.string().min(1).max(4000),
  ideaId: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const roleRow = await prisma.agentRole.findUnique({ where: { key: params.key } });
  if (!roleRow) return NextResponse.json({ error: "Unknown role" }, { status: 404 });

  let output: string;
  try {
    output = await runAgent({ systemPrompt: roleRow.systemPrompt, userPrompt: parsed.data.input });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Agent call failed" }, { status: 502 });
  }

  const run = await prisma.agentRun.create({
    data: {
      roleId: roleRow.id,
      ideaId: parsed.data.ideaId,
      input: parsed.data.input,
      output,
      model: DEFAULT_MODEL,
      createdById: userId,
    },
  });

  return NextResponse.json({ run });
}
