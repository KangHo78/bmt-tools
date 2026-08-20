import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { loans, users, loanItems, toolTypes } from "@/db/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState, NoResultsState } from "@/components/ui/States";
import { loanStatusMeta } from "@/lib/status";
import { formatDateShort, relativeDayLabel } from "@/lib/format";
import { FilePlus2, ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "", label: "Semua" },
  { key: "menunggu_approval", label: "Menunggu Persetujuan" },
  { key: "disetujui", label: "Disetujui" },
  { key: "berjalan", label: "Berjalan" },
  { key: "menunggu_inspeksi", label: "Perlu Diperiksa" },
  { key: "terlambat", label: "Terlambat" },
  { key: "selesai", label: "Selesai" },
];

export default async function PeminjamanListPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { status = "" } = await searchParams;

  const isStaff = user.role === "petugas" || user.role === "kepala_logistik" || user.role === "admin";

  const rows = await db
    .select({ loan: loans, borrower: users })
    .from(loans)
    .innerJoin(users, eq(users.id, loans.userId))
    .where(isStaff ? undefined : eq(loans.userId, user.id))
    .orderBy(desc(loans.createdAt));

  const filtered = status ? rows.filter((r) => r.loan.status === status) : rows;

  const loanIds = filtered.map((r) => r.loan.id);
  const items = loanIds.length
    ? await db
        .select({ loanId: loanItems.loanId, name: toolTypes.name })
        .from(loanItems)
        .innerJoin(toolTypes, eq(toolTypes.id, loanItems.toolTypeId))
        .where(inArray(loanItems.loanId, loanIds))
    : [];
  const namesByLoan = new Map<string, string[]>();
  for (const it of items) {
    if (!namesByLoan.has(it.loanId)) namesByLoan.set(it.loanId, []);
    namesByLoan.get(it.loanId)!.push(it.name);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Peminjaman</p>
          <h1 className="font-display text-3xl font-bold text-ink">{isStaff ? "Semua Transaksi Peminjaman" : "Peminjaman Saya"}</h1>
        </div>
        {!isStaff && (
          <LinkButton href="/peminjaman/baru" variant="secondary" icon={<FilePlus2 size={16} />}>
            Ajukan Pinjaman
          </LinkButton>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/peminjaman?status=${f.key}` : "/peminjaman"}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              status === f.key ? "border-ink bg-ink text-canvas" : "border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Belum ada peminjaman"
          description={isStaff ? "Transaksi peminjaman akan muncul di sini." : "Ajukan pinjaman pertama Anda untuk mulai menggunakan alat."}
          action={!isStaff ? <LinkButton href="/peminjaman/baru" variant="secondary">Ajukan Pinjaman</LinkButton> : undefined}
        />
      ) : filtered.length === 0 ? (
        <NoResultsState onReset={<LinkButton href="/peminjaman" variant="outline" size="sm">Hapus Filter</LinkButton>} />
      ) : (
        <Panel bodyClassName="p-0">
          <div className="divide-y divide-line">
            {filtered.map(({ loan, borrower }) => (
              <Link key={loan.id} href={`/peminjaman/${loan.id}`} className="flex flex-col gap-2 p-4 transition-colors hover:bg-canvas sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-num text-sm font-bold text-ink">{loan.trxNo}</p>
                    {isStaff && <span className="text-xs text-muted">· {borrower.name}</span>}
                  </div>
                  <p className="truncate text-sm text-muted">{(namesByLoan.get(loan.id) ?? []).join(", ")}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {loan.usageType === "luar_area" ? "Luar Area" : "Dalam Area"} · {loan.locationText} · Tenggat {formatDateShort(loan.dueDate)} ·{" "}
                    {relativeDayLabel(loan.dueDate)}
                  </p>
                </div>
                <StatusBadge meta={loanStatusMeta[loan.status]} />
              </Link>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
