"use server";

import { db } from "@/db";
import { loans, loanItems, toolUnits, notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface HandoverState {
  error?: string;
}

export async function completeHandoverWithUnits(_prev: HandoverState, formData: FormData): Promise<HandoverState> {
  const user = await getCurrentUser();
  if (!user || !["petugas", "admin"].includes(user.role)) {
    return { error: "Anda tidak memiliki hak akses untuk menyerahkan alat." };
  }

  const loanId = String(formData.get("loanId"));
  const itemIds = formData.getAll("itemId").map(String);
  const unitCodes = formData.getAll("unitCode").map(String);
  const confirmStaff = formData.get("confirmStaff");
  const confirmBorrower = formData.get("confirmBorrower");
  const handoverPhotoRaw = String(formData.get("handoverPhoto") ?? "[]");

  if (!confirmStaff || !confirmBorrower) {
    return { error: "Konfirmasi kedua pihak (petugas dan peminjam) wajib dicentang sebelum menyelesaikan serah terima." };
  }

  const assignments: { itemId: string; code: string }[] = itemIds.map((itemId, idx) => ({ itemId, code: unitCodes[idx]?.trim() ?? "" }));

  if (assignments.some((a) => !a.code)) {
    return { error: "Setiap alat harus dicocokkan dengan kode unit terlebih dahulu. Pindai atau masukkan kode secara manual." };
  }

  const codes = assignments.map((a) => a.code);
  const duplicates = codes.filter((c, idx) => codes.indexOf(c) !== idx);
  if (duplicates.length > 0) {
    return { error: `Kode unit duplikat terdeteksi: ${Array.from(new Set(duplicates)).join(", ")}. Setiap unit hanya boleh dipindai sekali.` };
  }

  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
  if (!loan) return { error: "Peminjaman tidak ditemukan." };

  const items = await db.select().from(loanItems).where(eq(loanItems.loanId, loanId));

  for (const a of assignments) {
    const item = items.find((i) => i.id === a.itemId);
    if (!item) return { error: "Data alat tidak sinkron. Muat ulang halaman dan coba lagi." };

    const [unit] = await db.select().from(toolUnits).where(eq(toolUnits.assetCode, a.code)).limit(1);
    if (!unit) return { error: `Kode unit "${a.code}" tidak ditemukan. Periksa kembali kode aset.` };
    if (unit.toolTypeId !== item.toolTypeId) {
      return { error: `Unit "${a.code}" bukan jenis alat yang sesuai untuk item ini. Pindai unit yang benar.` };
    }
    if (unit.status !== "tersedia") {
      return { error: `Unit "${a.code}" berstatus "${unit.status}" dan tidak dapat diserahkan.` };
    }
  }

  let handoverPhotoUrl: string | null = null;
  try {
    const parsed = JSON.parse(handoverPhotoRaw) as { url: string }[];
    handoverPhotoUrl = parsed[0]?.url ?? null;
  } catch {
    handoverPhotoUrl = null;
  }

  for (const a of assignments) {
    const item = items.find((i) => i.id === a.itemId)!;
    const [unit] = await db.select().from(toolUnits).where(eq(toolUnits.assetCode, a.code)).limit(1);
    if (!unit) continue;

    const checklistKeys = formData.getAll(`checklist_${item.id}`).map(String);
    const checklistObj: Record<string, boolean> = {};
    for (const k of checklistKeys) checklistObj[k] = true;

    await db
      .update(loanItems)
      .set({ unitId: unit.id, conditionOut: "baik", checklist: checklistObj })
      .where(eq(loanItems.id, item.id));
    await db.update(toolUnits).set({ status: "dipinjam" }).where(eq(toolUnits.id, unit.id));
  }

  await db
    .update(loans)
    .set({ status: "berjalan", handoverAt: new Date(), handoverPhotoUrl })
    .where(eq(loans.id, loanId));

  await db.insert(notifications).values({
    userId: loan.userId,
    category: "informasi",
    title: `Serah terima ${loan.trxNo} selesai`,
    description: `Alat telah diserahkan. Tenggat pengembalian: ${loan.dueDate.toLocaleDateString("id-ID")}.`,
    objectType: "loan",
    objectId: loan.id,
    href: `/peminjaman/${loan.id}`,
  });

  revalidatePath(`/peminjaman/${loanId}`);
  revalidatePath("/dashboard");
  redirect(`/peminjaman/${loanId}`);
}
