import { db } from "@/db";
import { loans, loanItems, toolTypes, users, notifications } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

export async function getTokenSummary(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { used: 0, total: 0, detail: [] as { label: string; count: number }[] };

  const rows = await db
    .select({ typeName: toolTypes.name, loanId: loans.id })
    .from(loans)
    .innerJoin(loanItems, eq(loanItems.loanId, loans.id))
    .innerJoin(toolTypes, eq(toolTypes.id, loanItems.toolTypeId))
    .where(
      and(
        eq(loans.userId, userId),
        sql`${loans.status} in ('disetujui','menunggu_serah_terima','berjalan','menunggu_inspeksi','terlambat')`
      )
    );

  const byType = new Set<string>();
  for (const r of rows) byType.add(r.typeName);

  // Token rule: 1 token per distinct tool type actively borrowed
  const detail = Array.from(byType).map((label) => ({ label, count: 1 }));

  return { used: user.tokenUsed, total: user.tokenQuota, detail };
}

export async function getUnreadNotificationCount(userId: string) {
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return rows.length;
}

export async function getNextDeadlineLoan(userId: string) {
  const rows = await db
    .select()
    .from(loans)
    .where(
      and(
        eq(loans.userId, userId),
        sql`${loans.status} in ('berjalan','menunggu_inspeksi','terlambat')`
      )
    )
    .orderBy(loans.dueDate)
    .limit(1);
  return rows[0] ?? null;
}

export function generateTrxNo(seed: number) {
  return `TRX-${1000 + seed}`;
}

export function generateAssetCode(prefix: string, seed: number) {
  return `${prefix}-2026-${String(seed).padStart(4, "0")}`;
}

export const activeLoanStatuses = ["berjalan", "menunggu_inspeksi", "terlambat"] as const;
export const pendingApprovalStatuses = ["menunggu_approval"] as const;
