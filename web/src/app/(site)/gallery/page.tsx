import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import GalleryClient from "@/components/gallery/GalleryClient";
import { getBlock, getGalleryItems } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.gallery");
  return pageMetadata({ title: d.seoTitle || "Gallery", description: d.seoDescription || d.lede, image: d.ogImage, path: "/gallery", noindex: d.noindex });
}

export default async function GalleryPage() {
  const [d, items] = await Promise.all([getBlock("page.gallery"), getGalleryItems()]);

  return (
    <>
      <PageHero eyebrow={d.eyebrow} title={d.title} lede={d.lede} image={d.image} imageAlt="" />
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
