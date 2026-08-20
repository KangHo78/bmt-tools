import type { StatusMeta } from "@/lib/status";
import { toneClasses } from "@/lib/status";

export function StatusBadge({ meta, hint }: { meta: StatusMeta; hint?: string }) {
  const Icon = meta.icon;
  const tones = toneClasses[meta.tone];
  return (
    <span
      title={hint}
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-semibold leading-none ${tones.bg} ${tones.text} ${tones.border}`}
    >
      <Icon size={13} strokeWidth={2.25} aria-hidden />
      {meta.label}
    </span>
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "amber" | "green" | "red" | "blue";
}) {
  const tones = toneClasses[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tones.bg} ${tones.text} ${tones.border}`}
    >
      {children}
    </span>
  );
}
