import { prisma } from "@/lib/prisma";
import { AnalyticsClient } from "@/components/analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const snapshots = await prisma.metricSnapshot.findMany({
    orderBy: [{ weekOf: "desc" }, { channel: "asc" }],
    take: 30,
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-display text-[11px] uppercase tracking-[0.12em] text-accent">Performance</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Analytics</h1>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">
          Log weekly numbers per channel manually for now — wiring up live platform APIs is a Phase 2 upgrade.
        </p>
      </header>
      <AnalyticsClient
        snapshots={snapshots.map((s) => ({ ...s, weekOf: s.weekOf.toISOString() }))}
      />
    </div>
  );
}
