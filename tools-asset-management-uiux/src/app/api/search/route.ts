import { db } from "@/db";
import { toolTypes, toolUnits, loans, users, locations } from "@/db/schema";
import { ilike, or, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ groups: [] }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return Response.json({ groups: [] });

  const like = `%${q}%`;

  const [types, units, trxs, locs] = await Promise.all([
    db
      .select({ id: toolTypes.id, name: toolTypes.name, code: toolTypes.code })
      .from(toolTypes)
      .where(or(ilike(toolTypes.name, like), ilike(toolTypes.code, like)))
      .limit(5),
    db
      .select({ id: toolUnits.id, assetCode: toolUnits.assetCode, toolTypeId: toolUnits.toolTypeId })
      .from(toolUnits)
      .where(ilike(toolUnits.assetCode, like))
      .limit(5),
    db
      .select({ id: loans.id, trxNo: loans.trxNo, purpose: loans.purpose })
      .from(loans)
      .leftJoin(users, sql`${loans.userId} = ${users.id}`)
      .where(or(ilike(loans.trxNo, like), ilike(users.name, like), ilike(loans.purpose, like)))
      .limit(5),
    db
      .select({ id: locations.id, name: locations.name, type: locations.type })
      .from(locations)
      .where(ilike(locations.name, like))
      .limit(5),
  ]);

  const groups = [
    {
      label: "Jenis Alat",
      items: types.map((t) => ({ id: t.id, title: t.name, subtitle: t.code, href: `/katalog/${t.id}` })),
    },
    {
      label: "Unit Aset",
      items: units.map((u) => ({ id: u.id, title: u.assetCode, subtitle: "Unit aset", href: `/inventaris/${u.id}` })),
    },
    {
      label: "Transaksi",
      items: trxs.map((t) => ({ id: t.id, title: t.trxNo, subtitle: t.purpose, href: `/peminjaman/${t.id}` })),
    },
    {
      label: "Lokasi",
      items: locs.map((l) => ({ id: l.id, title: l.name, subtitle: l.type, href: `/lokasi?focus=${l.id}` })),
    },
  ].filter((g) => g.items.length > 0);

  return Response.json({ groups });
}
