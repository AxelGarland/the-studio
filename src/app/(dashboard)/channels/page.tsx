import { prisma } from "@/lib/prisma";
import { ChannelsClient } from "@/components/channels-client";

export const dynamic = "force-dynamic";

export default async function ChannelsPage() {
  const channels = await prisma.channel.findMany({ orderBy: { platform: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-display text-[11px] uppercase tracking-[0.12em] text-accent">Distribution</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Channels</h1>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">
          Track which social channels are set up and live before you point content at them.
        </p>
      </header>
      <ChannelsClient channels={channels} />
    </div>
  );
}
