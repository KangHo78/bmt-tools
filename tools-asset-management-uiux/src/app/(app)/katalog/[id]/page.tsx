import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { toolTypes, toolUnits, categories, locations, maintenanceOrders, loanItems, loans, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge, Pill } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { unitStatusMeta, maintenanceStatusMeta } from "@/lib/status";
import { formatDateShort } from "@/lib/format";
import { MapPin, Ruler, Repeat, ClipboardCheck, Wrench, Tag } from "lucide-react";
import { checklistFor } from "@/lib/checklist";

async function getLocationPath(locationId: string | null) {
  if (!locationId) return "Lokasi belum ditentukan";
  const path: string[] = [];
  let currentId: string | null = locationId;
  let guard = 0;
  while (currentId && guard < 6) {
    guard++;
    const [loc] = await db.select().from(locations).where(eq(locations.id, currentId)).limit(1);
    if (!loc) break;
    path.unshift(loc.name);
    currentId = loc.parentId;
  }
  return path.join(" / ") || "Lokasi belum ditentukan";
}

export default async function ToolTypeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { tab = "ringkasan" } = await searchParams;

  const [type] = await db
    .select({
      id: toolTypes.id,
      name: toolTypes.name,
      code: toolTypes.code,
      description: toolTypes.description,
      rulesSummary: toolTypes.rulesSummary,
      size: toolTypes.size,
      requiresOutsideLetter: toolTypes.requiresOutsideLetter,
      categoryName: categories.name,
      primaryLocationId: toolTypes.primaryLocationId,
    })
    .from(toolTypes)
    .leftJoin(categories, eq(categories.id, toolTypes.categoryId))
    .where(eq(toolTypes.id, id))
    .limit(1);

  if (!type) notFound();

  const units = await db.select().from(toolUnits).where(eq(toolUnits.toolTypeId, id)).orderBy(toolUnits.assetCode);
  const available = units.filter((u) => u.status === "tersedia").length;
  const locationPath = await getLocationPath(type.primaryLocationId);

  const isPetugas = user.role === "petugas" || user.role === "admin";
  const tabs = [
    { key: "ringkasan", label: "Ringkasan" },
    { key: "unit", label: "Unit" },
    { key: "kelengkapan", label: "Kelengkapan" },
    { key: "pemeliharaan", label: "Pemeliharaan" },
    { key: "histori", label: "Histori" },
  ];

  const checklist = checklistFor(type.code);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <Panel bodyClassName="p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{type.categoryName}</p>
            <h1 className="font-display text-3xl font-bold text-ink">{type.name}</h1>
            <p className="font-num mt-1 text-sm text-muted">{type.code}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone={available > 0 ? "green" : "red"}>{available > 0 ? `${available} unit tersedia` : "Stok habis"}</Pill>
              <Pill tone="blue">{units.length} unit terdaftar</Pill>
              {type.requiresOutsideLetter && <Pill tone="amber">Perlu surat luar area</Pill>}
            </div>
          </div>
          {available > 0 ? (
            <LinkButton href={`/peminjaman/baru?jenis=${type.id}`} variant="secondary" size="lg">
              Pinjam Alat
            </LinkButton>
          ) : (
            <span className="tap-target inline-flex cursor-not-allowed items-center justify-center rounded border border-line bg-canvas px-5 py-3 text-base font-semibold text-muted">
              Stok Habis
            </span>
          )}
        </div>
      </Panel>

      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/katalog/${id}?tab=${t.key}`}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "ringkasan" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Spesifikasi" className="lg:col-span-2">
            <p className="text-sm text-ink">{type.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted"><Ruler size={13} /> Ukuran</dt>
                <dd className="mt-1 font-medium text-ink">{type.size}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted"><Tag size={13} /> Aturan Singkat</dt>
                <dd className="mt-1 font-medium text-ink">{type.rulesSummary}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Diagram Lokasi">
            <p className="flex items-start gap-2 text-sm text-ink">
              <MapPin size={16} className="mt-0.5 shrink-0 text-blue" />
              <span className="font-num">{locationPath}</span>
            </p>
          </Panel>
        </div>
      )}

      {tab === "unit" && (
        <Panel bodyClassName="overflow-x-auto p-0" title="Daftar Unit">
          {units.length === 0 ? (
            <div className="p-4"><EmptyState title="Belum ada unit terdaftar" /></div>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-canvas text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Kode Aset</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Kondisi</th>
                  {isPetugas && <th className="px-4 py-3">Aksi Cepat</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {units.map((u) => (
                  <tr key={u.id} className="hover:bg-canvas">
                    <td className="px-4 py-3">
                      <Link href={`/inventaris/${u.id}`} className="font-num font-medium text-ink hover:underline">
                        {u.assetCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge meta={unitStatusMeta[u.status]} />
                    </td>
                    <td className="px-4 py-3 text-muted">{u.condition}</td>
                    {isPetugas && (
                      <td className="px-4 py-3">
                        <Link href={`/inventaris/${u.id}`} className="text-xs font-semibold text-blue hover:underline">
                          Pindah / Inspeksi / Servis / Cetak Label
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {tab === "kelengkapan" && (
        <Panel title="Kelengkapan Standar" description="Checklist yang wajib diperiksa saat serah terima & pengembalian">
          <ul className="space-y-2">
            {checklist.map((c) => (
              <li key={c} className="flex items-center gap-2 rounded border border-line p-3 text-sm">
                <ClipboardCheck size={16} className="text-blue" /> {c}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {tab === "pemeliharaan" && <MaintenanceTab typeId={id} />}
      {tab === "histori" && <HistoryTab typeId={id} />}
    </div>
  );
}

async function MaintenanceTab({ typeId }: { typeId: string }) {
  const rows = await db
    .select({ order: maintenanceOrders, unitCode: toolUnits.assetCode })
    .from(maintenanceOrders)
    .innerJoin(toolUnits, eq(toolUnits.id, maintenanceOrders.unitId))
    .where(eq(toolUnits.toolTypeId, typeId))
    .orderBy(desc(maintenanceOrders.scheduledDate));

  return (
    <Panel title="Riwayat & Jadwal Pemeliharaan">
      {rows.length === 0 ? (
        <EmptyState icon={Wrench} title="Belum ada riwayat pemeliharaan" />
      ) : (
        <ul className="divide-y divide-line">
          {rows.map(({ order, unitCode }) => (
            <li key={order.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {order.action} <span className="font-num text-muted">· {unitCode}</span>
                </p>
                <p className="text-xs text-muted">Dijadwalkan {formatDateShort(order.scheduledDate)}</p>
              </div>
              <StatusBadge meta={maintenanceStatusMeta[order.status]} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

async function HistoryTab({ typeId }: { typeId: string }) {
  const rows = await db
    .select({ loan: loans, item: loanItems, borrower: users })
    .from(loanItems)
    .innerJoin(loans, eq(loans.id, loanItems.loanId))
    .innerJoin(users, eq(users.id, loans.userId))
    .where(eq(loanItems.toolTypeId, typeId))
    .orderBy(desc(loans.createdAt))
    .limit(15);

  return (
    <Panel title="Histori Peminjaman" description="Aktivitas peminjaman terakhir untuk jenis alat ini">
      {rows.length === 0 ? (
        <EmptyState icon={Repeat} title="Belum ada histori peminjaman" />
      ) : (
        <ul className="divide-y divide-line">
          {rows.map(({ loan, borrower }) => (
            <li key={loan.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 text-sm">
              <div>
                <Link href={`/peminjaman/${loan.id}`} className="font-num font-semibold hover:underline">{loan.trxNo}</Link>
                <p className="text-xs text-muted">{borrower.name} · {formatDateShort(loan.startDate)}</p>
              </div>
              <span className="text-xs text-muted">{loan.locationText}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
