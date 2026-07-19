"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type UserActionState = { ok?: boolean; error?: string };

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter a display name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email.").max(200),
});

export async function updateProfile(input: unknown): Promise<UserActionState> {
  const user = await requireAdmin();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the profile." };
  try {
    const clash = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (clash && clash.id !== user.id) return { error: "That email is used by another account." };
    await db.user.update({ where: { id: user.id }, data: parsed.data });
    return { ok: true };
  } catch (e) {
    console.error("updateProfile", e);
    return { error: "Could not update the profile." };
  }
}

const passwordSchema = z.object({
  current: z.string().min(1, "Enter your current password.").max(200),
  next: z.string().min(10, "New password must be at least 10 characters.").max(200),
});

export async function changePassword(input: unknown): Promise<UserActionState> {
  const user = await requireAdmin();
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the passwords." };
  try {
    const row = await db.user.findUnique({ where: { id: user.id } });
    if (!row || !(await bcrypt.compare(parsed.data.current, row.passwordHash))) {
      return { error: "Current password is incorrect." };
    }
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.next, 12) },
    });
    return { ok: true };
  } catch (e) {
    console.error("changePassword", e);
    return { error: "Could not change the password." };
  }
}
