"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Identitas dan kata sandi wajib diisi." };
  }

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];

  const genericError = "Identitas atau kata sandi salah. Periksa kembali dan coba lagi.";

  if (!user) {
    return { error: genericError };
  }

  const valid = verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: genericError };
  }

  await createSession(user.id);
  redirect("/dashboard");
}
