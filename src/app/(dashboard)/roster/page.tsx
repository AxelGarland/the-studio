import { prisma } from "@/lib/prisma";
import { RoleCard } from "@/components/role-card";

export const dynamic = "force-dynamic";

export default async function RosterPage() {
  const roles = await prisma.agentRole.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-display text-[11px] uppercase tracking-[0.12em] text-accent">Your AI team</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Roster</h1>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">
          Five roles, each a specialized prompt. Ask one directly here, or let Ideas and Newsletter trigger them automatically.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <RoleCard key={role.id} role={role} />
        ))}
      </div>
    </div>
  );
}
