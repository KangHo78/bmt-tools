import Link from "next/link";
import { db } from "@/db";
import { loans, loanItems, toolTypes } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { Panel, SectionLabel } from "@/components/ui/Panel";
import { TokenMeter } from "@/components/ui/TokenMeter";
import { DeadlinePanel } from "@/components/ui/DeadlinePanel";
import { StatusBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { loanStatusMeta } from "@/lib/status";
import { formatDateShort } from "@/lib/format";
import { getTokenSummary } from "@/lib/domain";
import { Search, FilePlus2, Undo2, Package } from "lucide-react";
import type { users } from "@/db/schema";

export async function UserView({ user }: { user: typeof users.$inferSelect }) {
  const tokenSummary = await getTokenSummary(user.id);

  const myLoans = await db.select().from(loans).where(eq(loans.userId, user.id)).orderBy(desc(loans.createdAt));

  const activeLoans = myLoans.filter((l) => ["berjalan", "menunggu_inspeksi", "terlambat", "disetujui", "menunggu_serah_terima"].includes(l.status));
  const nextDeadline = [...activeLoans].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
  const recentRequests = myLoans.slice(0, 5);

  const loanIds = myLoans.map((l) => l.id);
  const items = loanIds.length
    ? await db
        .select({ loanId: loanItems.id, toolName: toolTypes.name, loanIdRef: loanItems.loanId })
        .from(loanItems)
        .innerJoin(toolTypes, eq(toolTypes.id, loanItems.toolTypeId))
        .where(inArray(loanItems.loanId, loanIds))
    : [];

  const itemsByLoan = new Map<string, string[]>();
  for (const it of items) {
    if (!itemsByLoan.has(it.loanIdRef)) itemsByLoan.set(it.loanIdRef, []);
    itemsByLoan.get(it.loanIdRef)!.push(it.toolName);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Ringkasan Peminjam</p>
        <h1 className="font-display text-3xl font-bold text-ink">Halo, {user.name.split(" ")[0]}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TokenMeter used={tokenSummary.used} total={tokenSummary.total} detail={tokenSummary.detail} />

        <Panel title="Kewajiban Terdekat" className="lg:col-span-2">
          {nextDeadline ? (
            <div className="space-y-3">
              <DeadlinePanel dueDate={nextDeadline.dueDate} area={nextDeadline.locationText} usageType={nextDeadline.usageType} />
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-num font-semibold text-ink">{nextDeadline.trxNo}</p>
                  <p className="text-muted">{(itemsByLoan.get(nextDeadline.id) ?? []).join(", ") || "Detail alat"}</p>
                </div>
                <LinkButton href={`/peminjaman/${nextDeadline.id}`} variant="outline" size="sm">
                  Lihat Detail
                </LinkButton>
              </div>
            </div>
          ) : (
            <EmptyState icon={Package} title="Tidak ada kewajiban aktif" description="Semua alat telah dikembalikan. Ajukan pinjaman baru bila diperlukan." />
          )}
        </Panel>
      </div>

      <div>
        <SectionLabel>Aksi Cepat</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-3">
          <LinkButton href="/katalog" variant="outline" size="lg" icon={<Search size={18} />} className="justify-start">
            Cari Alat
          </LinkButton>
          <LinkButton href="/peminjaman/baru" variant="secondary" size="lg" icon={<FilePlus2 size={18} />} className="justify-start">
            Ajukan Pinjaman
          </LinkButton>
          <LinkButton href="/peminjaman?tab=aktif" variant="outline" size="lg" icon={<Undo2 size={18} />} className="justify-start">
            Ajukan Pengembalian
          </LinkButton>
        </div>
      </div>

      <Panel title="Pinjaman Aktif" description="Unit yang sedang berada di tangan Anda">
        {activeLoans.length === 0 ? (
          <EmptyState title="Belum ada pinjaman aktif" description="Ajukan pinjaman untuk mulai menggunakan alat." />
        ) : (
          <div className="space-y-2">
            {activeLoans.map((loan) => (
              <Link
                key={loan.id}
                href={`/peminjaman/${loan.id}`}
                className="flex flex-col gap-2 rounded border border-line p-3 transition-colors hover:border-ink sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-num text-sm font-semibold text-ink">{loan.trxNo}</p>
                  <p className="text-sm text-muted">{(itemsByLoan.get(loan.id) ?? []).join(", ")}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {loan.locationText} · Tenggat {formatDateShort(loan.dueDate)}
                  </p>
                </div>
                <StatusBadge meta={loanStatusMeta[loan.status]} />
              </Link>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Permohonan Terbaru">
        {recentRequests.length === 0 ? (
          <EmptyState title="Belum ada permohonan" description="Riwayat permohonan pinjaman Anda akan muncul di sini." />
        ) : (
          <div className="divide-y divide-line">
            {recentRequests.map((loan) => (
              <div key={loan.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-num text-sm font-semibold text-ink">{loan.trxNo}</p>
                  <p className="text-xs text-muted">{loan.purpose}</p>
                  {loan.status === "ditolak" && loan.rejectionReason && (
                    <p className="mt-1 text-xs font-medium text-red">Alasan: {loan.rejectionReason}</p>
                  )}
                </div>
                <StatusBadge meta={loanStatusMeta[loan.status]} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
