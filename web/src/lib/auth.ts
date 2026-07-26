import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const COOKIE = "sd_admin";
const SESSION_DAYS = 30;

/* ---- login rate limiting (per process; single-admin scale) ---- */
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

export async function clientKey(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "local").split(",")[0].trim();
}

export function loginBlocked(key: string): boolean {
  const a = attempts.get(key);
  if (!a) return false;
  if (Date.now() > a.resetAt) {
    attempts.delete(key);
    return false;
  }
  return a.count >= MAX_ATTEMPTS;
}

export function recordLoginFailure(key: string) {
  const a = attempts.get(key);
  if (!a || Date.now() > a.resetAt) {
    attempts.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
  } else {
    a.count += 1;
  }
}

/* ---- sessions ---- */

export async function verifyCredentials(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    // Constant-ish time: hash anyway so missing users cost the same as wrong passwords.
    await bcrypt.compare(password, "$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZfbhVXnP0dLmiSExRs1/2wKKC.EPT6");
    return null;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { token, userId, expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export const getAdmin = cache(async () => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const session = await db.session.findUnique({ where: { token }, include: { user: true } });
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      await db.session.delete({ where: { token } }).catch(() => {});
      return null;
    }
    return session.user;
  } catch {
    return null;
  }
});

/** Guard for admin pages/actions. Redirects to the login screen when signed out. */
export async function requireAdmin() {
  const user = await getAdmin();
  if (!user) redirect("/admin/login");
  return user;
}

/**
 * Guard for owner-only pages/actions (Users, Settings, Plugins, Appearance).
 * Same as requireAdmin(), but editors are bounced to the dashboard instead of let through.
 */
export async function requireOwner() {
  const user = await requireAdmin();
  if (user.role !== "admin") redirect("/admin");
  return user;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { token } }).catch(() => {});
  jar.delete(COOKIE);
}
