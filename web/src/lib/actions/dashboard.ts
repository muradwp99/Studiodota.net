"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdmin, requireAdmin } from "@/lib/auth";
import { getBlock } from "@/lib/content";

export type QuickDraftState = { ok?: boolean; error?: string; id?: string };

const schema = z.object({
  title: z.string().trim().min(1, "Give the draft a title.").max(200),
  content: z.string().trim().max(3000).default(""),
});

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "draft";

export async function quickDraft(input: unknown): Promise<QuickDraftState> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the draft." };
  const { title, content } = parsed.data;

  try {
    let slug = slugify(title);
    for (let n = 2; await db.post.findUnique({ where: { slug } }); n++) {
      slug = `${slugify(title)}-${n}`;
    }
    const user = await getAdmin();
    const { postCategories } = await getBlock("taxonomies");
    const body = content || title;

    const post = await db.post.create({
      data: {
        slug,
        title,
        excerpt: body.slice(0, 160),
        category: postCategories[0] ?? "Notes",
        date: new Date().toISOString().slice(0, 10),
        readingTime: 3,
        image: "/media/renders/interior.jpg",
        inlineImage: "",
        authorName: user?.name ?? "Studiodota",
        authorRole: "Studiodota",
        intro: body,
        sections: [{ id: "notes", heading: "Notes", body: [body] }] as unknown as Prisma.InputJsonValue,
        published: false,
      },
    });
    revalidatePath("/", "layout");
    return { ok: true, id: post.id };
  } catch (e) {
    console.error("quickDraft", e);
    return { error: "Could not create the draft." };
  }
}
