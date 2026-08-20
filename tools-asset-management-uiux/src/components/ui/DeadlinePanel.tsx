import { AlertTriangle, CalendarClock, MapPin } from "lucide-react";
import { formatDateAbsolute, relativeDayLabel, isOverdue, daysOverdue } from "@/lib/format";

export function DeadlinePanel({
  dueDate,
  area,
  usageType,
  compact = false,
}: {
  dueDate: Date | string;
  area?: string;
  usageType?: "dalam_area" | "luar_area";
  compact?: boolean;
}) {
  const overdue = isOverdue(dueDate);
  const overdueDays = daysOverdue(dueDate);

  if (overdue) {
    return (
      <div className={`rounded border border-red/40 bg-red/10 ${compact ? "p-3" : "p-4"}`}>
        <p className="flex items-center gap-2 text-sm font-bold text-red">
          <AlertTriangle size={16} aria-hidden />
          Terlambat {overdueDays} hari
        </p>
        <p className="mt-1 text-xs text-red/90">Tenggat: {formatDateAbsolute(dueDate)}</p>
        {area && (
          <p className="mt-1 flex items-center gap-1 text-xs text-red/80">
            <MapPin size={12} aria-hidden /> {usageType === "luar_area" ? "Luar Area · " : "Dalam Area · "}
            {area}
          </p>
        )}
      </div>
    );
  }

  const rel = relativeDayLabel(dueDate);
  const urgent = rel.includes("hari lagi") && Number(rel.split(" ")[0]) <= 2;

  return (
    <div className={`rounded border ${urgent ? "border-amber/50 bg-amber/10" : "border-line bg-canvas"} ${compact ? "p-3" : "p-4"}`}>
      <p className={`flex items-center gap-2 text-sm font-bold ${urgent ? "text-amber-ink" : "text-ink"}`}>
        <CalendarClock size={16} aria-hidden />
        {formatDateAbsolute(dueDate)} · {rel}
      </p>
      {area && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          <MapPin size={12} aria-hidden /> {usageType === "luar_area" ? "Luar Area · " : "Dalam Area · "}
          {area}
        </p>
      )}
    </div>
  );
}
