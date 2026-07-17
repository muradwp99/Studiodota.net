"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  verifyCredentials,
  createSession,
  destroySession,
  clientKey,
  loginBlocked,
  recordLoginFailure,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const key = await clientKey();
  if (loginBlocked(key)) {
    return { error: "Too many attempts. Wait 10 minutes and try again." };
  }
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter your email and password." };

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    recordLoginFailure(key);
    return { error: "That email and password don't match." };
  }
  await createSession(user.id);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
