import clsx from "clsx";

const TONE_CLASSES: Record<string, string> = {
  neutral: "bg-surface-2 text-ink-faint border border-border",
  accent: "bg-accent-soft text-accent",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
};

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: keyof typeof TONE_CLASSES }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-display text-[10px] uppercase tracking-wide",
        TONE_CLASSES[tone],
      )}
    >
      {label}
    </span>
  );
}
