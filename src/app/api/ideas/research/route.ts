import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { runAgent, parseJsonResponse, DEFAULT_MODEL } from "@/lib/ai/anthropic";
import { buildResearchPrompt, getRoleDefinition } from "@/lib/ai/roles";
import { IdeaType } from "@prisma/client";

const bodySchema = z.object({
  type: z.nativeEnum(IdeaType),
  count: z.number().int().min(1).max(10).default(5),
});

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { type, count } = parsed.data;

  const role = getRoleDefinition("researcher");
  if (!role) return NextResponse.json({ error: "Researcher role not seeded" }, { status: 500 });

  const roleRow = await prisma.agentRole.findUnique({ where: { key: "researcher" } });
  if (!roleRow) return NextResponse.json({ error: "Researcher role not seeded in DB" }, { status: 500 });

  const userPrompt = buildResearchPrompt(type, count);

  let output: string;
  try {
    output = await runAgent({ systemPrompt: role.systemPrompt, userPrompt });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Agent call failed" }, { status: 502 });
  }

  let parsedOutput: { ideas: { title: string; description: string }[] };
  try {
    parsedOutput = parseJsonResponse(output);
  } catch {
    return NextResponse.json({ error: "Could not parse agent output", raw: output }, { status: 502 });
  }

  const created = await prisma.$transaction([
    ...parsedOutput.ideas.map((idea) =>
      prisma.idea.create({
        data: {
          type,
          title: idea.title,
          description: idea.description,
          source: "AI_RESEARCH",
          createdById: userId,
        },
      }),
    ),
    prisma.agentRun.create({
      data: {
        roleId: roleRow.id,
        input: userPrompt,
        output,
        model: DEFAULT_MODEL,
        createdById: userId,
      },
    }),
  ]);

  return NextResponse.json({ ideas: created.slice(0, -1) }, { status: 201 });
}
