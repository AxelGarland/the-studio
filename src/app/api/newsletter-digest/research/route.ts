import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { runAgent, parseJsonResponse, DEFAULT_MODEL } from "@/lib/ai/anthropic";
import { buildDigestPrompt, getRoleDefinition } from "@/lib/ai/roles";
import { currentWeekStart } from "@/lib/week";

const bodySchema = z.object({ count: z.number().int().min(1).max(10).default(5) });

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  const count = parsed.success ? parsed.data.count : 5;

  const role = getRoleDefinition("researcher");
  const roleRow = await prisma.agentRole.findUnique({ where: { key: "researcher" } });
  if (!role || !roleRow) return NextResponse.json({ error: "Researcher role not seeded" }, { status: 500 });

  const userPrompt = buildDigestPrompt(count);

  let output: string;
  try {
    output = await runAgent({ systemPrompt: role.systemPrompt, userPrompt });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Agent call failed" }, { status: 502 });
  }

  let parsedOutput: { items: { title: string; sourceUrl: string; summary: string }[] };
  try {
    parsedOutput = parseJsonResponse(output);
  } catch {
    return NextResponse.json({ error: "Could not parse agent output", raw: output }, { status: 502 });
  }

  const weekOf = currentWeekStart();

  const created = await prisma.$transaction([
    ...parsedOutput.items.map((item) =>
      prisma.newsletterDigestItem.create({
        data: { title: item.title, sourceUrl: item.sourceUrl || "", summary: item.summary, weekOf },
      }),
    ),
    prisma.agentRun.create({
      data: { roleId: roleRow.id, input: userPrompt, output, model: DEFAULT_MODEL, createdById: userId },
    }),
  ]);

  return NextResponse.json({ items: created.slice(0, -1) }, { status: 201 });
}
