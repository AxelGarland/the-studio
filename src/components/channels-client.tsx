"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/status-pill";

type Channel = {
  id: string;
  platform: string;
  handle: string | null;
  status: string;
  notes: string | null;
};

const TONE: Record<string, "neutral" | "accent" | "warn"> = {
  NOT_SET_UP: "neutral",
  IN_PROGRESS: "warn",
  LIVE: "accent",
};

export function ChannelsClient({ channels }: { channels: Channel[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, { handle: string; notes: string }>>(
    Object.fromEntries(channels.map((c) => [c.id, { handle: c.handle ?? "", notes: c.notes ?? "" }])),
  );

  async function save(id: string, status?: string) {
    const draft = drafts[id];
    await fetch(`/api/channels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: draft.handle, notes: draft.notes, ...(status ? { status } : {}) }),
    });
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {channels.map((channel) => (
        <div key={channel.id} className="card flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-semibold text-ink">{channel.platform}</p>
            <StatusPill label={channel.status.replace("_", " ")} tone={TONE[channel.status]} />
          </div>
          <input
            value={drafts[channel.id].handle}
            onChange={(e) => setDrafts((d) => ({ ...d, [channel.id]: { ...d[channel.id], handle: e.target.value } }))}
            placeholder="Handle / URL"
            className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-ink"
          />
          <textarea
            value={drafts[channel.id].notes}
            onChange={(e) => setDrafts((d) => ({ ...d, [channel.id]: { ...d[channel.id], notes: e.target.value } }))}
            placeholder="Setup notes"
            className="min-h-[48px] rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-ink"
          />
          <div className="flex items-center gap-2">
            <select
              defaultValue={channel.status}
              onChange={(e) => save(channel.id, e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-[11px] text-ink"
            >
              <option value="NOT_SET_UP">Not set up</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="LIVE">Live</option>
            </select>
            <button
              onClick={() => save(channel.id)}
              className="ml-auto rounded-lg bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-ink"
            >
              Save
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
