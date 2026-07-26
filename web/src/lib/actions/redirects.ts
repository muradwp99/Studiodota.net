"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";

export type RedirectState = { ok?: boolean; error?: string };

const schema = z.object({
  from: z.string().trim().regex(/^\/[^\s]*$/, "From must start with /").max(400),
  to: z.string().trim().min(1).max(400).refine((v) => v.startsWith("/") || v.startsWith("http"), "To must start with / or http"),
  permanent: z.boolean().default(true),
});

export async function saveRedirect(data: unknown): Promise<RedirectState> {
  await requireOwner();
  const p = schema.safeParse(data);
  if (!p.success) return { error: p.error.issues[0]?.message ?? "Invalid redirect." };
  const from = p.data.from.replace(/\/+$/, "") || "/";
  if (from === p.data.to.replace(/\/+$/, "")) return { error: "A redirect can't point to itself." };
  try {
    await db.redirect.upsert({
      where: { from },
      update: { to: p.data.to, permanent: p.data.permanent },
      create: { from, to: p.data.to, permanent: p.data.permanent },
    });
    revalidatePath("/admin/settings/redirects");
    return { ok: true };
  } catch {
    return { error: "Could not save — is the database running?" };
  }
}

export async function deleteRedirect(id: string): Promise<RedirectState> {
  await requireOwner();
  try {
    await db.redirect.delete({ where: { id } });
    revalidatePath("/admin/settings/redirects");
    return { ok: true };
  } catch {
    return { error: "Could not delete the redirect." };
  }
}
