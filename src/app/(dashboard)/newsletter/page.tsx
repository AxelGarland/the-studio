import { prisma } from "@/lib/prisma";
import { NewsletterClient } from "@/components/newsletter-client";
import { currentWeekStart } from "@/lib/week";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  const weekOf = currentWeekStart();
  const items = await prisma.newsletterDigestItem.findMany({
    where: { weekOf },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-display text-[11px] uppercase tracking-[0.12em] text-accent">
          Week of {weekOf.toLocaleDateString()}
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink">Newsletter digest</h1>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">
          Research candidates for this week's issue. Include or skip each before you write the final send.
        </p>
      </header>
      <NewsletterClient items={items} />
    </div>
  );
}
