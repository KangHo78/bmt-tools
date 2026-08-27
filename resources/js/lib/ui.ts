import {
    AlertTriangle,
    ArrowUpRight,
    Check,
    CheckCircle2,
    Clock,
    SearchX,
    Wrench,
    XCircle,
} from "lucide-react";
import { getStoredLocale } from "@/lib/i18n";

export const roleLabels: Record<string, string> = {
    user: "Peminjam",
    petugas: "Admin Tools",
    kepala_logistik: "Kepala Logistik",
    admin: "Administrator Tools",
};
export const statusMeta: Record<
    string,
    { label: string; tone: string; icon: any }
> = {
    tersedia: { label: "Tersedia", tone: "green", icon: CheckCircle2 },
    direservasi: { label: "Direservasi", tone: "amber", icon: Clock },
    dipinjam: { label: "Dipinjam", tone: "blue", icon: ArrowUpRight },
    perawatan: { label: "Dalam Perawatan", tone: "blue", icon: Wrench },
    rusak: { label: "Rusak", tone: "red", icon: AlertTriangle },
    hilang: { label: "Hilang", tone: "red", icon: SearchX },
    menunggu_approval: {
        label: "Menunggu Persetujuan",
        tone: "amber",
        icon: Clock,
    },
    ditolak: { label: "Ditolak", tone: "red", icon: XCircle },
    disetujui: { label: "Disetujui", tone: "green", icon: CheckCircle2 },
    menunggu_serah_terima: {
        label: "Menunggu Serah Terima",
        tone: "amber",
        icon: Clock,
    },
    berjalan: { label: "Berjalan", tone: "blue", icon: ArrowUpRight },
    menunggu_inspeksi: { label: "Perlu Diperiksa", tone: "amber", icon: Clock },
    selesai: { label: "Selesai", tone: "green", icon: Check },
    terlambat: { label: "Terlambat", tone: "red", icon: AlertTriangle },
    draf: { label: "Draf", tone: "muted", icon: Clock },
    investigasi: { label: "Investigasi", tone: "amber", icon: SearchX },
    dilaporkan: { label: "Dilaporkan", tone: "red", icon: AlertTriangle },
    dijadwalkan: { label: "Dijadwalkan", tone: "amber", icon: Clock },
    tidak_lengkap: {
        label: "Tidak Lengkap",
        tone: "amber",
        icon: AlertTriangle,
    },
    sesuai: { label: "Sesuai", tone: "green", icon: CheckCircle2 },
    belum_discan: { label: "Belum Discan", tone: "muted", icon: Clock },
    selisih_lokasi: {
        label: "Selisih Lokasi",
        tone: "amber",
        icon: AlertTriangle,
    },
    kondisi_berbeda: {
        label: "Kondisi Berbeda",
        tone: "amber",
        icon: AlertTriangle,
    },
    tidak_ditemukan: { label: "Tidak Ditemukan", tone: "red", icon: SearchX },
    berita_acara: { label: "Berita Acara", tone: "blue", icon: Check },
    keputusan: { label: "Menunggu Keputusan", tone: "amber", icon: Clock },
};
export const toneClass: Record<string, string> = {
    green: "border-green/30 bg-green/10 text-green",
    amber: "border-amber/50 bg-amber/15 text-amber-ink",
    blue: "border-blue/30 bg-blue/10 text-blue",
    red: "border-red/30 bg-red/10 text-red",
    muted: "border-line bg-canvas text-muted",
};
export const formatDate = (value?: string) =>
    value
        ? new Intl.DateTimeFormat(
              getStoredLocale() === "en" ? "en-GB" : "id-ID",
              {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
              },
          ).format(new Date(value))
        : "—";
export const formatDateTime = (value?: string) =>
    value
        ? new Intl.DateTimeFormat(
              getStoredLocale() === "en" ? "en-GB" : "id-ID",
              {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
              },
          ).format(new Date(value))
        : "—";
