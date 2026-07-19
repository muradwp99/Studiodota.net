import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getBlock } from "@/lib/content";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import type { PageBlock } from "@/lib/pageBlocks";

export async function generateStaticParams() {
  try {
    const pages = await db.page.findMany({ where: { status: "published" }, select: { slug: true } });
    return pages.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await db.page.findUnique({ where: { slug } }).catch(() => null);
  if (!page) return { title: "Page not found" };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
    robots: page.status === "published" ? undefined : { index: false, follow: false },
  };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page, contact] = await Promise.all([
    db.page.findFirst({ where: { slug, status: "published" } }).catch(() => null),
    getBlock("page.contact"),
  ]);
  if (!page) notFound();

  const blocks = (Array.isArray(page.blocks) ? page.blocks : []) as PageBlock[];
  // A leading hero block carries the dark nav + full-bleed top itself; other
  // first blocks need clearance under the fixed navbar.
  const startsWithHero = blocks[0]?.type === "hero";

  return (
    <div className={startsWithHero ? "" : "pt-28 md:pt-32"}>
      <BlockRenderer blocks={blocks} ctx={{ serviceOptions: contact.serviceOptions }} />
    </div>
  );
}
