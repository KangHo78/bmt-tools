"use server";

import { db } from "@/db";
import { loans, loanItems, toolUnits, users, notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireRole(roles: string[]) {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) {
    throw new Error("Anda tidak memiliki hak akses untuk tindakan ini.");
  }
  return user;
}

export async function approveLoan(formData: FormData) {
  const approver = await requireRole(["kepala_logistik", "admin"]);
  const loanId = String(formData.get("loanId"));
  const dueDateOverride = String(formData.get("dueDate") ?? "");

  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");

  await db
    .update(loans)
    .set({
      status: "disetujui",
      approvedById: approver.id,
      approvedAt: new Date(),
      dueDate: dueDateOverride ? new Date(dueDateOverride) : loan.dueDate,
    })
    .where(eq(loans.id, loanId));

  await db.insert(notifications).values({
    userId: loan.userId,
    category: "informasi",
    title: `Permohonan ${loan.trxNo} disetujui`,
    description: `Permohonan Anda disetujui hingga ${(dueDateOverride ? new Date(dueDateOverride) : loan.dueDate).toLocaleDateString("id-ID")}. Lakukan serah terima di Tool Room.`,
    objectType: "loan",
    objectId: loan.id,
    href: `/peminjaman/${loan.id}`,
  });

  revalidatePath("/approval");
  revalidatePath(`/peminjaman/${loanId}`);
  revalidatePath(`/approval/${loanId}`);
}

export async function rejectLoan(formData: FormData) {
  const approver = await requireRole(["kepala_logistik", "admin"]);
  const loanId = String(formData.get("loanId"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Alasan penolakan wajib diisi.");

  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");

  await db.update(loans).set({ status: "ditolak", rejectionReason: reason, approvedById: approver.id }).where(eq(loans.id, loanId));

  const [borrower] = await db.select().from(users).where(eq(users.id, loan.userId)).limit(1);
  if (borrower) {
    await db.update(users).set({ tokenUsed: Math.max(0, borrower.tokenUsed - loan.tokensUsed) }).where(eq(users.id, borrower.id));
  }

  await db.insert(notifications).values({
    userId: loan.userId,
    category: "informasi",
    title: `Permohonan ${loan.trxNo} ditolak`,
    description: `Alasan: ${reason}`,
    objectType: "loan",
    objectId: loan.id,
    href: `/peminjaman/${loan.id}`,
  });

  revalidatePath("/approval");
  revalidatePath(`/peminjaman/${loanId}`);
}

export async function completeHandover(formData: FormData) {
  await requireRole(["petugas", "admin"]);
  const loanId = String(formData.get("loanId"));
  const handoverPhotoUrl = String(formData.get("handoverPhotoUrl") ?? "");

  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");

  const items = await db.select().from(loanItems).where(eq(loanItems.loanId, loanId));

  for (const item of items) {
    if (item.unitId) continue;
    const [unit] = await db
      .select()
      .from(toolUnits)
      .where(and(eq(toolUnits.toolTypeId, item.toolTypeId), eq(toolUnits.status, "tersedia")))
      .limit(1);
    if (unit) {
      await db.update(toolUnits).set({ status: "dipinjam" }).where(eq(toolUnits.id, unit.id));
      await db.update(loanItems).set({ unitId: unit.id, conditionOut: "baik" }).where(eq(loanItems.id, item.id));
    }
  }

  await db
    .update(loans)
    .set({ status: "berjalan", handoverAt: new Date(), handoverPhotoUrl: handoverPhotoUrl || null })
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
  redirect(`/peminjaman/${loanId}`);
}

export async function extendLoan(formData: FormData) {
  await requireRole(["petugas", "kepala_logistik", "admin"]);
  const loanId = String(formData.get("loanId"));
  const newDueDate = String(formData.get("newDueDate"));
  if (!newDueDate) throw new Error("Tanggal tenggat baru wajib diisi.");

  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");

  await db
    .update(loans)
    .set({ dueDate: new Date(newDueDate), status: loan.status === "terlambat" ? "berjalan" : loan.status })
    .where(eq(loans.id, loanId));

  await db.insert(notifications).values({
    userId: loan.userId,
    category: "informasi",
    title: `Tenggat ${loan.trxNo} diperpanjang`,
    description: `Tenggat baru: ${new Date(newDueDate).toLocaleDateString("id-ID")}.`,
    objectType: "loan",
    objectId: loan.id,
    href: `/peminjaman/${loan.id}`,
  });

  revalidatePath(`/peminjaman/${loanId}`);
}

export async function remindBorrower(formData: FormData) {
  await requireRole(["petugas", "kepala_logistik", "admin"]);
  const loanId = String(formData.get("loanId"));
  const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);
  if (!loan) throw new Error("Peminjaman tidak ditemukan.");

  await db.insert(notifications).values({
    userId: loan.userId,
    category: "perlu_tindakan",
    title: `Pengingat pengembalian ${loan.trxNo}`,
    description: `Segera kembalikan alat. Tenggat: ${loan.dueDate.toLocaleDateString("id-ID")}.`,
    objectType: "loan",
    objectId: loan.id,
    href: `/peminjaman/${loan.id}`,
  });

  revalidatePath(`/peminjaman/${loanId}`);
  revalidatePath("/notifikasi");
}

