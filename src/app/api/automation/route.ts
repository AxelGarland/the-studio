import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { IdeaType, Platform } from "@prisma/client";

// Machine-to-machine endpoint for the scheduled Claude routine.
// Auth: `Authorization: Bearer <AUTOMATION_TOKEN>` (set AUTOMATION_TOKEN in Vercel env vars).
// GET  -> context the routine needs (existing titles, approved ideas + what they're missing)
// POST -> writes new ideas, social drafts, newsletter digest candidates, design briefs.
// Never overwrites anything: drafts are skipped if one already exists for that idea+platform.

function authorized(request: NextRequest): boolean {
  const expected = process.env.AUTOMATION_TOKEN;
  if (!expected || expected.length < 24) return false;
  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: NextRequest) {
  if (!authorized(request)) return unauthorized();

  const [recent, approved, digest] = await Promise.all([
    prisma.idea.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { title: true, type: true, status: true },
    }),
    prisma.idea.findMany({
      where: { status: { in: ["APPROVED", "IN_PROGRESS"] } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        copyDrafts: { select: { platform: true } },
        agentRuns: { where: { role: { key: "designer" } }, select: { id: true }, take: 1 },
      },
    }),
    prisma.newsletterDigestItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { sourceUrl: true, title: true },
    }),
  ]);

  return NextResponse.json({
    platforms: Object.values(Platform),
    ideaTypes: Object.values(IdeaType),
    existingIdeaTitles: recent.map((i) => i.title),
    approvedIdeas: approved.map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      description: i.description,
      platformsWithDrafts: i.copyDrafts.map((d) => d.platform),
      hasDesignBrief: i.agentRuns.length > 0,
    })),
    existingDigestUrls: digest.map((d) => d.sourceUrl),
  });
}

const postSchema = z.object({
  ideas: z
    .array(
      z.object({
        type: z.nativeEnum(IdeaType),
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(4000),
      })
    )
    .max(30)
    .default([]),
  copyDrafts: z
    .array(
      z.object({
        ideaId: z.string().min(1),
        platform: z.nativeEnum(Platform),
        approach: z.string().min(1).max(1000),
        draftCopy: z.string().min(1).max(10000),
      })
    )
    .max(60)
    .default([]),
  digestItems: z
    .array(
      z.object({
        title: z.string().min(1).max(300),
        sourceUrl: z.string().url().max(2000),
        summary: z.string().min(1).max(4000),
        weekOf: z.string().optional(),
      })
    )
    .max(30)
    .default([]),
  designBriefs: z
    .array(
      z.object({
        ideaId: z.string().min(1),
        brief: z.string().min(1).max(10000),
      })
    )
    .max(20)
    .default([]),
});

function mondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  return d;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return unauthorized();

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { ideas, copyDrafts, digestItems, designBriefs } = parsed.data;
  const result = { ideasCreated: 0, draftsCreated: 0, digestCreated: 0, briefsCreated: 0, skipped: [] as string[] };

  // Ideas (skip exact-title duplicates, case-insensitive)
  if (ideas.length) {
    const existing = await prisma.idea.findMany({ select: { title: true } });
    const seen = new Set(existing.map((i) => i.title.trim().toLowerCase()));
    const owner = await prisma.user.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
    for (const idea of ideas) {
      const key = idea.title.trim().toLowerCase();
      if (seen.has(key)) {
        result.skipped.push(`idea duplicate: ${idea.title}`);
        continue;
      }
      seen.add(key);
      await prisma.idea.create({
        data: { ...idea, source: "AI_RESEARCH", createdById: owner?.id },
      });
      result.ideasCreated++;
    }
  }

  // Social drafts (never overwrite an existing draft)
  for (const draft of copyDrafts) {
    const idea = await prisma.idea.findUnique({ where: { id: draft.ideaId }, select: { id: true } });
    if (!idea) {
      result.skipped.push(`draft: unknown idea ${draft.ideaId}`);
      continue;
    }
    const exists = await prisma.socialCopyDraft.findUnique({
      where: { ideaId_platform: { ideaId: draft.ideaId, platform: draft.platform } },
      select: { id: true },
    });
    if (exists) {
      result.skipped.push(`draft exists: ${draft.ideaId}/${draft.platform}`);
      continue;
    }
    await prisma.socialCopyDraft.create({ data: draft });
    result.draftsCreated++;
  }

  // Newsletter digest candidates (skip URLs already in the digest)
  for (const item of digestItems) {
    const exists = await prisma.newsletterDigestItem.findFirst({
      where: { sourceUrl: item.sourceUrl },
      select: { id: true },
    });
    if (exists) {
      result.skipped.push(`digest url exists: ${item.sourceUrl}`);
      continue;
    }
    const parsedWeek = item.weekOf ? new Date(item.weekOf) : new Date();
    await prisma.newsletterDigestItem.create({
      data: {
        title: item.title,
        sourceUrl: item.sourceUrl,
        summary: item.summary,
        weekOf: mondayOf(isNaN(parsedWeek.getTime()) ? new Date() : parsedWeek),
      },
    });
    result.digestCreated++;
  }

  // Design briefs, stored as Designer agent runs linked to the idea
  if (designBriefs.length) {
    const designer = await prisma.agentRole.findUnique({ where: { key: "designer" }, select: { id: true } });
    if (!designer) {
      result.skipped.push("design briefs: designer role missing");
    } else {
      for (const b of designBriefs) {
        const idea = await prisma.idea.findUnique({ where: { id: b.ideaId }, select: { id: true, title: true } });
        if (!idea) {
          result.skipped.push(`brief: unknown idea ${b.ideaId}`);
          continue;
        }
        await prisma.agentRun.create({
          data: {
            roleId: designer.id,
            ideaId: idea.id,
            input: `Scheduled design brief for: ${idea.title}`,
            output: b.brief,
            model: "scheduled-routine",
          },
        });
        result.briefsCreated++;
      }
    }
  }

  return NextResponse.json(result);
}
