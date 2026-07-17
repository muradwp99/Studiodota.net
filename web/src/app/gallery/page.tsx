import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import GalleryClient from "@/components/gallery/GalleryClient";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "A gallery of Studiodota's architecture and interior work — photography and film across residential, commercial, and institutional projects.",
};

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="A closer look at the work."
        lede="Photography and film from across the practice — filter by discipline, or take in everything at once."
        image="/media/renders/interior.jpg"
        imageAlt="Interior render from a Studiodota project"
      />
      <GalleryClient />
    </>
  );
}
