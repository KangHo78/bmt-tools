import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { loans, loanItems, toolTypes, toolUnits, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { Panel, SectionLabel } from "@/components/ui/Panel";
import { StatusBadge, Pill } from "@/components/ui/Badge";
import { DeadlinePanel } from "@/components/ui/DeadlinePanel";
import { LinkButton } from "@/components/ui/Button";
import { loanStatusMeta, returnStatusMeta } from "@/lib/status";
import { formatDateAbsolute, formatDateTime } from "@/lib/format";
import { extendLoan, remindBorrower } from "@/lib/loan-actions";
import { FileText, ShieldCheck, Truck, Undo2, Bell, CalendarPlus, Download, Coins } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [row] = await db
    .select({ loan: loans, borrower: users })
    .from(loans)
    .innerJoin(users, eq(users.id, loans.userId))
    .where(eq(loans.id, id))
    .limit(1);

  if (!row) notFound();
  const { loan, borrower } = row;

  const isOwner = loan.userId === user.id;
  const isStaff = ["petugas", "kepala_logistik", "admin"].includes(user.role);
  if (!isOwner && !isStaff) notFound();

  const items = await db
    .select({ item: loanItems, type: toolTypes, unit: toolUnits })
    .from(loanItems)
    .innerJoin(toolTypes, eq(toolTypes.id, loanItems.toolTypeId))
    .leftJoin(toolUnits, eq(toolUnits.id, loanItems.unitId))
    .where(eq(loanItems.loanId, id));

  const timeline = [
    { label: "Permohonan dibuat", at: loan.createdAt, done: true },
    { label: loan.status === "ditolak" ? "Permohonan ditolak" : "Disetujui Kepala Logistik", at: loan.approvedAt, done: Boolean(loan.approvedAt) || loan.status === "ditolak" },
    { label: "Serah terima alat", at: loan.handoverAt, done: Boolean(loan.handoverAt) },
    { label: "Tenggat pengembalian", at: loan.dueDate, done: false },
    { label: "Pengembalian selesai", at: loan.returnedAt, done: Boolean(loan.returnedAt) },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 pb-28 sm:p-6 sm:pb-6">
      <Panel bodyClassName="p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="font-num text-2xl font-bold text-ink">{loan.trxNo}</p>
            <p className="mt-1 text-sm text-muted">
              {borrower.name} · {borrower.institution}
            </p>
            <p className="mt-1 text-sm text-muted">{loan.purpose}</p>
          </div>
          <StatusBadge meta={loanStatusMeta[loan.status]} />
        </div>
        {loan.status === "ditolak" && loan.rejectionReason && (
          <p className="mt-3 rounded border border-red/40 bg-red/10 px-3 py-2 text-sm font-medium text-red">Alasan penolakan: {loan.rejectionReason}</p>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionLabel>Tenggat Pengembalian</SectionLabel>
          <DeadlinePanel dueDate={loan.dueDate} area={loan.locationText} usageType={loan.usageType} />
        </div>
        <Panel title="Token" bodyClassName="p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted">
            <Coins size={13} /> Token digunakan
          </p>
          <p className="font-num mt-1 text-2xl font-bold text-ink">{loan.tokensUsed}</p>
        </Panel>
      </div>

      <Panel title="Daftar Alat" bodyClassName="p-0">
        <div className="divide-y divide-line">
          {items.map(({ item, type, unit }) => (
            <div key={item.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-ink">{type.name}</p>
                <p className="font-num text-xs text-muted">{unit ? unit.assetCode : "Unit belum ditetapkan (menunggu serah terima)"}</p>
                <p className="text-xs text-muted">Kondisi keluar: {item.conditionOut ?? "-"}</p>
              </div>
              <StatusBadge meta={returnStatusMeta[item.returnStatus]} />
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Dokumen">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between rounded border border-line p-3">
              <span className="flex items-center gap-2"><FileText size={15} className="text-blue" /> Surat Tugas</span>
              {loan.letterUrl ? (
                <a href={loan.letterUrl} target="_blank" className="text-xs font-semibold text-blue hover:underline">Lihat berkas</a>
              ) : (
                <span className="text-xs text-muted">Tidak diperlukan</span>
              )}
            </li>
            <li className="flex items-center justify-between rounded border border-line p-3">
              <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-green" /> Persetujuan</span>
              <span className="text-xs text-muted">{loan.approvedAt ? formatDateTime(loan.approvedAt) : "Belum ada"}</span>
            </li>
            <li className="flex items-center justify-between rounded border border-line p-3">
              <span className="flex items-center gap-2"><Truck size={15} className="text-blue" /> Bukti Serah Terima</span>
              {loan.handoverPhotoUrl ? (
                <a href={loan.handoverPhotoUrl} target="_blank" className="text-xs font-semibold text-blue hover:underline flex items-center gap-1">
                  <Download size={12} /> Unduh
                </a>
              ) : (
                <span className="text-xs text-muted">Belum tersedia</span>
              )}
            </li>
          </ul>
        </Panel>

        <Panel title="Linimasa">
          <ol className="space-y-3 border-l border-line pl-4">
            {timeline.map((t, idx) => (
              <li key={idx} className="relative">
                <span className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface ${t.done ? "bg-green" : "bg-line"}`} />
                <p className={`text-sm font-medium ${t.done ? "text-ink" : "text-muted"}`}>{t.label}</p>
                {t.at && <p className="text-xs text-muted">{formatDateAbsolute(t.at)}</p>}
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <ActionBar loan={loan} role={user.role} isOwner={isOwner} />
    </div>
  );
}

function ActionBar({ loan, role, isOwner }: { loan: typeof loans.$inferSelect; role: string; isOwner: boolean }) {
  const isStaff = role === "petugas" || role === "admin";
  const isKepala = role === "kepala_logistik" || role === "admin";

  const buttons: React.ReactNode[] = [];

  if (loan.status === "menunggu_approval" && isKepala) {
    buttons.push(
      <LinkButton key="review" href={`/approval/${loan.id}`} variant="secondary" icon={<ShieldCheck size={16} />}>
        Tinjau Persetujuan
      </LinkButton>
    );
  }

  if ((loan.status === "disetujui" || loan.status === "menunggu_serah_terima") && isStaff) {
    buttons.push(
      <LinkButton key="handover" href={`/serah-terima/${loan.id}`} variant="secondary" icon={<Truck size={16} />}>
        Serahkan Alat
      </LinkButton>
    );
  }

  if (loan.status === "berjalan" && isStaff) {
    buttons.push(
      <form key="extend" action={extendLoan} className="flex items-center gap-2">
        <input type="hidden" name="loanId" value={loan.id} />
        <input type="date" name="newDueDate" required className="tap-target rounded border border-line px-2 py-2 text-sm" />
        <button type="submit" className="tap-target inline-flex items-center gap-1.5 rounded border border-line bg-surface px-3 py-2 text-sm font-semibold hover:bg-canvas">
          <CalendarPlus size={15} /> Perpanjang
        </button>
      </form>
    );
  }

  if ((loan.status === "berjalan" || loan.status === "terlambat") && isStaff) {
    buttons.push(
      <form key="remind" action={remindBorrower}>
        <input type="hidden" name="loanId" value={loan.id} />
        <button type="submit" className="tap-target inline-flex items-center gap-1.5 rounded border border-line bg-surface px-3 py-2 text-sm font-semibold hover:bg-canvas">
          <Bell size={15} /> Ingatkan
        </button>
      </form>
    );
  }

  if ((loan.status === "menunggu_inspeksi" || loan.status === "terlambat") && isStaff) {
    buttons.push(
      <LinkButton key="return" href={`/pengembalian/${loan.id}`} variant="secondary" icon={<Undo2 size={16} />}>
        Proses Pengembalian
      </LinkButton>
    );
  }

  if (loan.status === "selesai" && loan.handoverPhotoUrl) {
    buttons.push(
      <a
        key="proof"
        href={loan.handoverPhotoUrl}
        target="_blank"
        className="tap-target inline-flex items-center gap-1.5 rounded border border-line bg-surface px-3 py-2 text-sm font-semibold hover:bg-canvas"
      >
        <Download size={15} /> Lihat Bukti
      </a>
    );
  }

  if (buttons.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-surface p-3 shadow-[0_-8px_20px_rgba(23,32,29,0.08)] lg:sticky lg:bottom-0 lg:mt-6 lg:rounded-panel lg:border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">{buttons}</div>
    </div>
  );
}
