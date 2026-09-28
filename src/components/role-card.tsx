"use client";

import { useState } from "react";

type Role = {
  id: string;
  key: string;
  name: string;
  title: string;
  description: string;
  icon: string;
};

export function RoleCard({ role }: { role: Role }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setOutput(null);
    try {
      const res = await fetch(`/api/roles/${role.key}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setOutput(data.run.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div>
        <p className="font-display text-[11px] uppercase tracking-wide text-accent">{role.title}</p>
        <p className="font-display text-base font-semibold text-ink">{role.name}</p>
        <p className="mt-1 text-xs text-ink-soft">{role.description}</p>
      </div>
      <div className="flex flex-col gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${role.name} something...`}
          className="min-h-[64px] w-full rounded-lg border border-border bg-surface-2 p-2 text-xs text-ink outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          onClick={handleRun}
          disabled={loading || !input.trim()}
          className="self-end rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink disabled:opacity-50"
        >
          {loading ? "Working..." : "Run"}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {output && (
        <div className="rounded-lg border border-border bg-surface-2 p-3 text-xs text-ink whitespace-pre-wrap">
          {output}
        </div>
      )}
    </div>
  );
}
