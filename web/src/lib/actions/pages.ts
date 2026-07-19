"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { RESERVED_SLUGS } from "@/lib/pageBlocks";
import { ValidationError } from "@/lib/validateFields";
import { validateTree } from "@/lib/nodes/validate";

export type PageActionState = { ok?: boolean; error?: string; savedAt?: number; id?: string };

type RawNodeShape = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style?: Record<string, unknown>;
  advanced?: Record<string, unknown>;
  children?: RawNodeShape[];
};

const nodeSchema: z.ZodType<RawNodeShape> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(40),
    type: z.string().min(1).max(40),
    props: z.record(z.string(), z.unknown()),
    style: z.record(z.string(), z.unknown()).optional(),
    advanced: z.record(z.string(), z.unknown()).optional(),
    children: z.array(nodeSchema).optional(),
  }),
);

const pageSchema = z.object({
  title: z.string().trim().min(1, "Give the page a title.").max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers, and hyphens only")
    .max(80),
  status: z.enum(["draft", "published"]),
  seoTitle: z.string().trim().max(200).default(""),
  seoDescription: z.string().trim().max(300).default(""),
  blocks: z.array(nodeSchema).max(120),
});

export async function savePage(id: string | null, data: unknown): Promise<PageActionState> {
  await requireAdmin();
  const parsed = pageSchema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: `${first?.path.join(".") || "page"}: ${first?.message ?? "invalid"}` };
  }
  const page = parsed.data;

  if (RESERVED_SLUGS.includes(page.slug)) {
    return { error: `The address /${page.slug} is reserved by the site — pick a different slug.` };
  }

  try {
    const blocks = validateTree(page.blocks);

    const clash = await db.page.findUnique({ where: { slug: page.slug } });
    if (clash && clash.id !== id) {
      return { error: `The address /${page.slug} is already used by "${clash.title}".` };
    }

    const payload = {
      title: page.title,
      slug: page.slug,
      status: page.status,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      blocks: blocks as unknown as Prisma.InputJsonValue,
    };

    let saved;
    if (id) {
      saved = await db.page.update({ where: { id }, data: payload });
    } else {
      saved = await db.page.create({ data: payload });
    }
    revalidatePath("/", "layout");
    return { ok: true, savedAt: Date.now(), id: saved.id };
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message };
    console.error("savePage", e);
    return { error: "Could not save the page — check the database is running and try again." };
  }
}

export async function deletePage(id: string): Promise<void> {
  await requireAdmin();
  await db.page.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/", "layout");
  redirect("/admin/pages");
}
