import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { runAgent, parseJsonResponse, DEFAULT_MODEL } from "@/lib/ai/anthropic";
import { buildCopyPrompt, getRoleDefinition } from "@/lib/ai/roles";
import { Platform } from "@prisma/client";

const ALL_PLATFORMS: Platform[] = ["YOUTUBE", "X", "TIKTOK", "LINKEDIN", "NEWSLETTER"];

const bodySchema = z.object({
  platforms: z.array(z.nativeEnum(Platform)).optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const idea = await prisma.idea.findUnique({ where: { id: params.id } });
  if (!idea) return NextResponse.json({ error: "Idea not found" }, { status: 404 });

  const body = request.body ? await request.json().catch(() => ({})) : {};
  const parsed = bodySchema.safeParse(body);
  const platforms = parsed.success && parsed.data.platforms?.length ? parsed.data.platforms : ALL_PLATFORMS;

  const role = getRoleDefinition("social_manager");
  const roleRow = await prisma.agentRole.findUnique({ where: { key: "social_manager" } });
  if (!role || !roleRow) return NextResponse.json({ error: "Social Manager role not seeded" }, { status: 500 });

  const userPrompt = buildCopyPrompt(idea, platforms);

  let output: string;
  try {
    output = await runAgent({ systemPrompt: role.systemPrompt, userPrompt, maxTokens: 2000 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Agent call failed" }, { status: 502 });
  }

  let parsedOutput: { drafts: { platform: Platform; approach: string; draftCopy: string }[] };
  try {
    parsedOutput = parseJsonResponse(output);
  } catch {
    return NextResponse.json({ error: "Could not parse agent output", raw: output }, { status: 502 });
  }

  await prisma.$transaction([
    ...parsedOutput.drafts.map((draft) =>
      prisma.socialCopyDraft.upsert({
        where: { ideaId_platform: { ideaId: idea.id, platform: draft.platform } },
        update: { approach: draft.approach, draftCopy: draft.draftCopy, status: "DRAFT" },
        create: {
          ideaId: idea.id,
          platform: draft.platform,
          approach: draft.approach,
          draftCopy: draft.draftCopy,
        },
      }),
    ),
    prisma.agentRun.create({
      data: {
        roleId: roleRow.id,
        ideaId: idea.id,
        input: userPrompt,
        output,
        model: DEFAULT_MODEL,
        createdById: userId,
      },
    }),
  ]);

  const refreshed = await prisma.idea.findUnique({
    where: { id: idea.id },
    include: { copyDrafts: { orderBy: { platform: "asc" } } },
  });

  return NextResponse.json({ idea: refreshed });
}
