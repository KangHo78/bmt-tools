import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function FocusHeader({ backHref, title, subtitle }: { backHref: string; title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
      <Link href={backHref} aria-label="Kembali" className="tap-target flex items-center justify-center rounded border border-line p-2 hover:bg-canvas">
        <ArrowLeft size={18} />
      </Link>
      <div className="min-w-0">
        <h1 className="truncate font-display text-lg font-bold leading-tight text-ink">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
      </div>
    </header>
  );
}
