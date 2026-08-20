import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { toolTypes, toolUnits } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { LoanStepper } from "./LoanStepper";

export const dynamic = "force-dynamic";

export default async function NewLoanPage({ searchParams }: { searchParams: Promise<{ jenis?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { jenis } = await searchParams;

  const rows = await db
    .select({
      id: toolTypes.id,
      name: toolTypes.name,
      code: toolTypes.code,
      requiresOutsideLetter: toolTypes.requiresOutsideLetter,
      available: sql<number>`count(*) filter (where ${toolUnits.status} = 'tersedia')`.mapWith(Number),
    })
    .from(toolTypes)
    .leftJoin(toolUnits, eq(toolUnits.toolTypeId, toolTypes.id))
    .groupBy(toolTypes.id)
    .orderBy(toolTypes.name);

  const available = rows.filter((r) => r.available > 0);
  const tokenAvailable = user.tokenQuota - user.tokenUsed;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Form Permohonan</p>
        <h1 className="font-display text-3xl font-bold text-ink">Ajukan Peminjaman Alat</h1>
      </div>
      <LoanStepper toolTypes={available} tokenAvailable={tokenAvailable} preselectId={jenis} />
    </div>
  );
}
