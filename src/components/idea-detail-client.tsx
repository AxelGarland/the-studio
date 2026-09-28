"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Draft = {
  id: string;
  platform: string;
  approach: string;
  draftCopy: string;
  status: string;
};

const STATUS_OPTIONS = ["BACKLOG", "APPROVED", "IN_PROGRESS", "PUBLISHED", "ARCHIVED"];
const COPY_STATUS_OPTIONS = ["DRAFT", "APPROVED", "SCHEDULED", "PUBLISHED"];

export function IdeaDetailClient({
  ideaId,
  initialStatus,
  drafts,
}: {
  ideaId: string;
  initialStatus: string;
  drafts: Draft[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(next: string) {
    setStatus(next);
    await fetch(`/api/ideas/${ideaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    router.refresh();
  }

  async function handleGenerateCopy() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/generate-copy`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.toString?.() ?? "Request failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function updateDraftStatus(draftId: string, next: string) {
    await fetch(`/api/ideas/${ideaId}/copy/${draftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-soft">Status</span>
        <select
          value={status}
          onChange={(e) => updateStatus(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-ink"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={handleGenerateCopy}
          disabled={generating}
          className="ml-auto rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink disabled:opacity-50"
        >
          {generating ? "Drafting..." : drafts.length ? "Regenerate copy" : "Generate copy for all platforms"}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}

      {drafts.length === 0 ? (
        <p className="text-sm text-ink-faint">No drafts yet — generate copy to get a per-platform post for this idea.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {drafts.map((draft) => (
            <div key={draft.id} className="card flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-xs font-semibold uppercase tracking-wide text-accent">
                  {draft.platform}
                </p>
                <select
                  value={draft.status}
                  onChange={(e) => updateDraftStatus(draft.id, e.target.value)}
                  className="rounded-lg border border-border bg-surface-2 px-2 py-0.5 text-[11px] text-ink"
                >
                  {COPY_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] italic text-ink-soft">{draft.approach}</p>
              <p className="whitespace-pre-wrap text-xs text-ink">{draft.draftCopy}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
