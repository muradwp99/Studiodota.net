"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin, requireOwner } from "@/lib/auth";

export type UserActionState = { ok?: boolean; error?: string };
export type UserRow = { id: string; name: string; email: string; role: string; createdAt: Date };

const roleSchema = z.enum(["admin", "editor"]);

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

/* ---- owner-only user management ---- */

export async function listUsers(): Promise<UserRow[]> {
  await requireOwner();
  return db.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Enter a display name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email.").max(200),
  password: z.string().min(10, "Password must be at least 10 characters.").max(200),
  role: roleSchema,
});

export async function createUser(input: unknown): Promise<UserActionState> {
  await requireOwner();
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  try {
    const clash = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (clash) return { error: "That email is already in use." };
    await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        role: parsed.data.role,
      },
    });
    return { ok: true };
  } catch (e) {
    console.error("createUser", e);
    return { error: "Could not create the user." };
  }
}

export async function updateUserRole(id: string, role: unknown): Promise<UserActionState> {
  await requireOwner();
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { error: "Invalid role." };
  try {
    const target = await db.user.findUnique({ where: { id } });
    if (!target) return { error: "User not found." };
    if (target.role === "admin" && parsed.data === "editor") {
      const adminCount = await db.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) return { error: "Can't demote the last admin — promote someone else first." };
    }
    await db.user.update({ where: { id }, data: { role: parsed.data } });
    return { ok: true };
  } catch (e) {
    console.error("updateUserRole", e);
    return { error: "Could not update the role." };
  }
}

export async function deleteUser(id: string): Promise<UserActionState> {
  const me = await requireOwner();
  if (id === me.id) return { error: "You can't remove your own account." };
  try {
    const target = await db.user.findUnique({ where: { id } });
    if (!target) return { error: "User not found." };
    if (target.role === "admin") {
      const adminCount = await db.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) return { error: "Can't remove the last admin." };
    }
    await db.user.delete({ where: { id } });
    return { ok: true };
  } catch (e) {
    console.error("deleteUser", e);
    return { error: "Could not remove the user." };
  }
}
