import { db } from "@/db";
import { toolUnits, loans } from "@/db/schema";
import { ilike } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") ?? "").trim();
  if (!code) return Response.json({ found: false });

  const unitRows = await db.select().from(toolUnits).where(ilike(toolUnits.assetCode, code)).limit(1);
  if (unitRows[0]) {
    return Response.json({ found: true, type: "unit", href: `/inventaris/${unitRows[0].id}`, label: unitRows[0].assetCode });
  }

  const trxRows = await db.select().from(loans).where(ilike(loans.trxNo, code)).limit(1);
  if (trxRows[0]) {
    return Response.json({ found: true, type: "loan", href: `/peminjaman/${trxRows[0].id}`, label: trxRows[0].trxNo });
  }

  return Response.json({ found: false });
}
