import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IdeaDetailClient } from "@/components/idea-detail-client";

export const dynamic = "force-dynamic";

export default async function IdeaDetailPage({ params }: { params: { id: string } }) {
  const idea = await prisma.idea.findUnique({
    where: { id: params.id },
    include: { copyDrafts: { orderBy: { platform: "asc" } } },
  });

  if (!idea) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-display text-[11px] uppercase tracking-[0.12em] text-accent">{idea.type.replace("_", " ")}</p>
        <h1 className="font-display text-2xl font-semibold text-ink">{idea.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">{idea.description}</p>
      </header>

      <IdeaDetailClient
        ideaId={idea.id}
        initialStatus={idea.status}
        drafts={idea.copyDrafts}
      />
    </div>
  );
}
