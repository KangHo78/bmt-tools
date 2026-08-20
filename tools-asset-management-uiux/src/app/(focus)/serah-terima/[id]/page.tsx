import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { loans, loanItems, toolTypes, toolUnits, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { FocusHeader } from "@/components/layout/FocusHeader";
import { HandoverFlow } from "./HandoverFlow";
import { checklistFor } from "@/lib/checklist";
import { EmptyState } from "@/components/ui/States";

export const dynamic = "force-dynamic";

export default async function SerahTerimaPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !["petugas", "admin"].includes(user.role)) redirect("/login");

  const { id } = await params;
  const [row] = await db
    .select({ loan: loans, borrower: users })
    .from(loans)
    .innerJoin(users, eq(users.id, loans.userId))
    .where(eq(loans.id, id))
    .limit(1);
  if (!row) notFound();
  const { loan, borrower } = row;

  if (!["disetujui", "menunggu_serah_terima"].includes(loan.status)) {
    return (
      <div>
        <FocusHeader backHref={`/peminjaman/${id}`} title="Serah Terima" subtitle={loan.trxNo} />
        <div className="p-4">
          <EmptyState title="Tidak dapat diproses" description={`Transaksi berstatus "${loan.status}" tidak berada pada tahap serah terima.`} />
        </div>
      </div>
    );
  }

  const items = await db
    .select({ item: loanItems, type: toolTypes })
    .from(loanItems)
    .innerJoin(toolTypes, eq(toolTypes.id, loanItems.toolTypeId))
    .where(eq(loanItems.loanId, id));

  const flowItems = [];
  for (const { item, type } of items) {
    const availableUnits = await db
      .select({ id: toolUnits.id, assetCode: toolUnits.assetCode })
      .from(toolUnits)
      .where(and(eq(toolUnits.toolTypeId, type.id), eq(toolUnits.status, "tersedia")));
    flowItems.push({
      itemId: item.id,
      toolTypeId: type.id,
      toolName: type.name,
      checklist: checklistFor(type.code),
      availableUnits,
    });
  }

  return (
    <div>
      <FocusHeader backHref={`/peminjaman/${id}`} title="Serah Terima" subtitle={`${loan.trxNo} · ${borrower.name}`} />
      <HandoverFlow loanId={id} items={flowItems} />
    </div>
  );
}
