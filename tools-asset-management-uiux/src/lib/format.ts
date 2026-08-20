const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function formatDateAbsolute(date: Date | string): string {
  const d = new Date(date);
  return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDateShort(d)} · ${hh}:${mm}`;
}

/** Returns a relative label such as "2 hari lagi" or "terlambat 3 hari" */
export function relativeDayLabel(date: Date | string, from: Date = new Date()): string {
  const target = new Date(date);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffMs = startOfDay(target) - startOfDay(from);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Besok";
  if (diffDays === -1) return "Kemarin";
  if (diffDays > 1) return `${diffDays} hari lagi`;
  return `Terlambat ${Math.abs(diffDays)} hari`;
}

export function isOverdue(date: Date | string, from: Date = new Date()): boolean {
  return new Date(date).getTime() < from.getTime();
}

export function daysOverdue(date: Date | string, from: Date = new Date()): number {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOfDay(from) - startOfDay(new Date(date))) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function formatDateFull(date: Date | string): string {
  return `${formatDateAbsolute(date)} · ${relativeDayLabel(date)}`;
}
