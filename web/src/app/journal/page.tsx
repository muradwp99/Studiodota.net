import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { posts } from "@/content/site";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Notes from the Studiodota team on architecture, interiors, sustainability, urbanism, and the craft of building well.",
};

const R = (n: string) => `/media/renders/${n}.jpg`;
const initials = (name: string) => name.split(" ").map((w) => w[0]).join("");
function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function JournalPage() {
  const [featured, ...rest] = posts;

  return (
    <>
      <PageHero
        eyebrow="Journal"
        title="Notes from the studio."
        lede="Craft, process, and ideas — on daylight, materials, sustainability, and the discipline of building well."
        image={R("interior")}
        imageAlt="Interior render from a Studiodota project"
      />

      <section className="section pt-16">
        <div className="shell">
          {/* Featured post */}
          <Reveal>
            <Link
              href={`/journal/${featured.slug}`}
              className="group grid overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] md:grid-cols-2"
            >
              <div className="relative aspect-[16/11] w-full overflow-hidden md:aspect-auto md:min-h-[360px]">
                <Image src={R(featured.image)} alt={featured.title} fill sizes="(max-width:768px) 100vw, 50vw" className="img-zoom object-cover" />
              </div>
              <div className="flex flex-col justify-center p-8 md:p-12">
                <span className="w-max rounded-full bg-[var(--bone)] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink)]">Latest</span>
                <h2 className="display-m mt-6 transition-colors duration-300 group-hover:text-[var(--gold-ink)]">{featured.title}</h2>
                <p className="mt-4 max-w-[48ch] text-[var(--bone-dim)]">{featured.excerpt}</p>
                <div className="mt-8 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--gold)] text-sm font-bold text-[var(--ink)]">{initials(featured.author.name)}</span>
                  <div>
                    <div className="text-sm font-semibold">{featured.author.name}</div>
                    <div className="text-xs text-[var(--muted)]">{featured.category} · {featured.readingTime} min read</div>
                  </div>
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Grid */}
          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, i) => (
              <Reveal key={post.slug} delay={(i % 3) * 70}>
                <Link href={`/journal/${post.slug}`} className="group block">
                  <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl">
                    <Image src={R(post.image)} alt={post.title} fill sizes="(max-width:768px) 100vw, 33vw" className="img-zoom object-cover" />
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
        </div>
      </section>
    </>
  );
}
