import Link from "next/link";
import { db } from "@/db";
import { loans, users, cases, toolUnits } from "@/db/schema";
import { eq, sql, ne } from "drizzle-orm";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { loanStatusMeta, caseStageMeta } from "@/lib/status";
import { formatDateShort, relativeDayLabel } from "@/lib/format";
import { LinkButton } from "@/components/ui/Button";
import { CheckSquare, Building2, ShieldAlert, Gauge } from "lucide-react";

export async function KepalaView({ user }: { user: typeof users.$inferSelect }) {
  const pendingOutside = await db
    .select({ loan: loans, requester: users })
    .from(loans)
    .innerJoin(users, eq(users.id, loans.userId))
    .where(sql`${loans.status} = 'menunggu_approval' and ${loans.usageType} = 'luar_area'`);

  const lateByInstitution = await db
    .select({
      institution: users.institution,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(loans)
    .innerJoin(users, eq(users.id, loans.userId))
    .where(eq(loans.status, "terlambat"))
    .groupBy(users.institution);

  const openCases = await db.select().from(cases).where(ne(cases.stage, "selesai"));

  const [totalUnitsRow] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(toolUnits);
  const [activeUnitsRow] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(toolUnits).where(eq(toolUnits.status, "dipinjam"));

  const [totalReturned] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(loans).where(eq(loans.status, "selesai"));
  const onTimeRows = await db
    .select({ dueDate: loans.dueDate, returnedAt: loans.returnedAt })
    .from(loans)
    .where(eq(loans.status, "selesai"));
  const onTimeCount = onTimeRows.filter((r) => r.returnedAt && r.returnedAt <= r.dueDate).length;
  const compliancePct = totalReturned.count ? Math.round((onTimeCount / totalReturned.count) * 100) : 100;
  const utilizationPct = totalUnitsRow.count ? Math.round((activeUnitsRow.count / totalUnitsRow.count) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Ringkasan Kepala Logistik</p>
        <h1 className="font-display text-3xl font-bold text-ink">Halo, {user.name.split(" ")[0]}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Approval Pinjaman Luar Area"
          description={`${pendingOutside.length} permohonan menunggu keputusan`}
          action={<LinkButton href="/approval" variant="outline" size="sm" icon={<CheckSquare size={14} />}>Buka Antrean</LinkButton>}
        >
          {pendingOutside.length === 0 ? (
            <EmptyState title="Tidak ada antrean" description="Semua permohonan luar area sudah diputuskan." />
          ) : (
            <ul className="space-y-2">
              {pendingOutside.slice(0, 4).map(({ loan, requester }) => (
                <li key={loan.id}>
                  <Link href={`/approval/${loan.id}`} className="flex items-center justify-between gap-2 rounded border border-line p-3 hover:border-ink">
                    <div>
                      <p className="font-num text-sm font-semibold">{loan.trxNo}</p>
                      <p className="text-xs text-muted">{requester.name} · {loan.locationText}</p>
                    </div>
                    <StatusBadge meta={loanStatusMeta[loan.status]} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Pinjaman Terlambat per Lembaga" description={<span className="flex items-center gap-1"><Building2 size={12} /> Distribusi keterlambatan</span>}>
          {lateByInstitution.length === 0 ? (
            <EmptyState title="Tidak ada keterlambatan" description="Seluruh lembaga mitra tertib mengembalikan alat." />
          ) : (
            <ul className="space-y-2">
              {lateByInstitution.map((row) => (
                <li key={row.institution} className="flex items-center justify-between rounded border border-line p-3 text-sm">
                  <span className="font-medium text-ink">{row.institution ?? "Tidak diketahui"}</span>
                  <span className="font-num font-bold text-red">{row.count} pinjaman</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Kasus Rusak / Hilang Belum Selesai"
        action={<LinkButton href="/kasus" variant="outline" size="sm" icon={<ShieldAlert size={14} />}>Lihat Semua</LinkButton>}
      >
        {openCases.length === 0 ? (
          <EmptyState title="Tidak ada kasus terbuka" description="Semua kasus kerusakan/kehilangan telah diselesaikan." />
        ) : (
          <ul className="divide-y divide-line">
            {openCases.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <div>
                  <Link href={`/kasus/${c.id}`} className="font-num text-sm font-semibold hover:underline">{c.caseNo}</Link>
                  <p className="text-xs text-muted">{c.type === "rusak" ? "Kerusakan" : "Kehilangan"} · {relativeDayLabel(c.createdAt)}</p>
                </div>
                <StatusBadge meta={caseStageMeta[c.stage]} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Utilisasi & Kepatuhan Bulanan" description={<span className="flex items-center gap-1"><Gauge size={12} /> Ringkasan performa operasional</span>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded border border-line p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Utilisasi Aset</p>
            <p className="font-num mt-1 text-3xl font-bold text-blue">{utilizationPct}%</p>
            <p className="mt-1 text-xs text-muted">Unit sedang dipinjam dari total unit terdaftar</p>
          </div>
          <div className="rounded border border-line p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Kepatuhan Tepat Waktu</p>
            <p className="font-num mt-1 text-3xl font-bold text-green">{compliancePct}%</p>
            <p className="mt-1 text-xs text-muted">Pengembalian selesai tanpa keterlambatan</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
