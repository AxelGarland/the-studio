import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  const [backlog, approved, inProgress, published, recentRuns] = await Promise.all([
    prisma.idea.count({ where: { status: "BACKLOG" } }),
    prisma.idea.count({ where: { status: "APPROVED" } }),
    prisma.idea.count({ where: { status: "IN_PROGRESS" } }),
    prisma.idea.count({ where: { status: "PUBLISHED" } }),
    prisma.agentRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { role: true, idea: { select: { title: true } } },
    }),
  ]);
  return { backlog, approved, inProgress, published, recentRuns };
}

export default async function OverviewPage() {
  const stats = await getStats();

  const cards = [
    { label: "Backlog", value: stats.backlog },
    { label: "Approved", value: stats.approved },
    { label: "In progress", value: stats.inProgress },
    { label: "Published", value: stats.published },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="font-display text-[11px] uppercase tracking-[0.12em] text-accent">Overview</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Command center</h1>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">
          Every idea, draft, and agent run across the brand, in one place.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-ink-soft">{c.label}</p>
            <p className="font-display tabular text-2xl font-semibold text-ink">{c.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 font-display text-sm text-ink-soft">Recent agent activity</h2>
        <div className="card divide-y divide-border">
          {stats.recentRuns.length === 0 && (
            <p className="p-4 text-sm text-ink-faint">No agent runs yet — visit the Roster to ask your first question.</p>
          )}
          {stats.recentRuns.map((run) => (
            <div key={run.id} className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-medium text-ink">{run.role.name}</p>
                <p className="mt-0.5 text-xs text-ink-soft line-clamp-2">{run.input}</p>
                {run.idea && <p className="mt-1 text-[11px] text-ink-faint">on “{run.idea.title}”</p>}
              </div>
              <p className="whitespace-nowrap text-[11px] text-ink-faint">
                {new Date(run.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
