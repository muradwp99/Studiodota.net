import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { getBlock, getPosts } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.journal");
  return { title: "Journal", description: d.lede };
}

const initials = (name: string) => name.split(" ").map((w) => w[0]).join("");
function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function JournalPage() {
  const [d, posts] = await Promise.all([getBlock("page.journal"), getPosts()]);
  const [featured, ...rest] = posts;

  return (
    <>
      <PageHero eyebrow={d.eyebrow} title={d.title} lede={d.lede} image={d.image} imageAlt="" />

      <section className="section pt-16">
        <div className="shell">
          {featured && (
            <Reveal>
              <Link
                href={`/journal/${featured.slug}`}
                className="group grid overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] md:grid-cols-2"
              >
                <div className="relative aspect-[16/11] w-full overflow-hidden md:aspect-auto md:min-h-[360px]">
                  <Image src={featured.image} alt={featured.title} fill sizes="(max-width:768px) 100vw, 50vw" className="img-zoom object-cover" />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <span className="w-max rounded-full bg-[var(--bone)] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink)]">Latest</span>
                  <h2 className="display-m mt-6 transition-colors duration-300 group-hover:text-[var(--gold-ink)]">{featured.title}</h2>
                  <p className="mt-4 max-w-[48ch] text-[var(--bone-dim)]">{featured.excerpt}</p>
                  <div className="mt-8 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--gold)] text-sm font-bold text-[#17191c]">{initials(featured.authorName)}</span>
                    <div>
                      <div className="text-sm font-semibold">{featured.authorName}</div>
                      <div className="text-xs text-[var(--muted)]">{featured.category} · {featured.readingTime} min read</div>
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          )}

          {posts.length === 0 && (
            <p className="py-20 text-center text-[var(--muted)]">No articles published yet — add one in the admin.</p>
          )}

          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, i) => (
              <Reveal key={post.slug} delay={(i % 3) * 70}>
                <Link href={`/journal/${post.slug}`} className="group block">
                  <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl">
                    <Image src={post.image} alt={post.title} fill sizes="(max-width:768px) 100vw, 33vw" className="img-zoom object-cover" />
                  </div>
                  <div className="mt-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    <span className="text-[var(--gold-ink)]">{post.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readingTime} min</span>
                  </div>
                  <h3 className="mt-3 text-xl font-medium leading-snug transition-colors duration-300 group-hover:text-[var(--gold-ink)]">{post.title}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">{post.excerpt}</p>
                  <div className="mt-4 text-xs text-[var(--muted)]">{fmt(post.date)}</div>
                </Link>
              </Reveal>
            ))}
          </div>

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
