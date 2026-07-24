import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import JournalClient from "@/components/journal/JournalClient";
import { getBlock, getPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.journal");
  return pageMetadata({ seo: d.seo, title: "Journal", description: d.lede, path: "/journal" });
}

export default async function JournalPage() {
  const [d, posts] = await Promise.all([getBlock("page.journal"), getPosts()]);

  const cards = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    image: p.image,
    category: p.category,
    readingTime: p.readingTime,
    date: p.date,
    authorName: p.authorName,
  }));

  return (
    <>
      <PageHero eyebrow={d.eyebrow} title={d.title} lede={d.lede} image={d.image} imageAlt="" />

      <section className="section pt-16">
        <div className="shell">
          {posts.length === 0 ? (
            <p className="py-20 text-center text-[var(--muted)]">No articles published yet — add one in the admin.</p>
          ) : (
            <JournalClient posts={cards} />
          )}

          <Reveal className="mt-16">
            <Link href="/contact" className="group block overflow-hidden rounded-3xl border border-[var(--line)]">
              <div className="relative aspect-[8/3] w-full">
                <Image
                  src={d.bannerImage}
                  alt={d.bannerAlt}
                  fill
                  sizes="(max-width:1440px) 100vw, 1440px"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
                />
              </div>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
