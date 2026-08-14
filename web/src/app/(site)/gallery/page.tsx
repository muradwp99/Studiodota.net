import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import GalleryClient from "@/components/gallery/GalleryClient";
import { getBlock, getGalleryItems } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

/**
 * The gallery is currently a draft: `page.gallery.published` is false, so the
 * route 404s and is kept out of the nav, the footer and the sitemap. The page
 * and its content are intact - flip the flag in admin to bring it back.
 */
export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.gallery");
  if ((d as { published?: boolean }).published === false) {
    return { title: "Page not found", robots: { index: false, follow: false } };
  }
  return pageMetadata({ seo: d.seo, title: "Gallery", description: d.lede, path: "/gallery" });
}

export default async function GalleryPage() {
  const [d, items] = await Promise.all([getBlock("page.gallery"), getGalleryItems()]);
  if ((d as { published?: boolean }).published === false) notFound();

  return (
    <>
      <PageHero eyebrow={d.eyebrow} pageName="Gallery" lede={d.lede} image={d.image} imageAlt="" video="/media/gallery-hero.mp4" />
      <GalleryClient
        items={items.map((it) => ({
          id: it.id,
          title: it.title,
          sector: it.sector,
          image: it.image,
          category: it.category,
          type: it.type,
          youtubeId: it.youtubeId,
          tall: it.tall,
        }))}
      />
    </>
  );
}
