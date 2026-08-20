import Link from "next/link";
import { db } from "@/db";
import { toolTypes, toolUnits, categories, locations } from "@/db/schema";
import { eq, sql, and, ilike } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { EmptyState, NoResultsState } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Badge";
import { PackageSearch, MapPin, LayoutGrid, Rows3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function KatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string; view?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const kategoriFilter = params.kategori ?? "";
  const view = params.view === "tabel" ? "tabel" : user.role === "user" ? "grid" : "tabel";

  const allCategories = await db.select().from(categories);

  const conditions = [];
  if (q) conditions.push(sql`(${ilike(toolTypes.name, `%${q}%`)} or ${ilike(toolTypes.code, `%${q}%`)})`);
  if (kategoriFilter) conditions.push(eq(toolTypes.categoryId, kategoriFilter));

  const rows = await db
    .select({
      id: toolTypes.id,
      name: toolTypes.name,
      code: toolTypes.code,
      rulesSummary: toolTypes.rulesSummary,
      categoryName: categories.name,
      locationName: locations.name,
      total: sql<number>`count(${toolUnits.id})`.mapWith(Number),
      available: sql<number>`count(*) filter (where ${toolUnits.status} = 'tersedia')`.mapWith(Number),
    })
    .from(toolTypes)
    .leftJoin(toolUnits, eq(toolUnits.toolTypeId, toolTypes.id))
    .leftJoin(categories, eq(categories.id, toolTypes.categoryId))
    .leftJoin(locations, eq(locations.id, toolTypes.primaryLocationId))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(toolTypes.id, categories.name, locations.name)
    .orderBy(toolTypes.name);

  const totalTypesInSystem = await db.select({ id: toolTypes.id }).from(toolTypes);
  const hasAnyFilter = Boolean(q || kategoriFilter);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Katalog Alat</p>
          <h1 className="font-display text-3xl font-bold text-ink">Jenis Alat &amp; Ketersediaan</h1>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/katalog?view=grid" variant={view === "grid" ? "primary" : "outline"} size="sm" icon={<LayoutGrid size={15} />}>
            Grid
          </LinkButton>
          <LinkButton href="/katalog?view=tabel" variant={view === "tabel" ? "primary" : "outline"} size="sm" icon={<Rows3 size={15} />}>
            Tabel
          </LinkButton>
        </div>
      </div>

      <Panel bodyClassName="p-4">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center" action="/katalog">
          <input type="hidden" name="view" value={view} />
          <div className="flex flex-1 items-center gap-2 rounded border border-line bg-canvas px-3 py-2.5">
            <PackageSearch size={16} className="text-muted" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari nama alat atau kode jenis... (mis. Bor Tangan / TWL-DRL)"
              className="tap-target w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          <select name="kategori" defaultValue={kategoriFilter} className="tap-target rounded border border-line bg-surface px-3 py-2.5 text-sm">
            <option value="">Semua kategori</option>
            {allCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" className="tap-target rounded bg-ink px-5 py-2.5 text-sm font-semibold text-canvas">
            Terapkan
          </button>
        </form>
      </Panel>

      {rows.length === 0 ? (
        totalTypesInSystem.length === 0 ? (
          <EmptyState title="Belum ada jenis alat terdaftar" description="Tambahkan jenis alat melalui Administrasi atau Inventaris." />
        ) : hasAnyFilter ? (
          <NoResultsState onReset={<LinkButton href="/katalog" variant="outline" size="sm">Hapus Filter</LinkButton>} />
        ) : (
          <EmptyState title="Tidak ada data" />
        )
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((t) => (
            <Link key={t.id} href={`/katalog/${t.id}`} className="panel flex flex-col overflow-hidden transition-colors hover:border-ink">
              <div className="flex h-32 items-center justify-center bg-canvas font-display text-4xl font-bold text-line">{t.code.split("-")[1]}</div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold leading-tight text-ink">{t.name}</h3>
                  <Pill tone={t.available > 0 ? "green" : "red"}>{t.available > 0 ? "Tersedia" : "Habis"}</Pill>
                </div>
                <p className="font-num text-xs text-muted">{t.code}</p>
                <p className="font-num text-sm font-semibold text-ink">
                  {t.available}/{t.total} unit tersedia
                </p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <MapPin size={12} /> {t.locationName ?? "Lokasi belum ditentukan"}
                </p>
                <p className="mt-auto line-clamp-2 border-t border-line pt-2 text-xs text-muted">{t.rulesSummary}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Panel bodyClassName="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="sticky top-0 bg-canvas text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Jenis Alat</th>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Lokasi Utama</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">Aturan Singkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-canvas">
                  <td className="px-4 py-3">
                    <Link href={`/katalog/${t.id}`} className="font-medium text-ink hover:underline">
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-num text-muted">{t.code}</td>
                  <td className="px-4 py-3 text-muted">{t.categoryName}</td>
                  <td className="px-4 py-3 text-muted">{t.locationName}</td>
                  <td className="px-4 py-3">
                    <Pill tone={t.available > 0 ? "green" : "red"}>
                      {t.available}/{t.total}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{t.rulesSummary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
