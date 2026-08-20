import {
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ClipboardList,
  AlertTriangle,
  Wrench,
  Hammer,
  SearchX,
  Check,
  XCircle,
  HelpCircle,
  PackageSearch,
  type LucideIcon,
} from "lucide-react";

export type StatusTone = "green" | "amber" | "blue" | "red" | "muted";

export interface StatusMeta {
  label: string;
  icon: LucideIcon;
  tone: StatusTone;
}

export const toneClasses: Record<StatusTone, { bg: string; text: string; border: string; dot: string }> = {
  green: { bg: "bg-green/10", text: "text-green", border: "border-green/30", dot: "bg-green" },
  amber: { bg: "bg-amber/15", text: "text-amber-ink", border: "border-amber/40", dot: "bg-amber" },
  blue: { bg: "bg-blue/10", text: "text-blue", border: "border-blue/30", dot: "bg-blue" },
  red: { bg: "bg-red/10", text: "text-red", border: "border-red/30", dot: "bg-red" },
  muted: { bg: "bg-muted/10", text: "text-muted", border: "border-line", dot: "bg-muted" },
};

export const unitStatusMeta: Record<string, StatusMeta> = {
  tersedia: { label: "Tersedia", icon: CheckCircle2, tone: "green" },
  direservasi: { label: "Direservasi", icon: Clock, tone: "amber" },
  dipinjam: { label: "Dipinjam", icon: ArrowUpRight, tone: "blue" },
  perawatan: { label: "Dalam Perawatan", icon: Wrench, tone: "blue" },
  rusak: { label: "Rusak", icon: Hammer, tone: "red" },
  hilang: { label: "Hilang", icon: SearchX, tone: "red" },
};

export const loanStatusMeta: Record<string, StatusMeta> = {
  menunggu_approval: { label: "Menunggu Persetujuan", icon: Clock, tone: "amber" },
  ditolak: { label: "Ditolak", icon: XCircle, tone: "red" },
  disetujui: { label: "Disetujui", icon: CheckCircle2, tone: "green" },
  menunggu_serah_terima: { label: "Menunggu Serah Terima", icon: ClipboardList, tone: "amber" },
  berjalan: { label: "Berjalan", icon: ArrowUpRight, tone: "blue" },
  menunggu_inspeksi: { label: "Perlu Diperiksa", icon: ClipboardList, tone: "amber" },
  selesai: { label: "Selesai", icon: Check, tone: "green" },
  terlambat: { label: "Terlambat", icon: AlertTriangle, tone: "red" },
};

export const returnStatusMeta: Record<string, StatusMeta> = {
  belum_dicek: { label: "Belum Dicek", icon: HelpCircle, tone: "muted" },
  sesuai: { label: "Sesuai", icon: CheckCircle2, tone: "green" },
  rusak: { label: "Rusak", icon: Hammer, tone: "red" },
  tidak_lengkap: { label: "Tidak Lengkap", icon: AlertTriangle, tone: "amber" },
  hilang: { label: "Hilang", icon: SearchX, tone: "red" },
};

export const maintenanceStatusMeta: Record<string, StatusMeta> = {
  dijadwalkan: { label: "Dijadwalkan", icon: Clock, tone: "amber" },
  berjalan: { label: "Berjalan", icon: Wrench, tone: "blue" },
  selesai: { label: "Selesai", icon: Check, tone: "green" },
  terlambat: { label: "Terlambat", icon: AlertTriangle, tone: "red" },
};

export const auditItemStatusMeta: Record<string, StatusMeta> = {
  belum_discan: { label: "Belum Discan", icon: PackageSearch, tone: "muted" },
  sesuai: { label: "Sesuai", icon: CheckCircle2, tone: "green" },
  selisih_lokasi: { label: "Selisih Lokasi", icon: AlertTriangle, tone: "amber" },
  kondisi_berbeda: { label: "Kondisi Berbeda", icon: Hammer, tone: "amber" },
  hilang: { label: "Hilang", icon: SearchX, tone: "red" },
};

export const auditStatusMeta: Record<string, StatusMeta> = {
  draf: { label: "Draf", icon: ClipboardList, tone: "muted" },
  berjalan: { label: "Berjalan", icon: Clock, tone: "blue" },
  rekonsiliasi: { label: "Rekonsiliasi", icon: AlertTriangle, tone: "amber" },
  selesai: { label: "Selesai", icon: Check, tone: "green" },
};

export const caseStageMeta: Record<string, StatusMeta> = {
  dilaporkan: { label: "Dilaporkan", icon: ClipboardList, tone: "muted" },
  investigasi: { label: "Investigasi", icon: SearchX, tone: "amber" },
  berita_acara: { label: "Berita Acara", icon: ClipboardList, tone: "blue" },
  keputusan: { label: "Keputusan", icon: HelpCircle, tone: "amber" },
  selesai: { label: "Selesai", icon: Check, tone: "green" },
};

export const roleLabel: Record<string, string> = {
  user: "Peminjam",
  petugas: "Petugas Gudang",
  kepala_logistik: "Kepala Logistik",
  admin: "Administrator",
};
