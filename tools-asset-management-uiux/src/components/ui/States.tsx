import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, Loader2, SearchX, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded border border-dashed border-line bg-canvas/60 px-6 py-12 text-center">
      <Icon size={32} className="text-muted" strokeWidth={1.5} aria-hidden />
      <div>
        <p className="font-display text-lg font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function NoResultsState({ onReset }: { onReset?: ReactNode }) {
  return (
    <EmptyState
      icon={SearchX}
      title="Tidak ada hasil yang cocok"
      description="Filter yang dipilih tidak menemukan data. Coba ubah atau hapus sebagian filter."
      action={onReset}
    />
  );
}

export function ErrorState({ message = "Gagal memuat data. Periksa koneksi Anda.", action }: { message?: string; action?: ReactNode }) {
  return <EmptyState icon={AlertTriangle} title="Terjadi kesalahan" description={message} action={action} />;
}

export function UnauthorizedState({ message = "Anda tidak memiliki hak akses untuk melihat halaman ini." }: { message?: string }) {
  return <EmptyState icon={ShieldAlert} title="Akses ditolak" description={message} />;
}

export function LoadingState({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded border border-line bg-surface px-6 py-12 text-sm text-muted">
      <Loader2 size={16} className="animate-spin" aria-hidden />
      {label}
    </div>
  );
}
