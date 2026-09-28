"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/roster", label: "Roster" },
  { href: "/ideas", label: "Ideas" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/channels", label: "Channels" },
  { href: "/analytics", label: "Analytics" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-none flex-col gap-1 border-r border-border bg-surface px-3 py-6">
      <div className="mb-6 px-2">
        <p className="font-display text-[11px] uppercase tracking-[0.12em] text-accent">AI Team HQ</p>
        <p className="font-display text-lg font-semibold text-ink">The Studio</p>
      </div>
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-accent-soft text-accent" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-auto rounded-lg px-3 py-2 text-left text-sm text-ink-faint hover:bg-surface-2 hover:text-ink"
      >
        Sign out
      </button>
    </aside>
  );
}
