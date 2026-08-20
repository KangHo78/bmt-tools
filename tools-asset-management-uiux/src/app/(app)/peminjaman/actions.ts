"use server";

import { db } from "@/db";
import { loans, loanItems, toolTypes, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, sql, and, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export interface SubmitLoanState {
  error?: string;
}

async function nextTrxNo() {
  const [row] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(loans);
  return `TRX-${1042 + row.count + 1}`;
}

export async function submitLoanRequest(_prev: SubmitLoanState, formData: FormData): Promise<SubmitLoanState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const toolTypeIds = formData.getAll("toolTypeId").map(String).filter(Boolean);
  const usageType = String(formData.get("usageType") ?? "dalam_area") as "dalam_area" | "luar_area";
  const purpose = String(formData.get("purpose") ?? "").trim();
  const locationText = String(formData.get("locationText") ?? "").trim();
  const startDateRaw = String(formData.get("startDate") ?? "");
  const dueDateRaw = String(formData.get("dueDate") ?? "");
  const letterUrl = String(formData.get("letterUrl") ?? "").trim();
  const agreement = formData.get("agreement");

  if (toolTypeIds.length === 0) return { error: "Pilih minimal satu jenis alat sebelum melanjutkan." };
  if (!purpose || !locationText || !startDateRaw || !dueDateRaw) {
    return { error: "Lengkapi tujuan, lokasi, dan tanggal penggunaan." };
  }
  if (usageType === "luar_area" && !letterUrl) {
    return { error: "Unggah surat tugas untuk peminjaman luar area." };
  }
  if (!agreement) {
    return { error: "Anda harus menyetujui pernyataan tanggung jawab sebelum mengirim." };
  }

  const uniqueTypes = Array.from(new Set(toolTypeIds));
  const tokensNeeded = uniqueTypes.length;
  const remaining = user.tokenQuota - user.tokenUsed;
  if (tokensNeeded > remaining) {
    return {
      error: `Token tidak cukup. Anda membutuhkan ${tokensNeeded} token namun hanya tersisa ${remaining}. Kembalikan alat aktif atau kurangi jenis alat pada keranjang.`,
    };
  }

  const trxNo = await nextTrxNo();
  const startDate = new Date(startDateRaw);
  const dueDate = new Date(dueDateRaw);

  const [loan] = await db
    .insert(loans)
    .values({
      trxNo,
      userId: user.id,
      usageType,
      purpose,
      locationText,
      startDate,
      dueDate,
      status: "menunggu_approval",
      letterUrl: letterUrl || null,
      tokensUsed: tokensNeeded,
    })
    .returning();

  await db.insert(loanItems).values(toolTypeIds.map((toolTypeId) => ({ loanId: loan.id, toolTypeId })));

  await db
    .update(users)
    .set({ tokenUsed: user.tokenUsed + tokensNeeded })
    .where(eq(users.id, user.id));

  revalidatePath("/dashboard");
  revalidatePath("/peminjaman");
  redirect(`/peminjaman/${loan.id}`);
}
