"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Snapshot = {
  id: string;
  weekOf: string;
  channel: string;
  followers: number | null;
  views: number | null;
  conversions: number | null;
};

const PLATFORMS = ["YOUTUBE", "X", "TIKTOK", "LINKEDIN", "INSTAGRAM", "NEWSLETTER"];

export function AnalyticsClient({ snapshots }: { snapshots: Snapshot[] }) {
  const router = useRouter();
  const [channel, setChannel] = useState("YOUTUBE");
  const [followers, setFollowers] = useState("");
  const [views, setViews] = useState("");
  const [conversions, setConversions] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const weekOf = new Date();
    const day = weekOf.getDay() || 7;
    weekOf.setHours(0, 0, 0, 0);
    weekOf.setDate(weekOf.getDate() - day + 1);

    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekOf: weekOf.toISOString(),
        channel,
        followers: followers ? Number(followers) : undefined,
        views: views ? Number(views) : undefined,
        conversions: conversions ? Number(conversions) : undefined,
      }),
    });
    setFollowers("");
    setViews("");
    setConversions("");
    router.refresh();
  }

  async function handleSummarize() {
    setLoading(true);
    setSummary(null);
    const input = `Recent metric snapshots: ${JSON.stringify(snapshots)}`;
    const res = await fetch("/api/roles/data_analyst/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setSummary(data.run.output);
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSave} className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="mb-1 block text-[11px] text-ink-soft">Channel</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs text-ink"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-ink-soft">Followers</label>
          <input
            value={followers}
            onChange={(e) => setFollowers(e.target.value)}
            type="number"
            className="w-24 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs text-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-ink-soft">Views</label>
          <input
            value={views}
            onChange={(e) => setViews(e.target.value)}
            type="number"
            className="w-24 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs text-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-ink-soft">Conversions</label>
          <input
            value={conversions}
            onChange={(e) => setConversions(e.target.value)}
            type="number"
            className="w-24 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs text-ink"
          />
        </div>
        <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink">
          Save this week
        </button>
      </form>

      <div>
        <button
          onClick={handleSummarize}
          disabled={loading || snapshots.length === 0}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-2 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Ask the Data Analyst for a summary"}
        </button>
        {summary && (
          <div className="card mt-3 p-4 text-sm text-ink whitespace-pre-wrap">{summary}</div>
        )}
      </div>

      <div className="table-wrap overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-ink-soft">
              <th className="px-3 py-2">Week</th>
              <th className="px-3 py-2">Channel</th>
              <th className="px-3 py-2">Followers</th>
              <th className="px-3 py-2">Views</th>
              <th className="px-3 py-2">Conversions</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s) => (
              <tr key={s.id} className="border-b border-border">
                <td className="px-3 py-2">{new Date(s.weekOf).toLocaleDateString()}</td>
                <td className="px-3 py-2">{s.channel}</td>
                <td className="px-3 py-2 tabular">{s.followers ?? "—"}</td>
                <td className="px-3 py-2 tabular">{s.views ?? "—"}</td>
                <td className="px-3 py-2 tabular">{s.conversions ?? "—"}</td>
              </tr>
            ))}
            {snapshots.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-ink-faint">
                  No snapshots logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
