import { Coins } from "lucide-react";

export function TokenMeter({
  used,
  total,
  detail,
}: {
  used: number;
  total: number;
  detail?: { label: string; count: number }[];
}) {
  const available = Math.max(0, total - used);
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          <Coins size={14} className="text-amber-ink" aria-hidden /> Token Peminjaman
        </p>
      </div>
      <p className="mt-2 font-display text-3xl font-semibold leading-none text-ink">
        <span className="font-num">{available}</span> dari <span className="font-num">{total}</span> token tersedia
      </p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line/60" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-amber transition-all duration-200" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">
        {used} token terpakai untuk jenis alat aktif. Kembalikan alat untuk membebaskan token.
      </p>
      {detail && detail.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
          {detail.map((d) => (
            <li key={d.label} className="flex items-center justify-between text-sm">
              <span className="text-ink">{d.label}</span>
              <span className="font-num font-semibold text-muted">{d.count} token</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
