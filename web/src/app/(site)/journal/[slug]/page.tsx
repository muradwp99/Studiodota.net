import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import ScrollHighlightText from "@/components/ScrollHighlightText";
import LineMask from "@/components/motion/LineMask";
import ImageReveal from "@/components/motion/ImageReveal";
import { ParallaxImage } from "@/components/Parallax";
import { getPost, getPosts } from "@/lib/content";
import { pageMetadata, type SeoBlob } from "@/lib/seo";

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article not found" };
  return pageMetadata({
    seo: post.seo as SeoBlob,
    title: post.title,
    description: post.excerpt,
    image: post.image,
    path: `/journal/${slug}`,
    type: "article",
  });
}

type PostSection = { id: string; heading: string; body: string[] };

const initials = (name: string) => name.split(" ").map((w) => w[0]).join("");
function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const all = await getPosts();
  const related = all.filter((p) => p.slug !== post.slug).slice(0, 3);
  const sections = (Array.isArray(post.sections) ? post.sections : []) as PostSection[];

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: `https://studiodota.net${post.image}`,
    datePublished: post.date,
    author: { "@type": "Person", name: post.authorName },
    articleSection: post.category,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      {/* Featured image header */}
      <header data-nav-tone="dark" className="relative flex min-h-[64vh] items-end overflow-hidden">
        <div className="absolute inset-0">
          <ParallaxImage src={post.image} alt={post.title} sizes="100vw" priority range={8} className="h-full w-full" />
        </div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,11,12,0.9), rgba(11,11,12,0.2) 55%, rgba(11,11,12,0.55))" }} aria-hidden="true" />
        <div className="shell relative w-full pb-14 pt-40 md:pb-20" style={{ color: "var(--on-media)" }}>
          <Reveal>
            <Link href="/journal" className="link-underline font-mono text-xs uppercase tracking-[0.2em]" style={{ color: "var(--gold-media)" }}>← Journal</Link>
          </Reveal>
          <Reveal delay={90}>
            <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.15em]" style={{ color: "var(--on-media-dim)" }}>
              <span style={{ color: "var(--gold-media)" }}>{post.category}</span>
              <span aria-hidden="true">·</span>
              <span>{fmt(post.date)}</span>
              <span aria-hidden="true">·</span>
              <span>{post.readingTime} min read</span>
            </div>
          </Reveal>
          <LineMask text={post.title} tag="h1" className="display-l mt-4 max-w-[24ch]" style={{ textWrap: "balance" }} delay={0.18} />
        </div>
      </header>

      {/* Not `.section` here: its padding-block is unlayered CSS, and
          unlayered rules always beat Tailwind utilities (those sit in
          `@layer utilities`) - so a top-padding override on this div can
          never win. That left a dead pt-14 stacking a full 80-160px on top
          of the hero's own bottom padding, a huge unintentional gap before
          the article even starts. Explicit values below: the top gap
          mirrors the hero's own pb-14/md:pb-20 (one considered step, not a
          leftover), the bottom gap stays generous as the page's true close
          before the footer. */}
      <div className="shell pb-24 pt-14 md:pb-32 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_260px] lg:gap-16">
          {/* Article */}
          <article>
            <p className="lede text-[var(--bone)]"><ScrollHighlightText text={post.intro} /></p>
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="mt-12 scroll-mt-28">
                <LineMask text={s.heading} tag="h2" className="display-m" />
                {s.body.map((para, j) => (
                  <Reveal key={j} delay={Math.min(j * 60, 180)}>
                    <p className="mt-4 leading-relaxed text-[var(--bone-dim)]">{para}</p>
                  </Reveal>
                ))}
                {i === 1 && post.inlineImage && (
                  <figure className="mt-10">
                    <ImageReveal
                      src={post.inlineImage}
                      alt={`${post.title} - related project`}
                      sizes="(max-width:1024px) 100vw, 60vw"
                      className="aspect-[16/9] w-full rounded-2xl"
                      curtain="var(--ink)"
                    />
                  </figure>
                )}
              </section>
            ))}

            {/* Byline and CTA used to be two separate blocks stacked with
                mismatched gaps (mt-14, then mt-10) - read as an author card
                with an unrelated sales button bolted on below it. One row
                composes them as a single, deliberate close to the article;
                each child keeps its own original Reveal/delay untouched. */}
            <div className="mt-14 flex flex-wrap items-center justify-between gap-x-8 gap-y-6 border-t border-[var(--line)] pt-8">
              <Reveal className="flex items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--gold)] font-bold text-[#17191c]">{initials(post.authorName)}</span>
                <div>
                  <div className="font-semibold">{post.authorName}</div>
                  <div className="text-sm text-[var(--muted)]">{post.authorRole}, Studiodota</div>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <Link href="/contact" className="btn btn-primary">
                  Start your project
                  <span className="btn-icon" aria-hidden="true">→</span>
                </Link>
              </Reveal>
            </div>
          </article>

          {/* Sidebar: TOC + related */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Reveal className="rounded-2xl border border-[var(--line)] p-6">
              <h2 className="eyebrow">On this page</h2>
              <nav aria-label="Table of contents" className="mt-4 space-y-2.5 text-sm">
                {sections.map((s) => (
                  <a key={s.id} href={`#${s.id}`} className="block text-[var(--bone-dim)] transition-colors duration-300 hover:text-[var(--gold-ink)]">
                    {s.heading}
                  </a>
                ))}
              </nav>
            </Reveal>

            <div className="mt-8">
              <Reveal><h2 className="eyebrow">Related reading</h2></Reveal>
              <ul className="mt-4 space-y-5">
                {related.map((r, i) => (
                  <Reveal key={r.slug} delay={Math.min(i * 60, 180)}>
                    <li>
                      <Link href={`/journal/${r.slug}`} className="group flex items-center gap-3">
                        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                          <Image src={r.image} alt="" fill sizes="80px" className="object-cover" />
                        </div>
                        <div>
                          <div className="text-sm font-medium leading-snug transition-colors duration-300 group-hover:text-[var(--gold-ink)]">{r.title}</div>
                          <div className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)]">{r.category} · {r.readingTime} min</div>
                        </div>
                      </Link>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
