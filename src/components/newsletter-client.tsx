"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/status-pill";

type Item = {
  id: string;
  title: string;
  sourceUrl: string;
  summary: string;
  status: string;
};

const TONE: Record<string, "neutral" | "accent" | "warn"> = {
  CANDIDATE: "neutral",
  INCLUDED: "accent",
  SKIPPED: "warn",
};

export function NewsletterClient({ items }: { items: Item[] }) {
  const router = useRouter();
  const [researching, setResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResearch() {
    setResearching(true);
    setError(null);
    try {
      const res = await fetch("/api/newsletter-digest/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.toString?.() ?? "Request failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setResearching(false);
    }
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/newsletter-digest/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={handleResearch}
          disabled={researching}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink disabled:opacity-50"
        >
          {researching ? "Researching..." : "Research this week's digest"}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-ink-faint">No candidates yet for this week.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  {item.sourceUrl && (
                    <p className="text-[11px] text-ink-faint break-all">{item.sourceUrl}</p>
                  )}
                </div>
                <StatusPill label={item.status} tone={TONE[item.status]} />
              </div>
              <p className="mt-2 text-xs text-ink-soft">{item.summary}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setStatus(item.id, "INCLUDED")}
                  className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-ink hover:bg-surface-2"
                >
                  Include
                </button>
                <button
                  onClick={() => setStatus(item.id, "SKIPPED")}
                  className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-ink hover:bg-surface-2"
                >
                  Skip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
