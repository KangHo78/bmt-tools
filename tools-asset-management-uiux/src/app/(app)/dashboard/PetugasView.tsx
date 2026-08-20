import Link from "next/link";
import { db } from "@/db";
import { loans, maintenanceOrders, audits, toolUnits, toolTypes, categories, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { Panel, SectionLabel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { loanStatusMeta } from "@/lib/status";
import { formatDateShort, relativeDayLabel } from "@/lib/format";
import { ArrowRight, ClipboardCheck, PackageCheck, AlertTriangle, Wrench, Truck } from "lucide-react";

function nextFriday() {
  const d = new Date();
  const day = d.getDay();
  const diff = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function PetugasView({ user }: { user: typeof users.$inferSelect }) {
  const allLoans = await db.select().from(loans);
  const friday = nextFriday();

  const readyForHandover = allLoans.filter((l) => l.status === "disetujui" || l.status === "menunggu_serah_terima");
  const waitingInspection = allLoans.filter((l) => l.status === "menunggu_inspeksi");
  const dueFriday = allLoans.filter((l) => l.status === "berjalan" && l.dueDate <= friday);
  const overdueOutside = allLoans.filter((l) => l.status === "terlambat" && l.usageType === "luar_area");

  const maintenanceNeedsAction = await db
    .select()
    .from(maintenanceOrders)
    .where(sql`${maintenanceOrders.status} in ('dijadwalkan','terlambat')`);
  const auditsRunning = await db.select().from(audits).where(eq(audits.status, "berjalan"));

  const shiftCards = [
    { label: "Serah Terima Hari Ini", count: readyForHandover.length, icon: Truck, href: "/peminjaman?status=disetujui" },
    { label: "Menunggu Inspeksi", count: waitingInspection.length, icon: ClipboardCheck, href: "/pengembalian" },
    { label: "Jatuh Tempo Jumat Ini", count: dueFriday.length, icon: PackageCheck, href: "/peminjaman?status=berjalan" },
    { label: "Luar Area Terlambat", count: overdueOutside.length, icon: AlertTriangle, href: "/peminjaman?status=terlambat" },
    { label: "Servis & Audit", count: maintenanceNeedsAction.length + auditsRunning.length, icon: Wrench, href: "/pemeliharaan" },
  ];

  const priorityQueue = [
    ...readyForHandover.map((l) => ({ time: formatDateShort(l.startDate), label: `${l.trxNo} · Serahkan alat`, href: `/peminjaman/${l.id}` })),
    ...waitingInspection.map((l) => ({ time: formatDateShort(l.dueDate), label: `${l.trxNo} · Inspeksi pengembalian`, href: `/pengembalian/${l.id}` })),
    ...overdueOutside.map((l) => ({ time: relativeDayLabel(l.dueDate), label: `${l.trxNo} · Ingatkan peminjam`, href: `/peminjaman/${l.id}` })),
  ].slice(0, 8);

  const stockByCategory = await db
    .select({
      category: categories.name,
      total: sql<number>`count(${toolUnits.id})`.mapWith(Number),
      available: sql<number>`count(*) filter (where ${toolUnits.status} = 'tersedia')`.mapWith(Number),
      damaged: sql<number>`count(*) filter (where ${toolUnits.status} in ('rusak','hilang'))`.mapWith(Number),
      service: sql<number>`count(*) filter (where ${toolUnits.status} = 'perawatan')`.mapWith(Number),
    })
    .from(toolUnits)
    .innerJoin(toolTypes, eq(toolTypes.id, toolUnits.toolTypeId))
    .innerJoin(categories, eq(categories.id, toolTypes.categoryId))
    .groupBy(categories.name);

  const totalUnits = stockByCategory.reduce((s, c) => s + c.total, 0);
  const totalAvailable = stockByCategory.reduce((s, c) => s + c.available, 0);
  const totalService = stockByCategory.reduce((s, c) => s + c.service, 0);
  const totalDamaged = stockByCategory.reduce((s, c) => s + c.damaged, 0);
  const availablePct = totalUnits ? Math.round((totalAvailable / totalUnits) * 100) : 0;

  const recentLoans = await db.select().from(loans).orderBy(desc(loans.createdAt)).limit(6);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Shift Board · {formatDateShort(new Date())}</p>
        <h1 className="font-display text-3xl font-bold text-ink">Halo, {user.name.split(" ")[0]}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {shiftCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="panel flex flex-col justify-between p-4 transition-colors hover:border-ink">
              <Icon size={18} className="text-blue" />
              <p className="mt-3 font-num text-3xl font-bold leading-none text-ink">{card.count}</p>
              <p className="mt-1 text-xs font-medium text-muted">{card.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Prioritas Hari Ini" className="lg:col-span-2" bodyClassName="p-0">
          {priorityQueue.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Tidak ada antrean prioritas" description="Semua serah terima dan inspeksi telah ditangani." />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {priorityQueue.map((task, idx) => (
                <li key={idx}>
                  <Link href={task.href} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-canvas">
                    <span className="font-num w-24 shrink-0 text-muted">{task.time}</span>
                    <span className="flex-1 font-medium text-ink">{task.label}</span>
                    <ArrowRight size={15} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Kondisi Stok">
          <p className="font-num text-3xl font-bold text-green">{availablePct}%</p>
          <p className="text-xs text-muted">unit berstatus tersedia dari {totalUnits} total unit</p>
          <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Dalam perawatan</span>
              <span className="font-num font-semibold">{totalService}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Rusak / hilang</span>
              <span className="font-num font-semibold text-red">{totalDamaged}</span>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
            {stockByCategory.map((c) => (
              <li key={c.category} className="flex items-center justify-between text-xs">
                <span className="text-ink">{c.category}</span>
                <span className="font-num text-muted">
                  {c.available}/{c.total} tersedia
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Aktivitas Terakhir">
        <ul className="divide-y divide-line">
          {recentLoans.map((loan) => (
            <li key={loan.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div>
                <Link href={`/peminjaman/${loan.id}`} className="font-num text-sm font-semibold text-ink hover:underline">
                  {loan.trxNo}
                </Link>
                <p className="text-xs text-muted">{loan.purpose}</p>
              </div>
              <StatusBadge meta={loanStatusMeta[loan.status]} />
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
