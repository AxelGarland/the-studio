import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/lib/prisma";
import { IdeasToolbar } from "@/components/ideas-toolbar";
import { StatusPill } from "@/components/status-pill";
import { IdeaType, IdeaStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const TABS: { type: IdeaType; label: string }[] = [
  { type: "VIDEO", label: "Video" },
  { type: "MICRO_SAAS", label: "Micro-SaaS" },
  { type: "GADGET", label: "Gadgets" },
  { type: "NEWSLETTER_RESEARCH", label: "Newsletter research" },
];

const STATUS_ORDER: IdeaStatus[] = ["BACKLOG", "APPROVED", "IN_PROGRESS", "PUBLISHED"];
const STATUS_LABEL: Record<IdeaStatus, string> = {
  BACKLOG: "Backlog",
  APPROVED: "Approved",
  IN_PROGRESS: "In progress",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};
const STATUS_TONE: Record<IdeaStatus, "neutral" | "accent" | "warn"> = {
  BACKLOG: "neutral",
  APPROVED: "warn",
  IN_PROGRESS: "warn",
  PUBLISHED: "accent",
  ARCHIVED: "neutral",
};

export default async function IdeasPage({ searchParams }: { searchParams: { type?: string } }) {
  const activeType = (searchParams.type as IdeaType) || "VIDEO";
  const ideas = await prisma.idea.findMany({
    where: { type: activeType },
    orderBy: { createdAt: "desc" },
    include: { copyDrafts: { select: { id: true } } },
  });

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    ideas: ideas.filter((i) => i.status === status),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-display text-[11px] uppercase tracking-[0.12em] text-accent">Idea backlog</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Ideas</h1>
      </header>

      <div className="flex gap-2 border-b border-border pb-2">
        {TABS.map((tab) => (
          <Link
            key={tab.type}
            href={`/ideas?type=${tab.type}`}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-semibold",
              activeType === tab.type ? "bg-accent-soft text-accent" : "text-ink-soft hover:bg-surface-2",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <IdeasToolbar type={activeType} />

      <div className="flex flex-col gap-5">
        {grouped.map((group) => (
          <section key={group.status}>
            <div className="mb-2 flex items-center gap-2">
              <StatusPill label={STATUS_LABEL[group.status]} tone={STATUS_TONE[group.status]} />
              <span className="text-xs text-ink-faint">{group.ideas.length}</span>
            </div>
            {group.ideas.length === 0 ? (
              <p className="text-xs text-ink-faint">Nothing here yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {group.ideas.map((idea) => (
                  <Link key={idea.id} href={`/ideas/${idea.id}`} className="card block p-3 hover:border-accent">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-ink">{idea.title}</p>
                      {idea.source === "AI_RESEARCH" && <StatusPill label="AI researched" tone="neutral" />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{idea.description}</p>
                    <p className="mt-2 text-[11px] text-ink-faint">
                      {idea.copyDrafts.length} platform draft{idea.copyDrafts.length === 1 ? "" : "s"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
