import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { posts } from "@/content/site";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return { title: "Article not found" };
  return { title: post.title, description: post.excerpt };
}

const R = (n: string) => `/media/renders/${n}.jpg`;
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
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      {/* Featured image header */}
      <header data-nav-tone="dark" className="relative flex min-h-[64vh] items-end overflow-hidden">
        <Image src={R(post.image)} alt={post.title} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,11,12,0.9), rgba(11,11,12,0.2) 55%, rgba(11,11,12,0.55))" }} aria-hidden="true" />
        <div className="shell relative w-full pb-14 pt-40 md:pb-20" style={{ color: "var(--on-media)" }}>
          <Link href="/journal" className="link-underline font-mono text-xs uppercase tracking-[0.2em]" style={{ color: "var(--gold-media)" }}>← Journal</Link>
          <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.15em]" style={{ color: "var(--on-media-dim)" }}>
            <span style={{ color: "var(--gold-media)" }}>{post.category}</span>
            <span aria-hidden="true">·</span>
            <span>{fmt(post.date)}</span>
            <span aria-hidden="true">·</span>
            <span>{post.readingTime} min read</span>
          </div>
          <h1 className="display-l mt-4 max-w-[24ch]" style={{ textWrap: "balance" }}>{post.title}</h1>
        </div>
      </header>

      <div className="shell section pt-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_260px] lg:gap-16">
          {/* Article */}
          <article>
            <p className="lede text-[var(--bone)]">{post.intro}</p>
            {post.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="mt-12 scroll-mt-28">
                <h2 className="display-m">{s.heading}</h2>
                {s.body.map((para, j) => (
                  <p key={j} className="mt-4 leading-relaxed text-[var(--bone-dim)]">{para}</p>
                ))}
                {i === 1 && post.inlineImage && (
                  <figure className="mt-10">
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
                      <Image src={R(post.inlineImage)} alt={`${post.title} — related project`} fill sizes="(max-width:1024px) 100vw, 60vw" className="object-cover" />
                    </div>
                  </figure>
                )}
              </section>
            ))}

            <div className="mt-14 flex items-center gap-4 border-t border-[var(--line)] pt-8">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--gold)] font-bold text-[var(--ink)]">{initials(post.author.name)}</span>
              <div>
                <div className="font-semibold">{post.author.name}</div>
                <div className="text-sm text-[var(--muted)]">{post.author.role}, Studiodota</div>
              </div>
            </div>
            <div className="mt-10">
              <Link href="/contact" className="btn btn-primary">
                Start your project
                <span className="btn-icon" aria-hidden="true">→</span>
              </Link>
            </div>
          </article>

          {/* Sidebar: TOC + related */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-[var(--line)] p-6">
              <h2 className="eyebrow eyebrow-muted">On this page</h2>
              <nav aria-label="Table of contents" className="mt-4 space-y-2.5 text-sm">
                {post.sections.map((s) => (
                  <a key={s.id} href={`#${s.id}`} className="block text-[var(--bone-dim)] transition-colors duration-300 hover:text-[var(--gold-ink)]">
                    {s.heading}
                  </a>
                ))}
              </nav>
            </div>

            <div className="mt-8">
              <h2 className="eyebrow eyebrow-muted">Related reading</h2>
              <ul className="mt-4 space-y-5">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/journal/${r.slug}`} className="group flex items-center gap-3">
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                        <Image src={R(r.image)} alt="" fill sizes="80px" className="object-cover" />
                      </div>
                      <div>
                        <div className="text-sm font-medium leading-snug transition-colors duration-300 group-hover:text-[var(--gold-ink)]">{r.title}</div>
                        <div className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)]">{r.category} · {r.readingTime} min</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
