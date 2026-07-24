import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getBlock } from "@/lib/content";
import PageBuilder from "@/components/admin/PageBuilder";
import { normalizeTree } from "@/lib/nodes/normalize";

export const metadata = { title: "Edit Page" };

export default async function EditBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [page, contact] = await Promise.all([
    db.page.findUnique({ where: { id } }),
    getBlock("page.contact"),
  ]);
  if (!page) notFound();

  return (
    <PageBuilder
      id={page.id}
      initial={{
        title: page.title,
        slug: page.slug,
        status: page.status,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        blocks: normalizeTree(page.blocks),
      }}
      serviceOptions={contact.serviceOptions}
    />
  );
}
