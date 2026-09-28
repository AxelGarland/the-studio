"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IdeasToolbar({ type }: { type: string }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ideas/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.toString?.() ?? "Request failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, description }),
    });
    if (res.ok) {
      setTitle("");
      setDescription("");
      setShowForm(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink disabled:opacity-50"
        >
          {generating ? "Researching..." : "Generate 5 ideas"}
        </button>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-2"
        >
          {showForm ? "Cancel" : "Add idea manually"}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {showForm && (
        <form onSubmit={handleCreate} className="card flex flex-col gap-2 p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="min-h-[60px] rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="self-end rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink"
          >
            Add to backlog
          </button>
        </form>
      )}
    </div>
  );
}
