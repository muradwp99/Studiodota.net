"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "@/components/Reveal";
import { useReducedMotion } from "@/lib/useReducedMotion";

export type JournalCard = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  readingTime: number;
  date: string;
  authorName: string;
};

const initials = (name: string) => name.split(" ").map((w) => w[0]).join("");
function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const PAGE = 9;

export default function JournalClient({ posts }: { posts: JournalCard[] }) {
  const reduced = useReducedMotion();
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const p of posts) if (p.category && !seen.includes(p.category)) seen.push(p.category);
    return seen;
  }, [posts]);
  const [cat, setCat] = useState<string>("all");
  const [page, setPage] = useState(0);

  const selectCat = (c: string) => {
    setCat(c);
    setPage(0);
  };

  const showFeatured = cat === "all";
  const list = cat === "all" ? posts.slice(1) : posts.filter((p) => p.category === cat);
  const featured = posts[0];
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const shown = list.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <>
      {categories.length > 1 && (
        <Reveal>
          <div className="mb-10 flex flex-wrap gap-2 border-y border-[var(--line)] py-6">
            {[{ key: "all", label: "All" }, ...categories.map((c) => ({ key: c, label: c }))].map((f) => {
              const on = f.key === cat;
              return (
                <button
                  key={f.key}
                  onClick={() => selectCat(f.key)}
                  aria-pressed={on}
                  className={`rounded-full px-4 py-2.5 text-sm transition-colors duration-300 ${on ? "bg-[var(--bone)] text-[var(--ink)]" : "text-[var(--bone-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--bone)]"}`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </Reveal>
      )}

      {showFeatured && featured && (
        <Reveal delay={80}>
          <Link
            href={`/journal/${featured.slug}`}
            className="hover-lift group grid overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] md:grid-cols-2"
          >
            <div className="relative aspect-[16/11] w-full overflow-hidden md:aspect-auto md:min-h-[360px]">
              <Image src={featured.image} alt={featured.title} fill sizes="(max-width:768px) 100vw, 50vw" className="img-zoom object-cover" />
            </div>
            <div className="flex flex-col justify-center p-8 md:p-12">
              {/* Gold, not the neutral bone/ink pill the filter buttons use above -
                  this is a flagship marker, not a toggle state, so it gets the
                  brand accent (same on-gold contrast fix as .btn-primary). */}
              <span className="w-max rounded-full bg-[var(--gold)] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#17191c]">Latest</span>
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

      <motion.div layout={!reduced} className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((post, i) => {
            // Top-of-list gets a wider, larger-type tile so the grid has one focal
            // point instead of nine identical tiles - matches the "feature" idiom
            // ProjectsClient already uses for the same reason. Only page 0: a big
            // tile reappearing on every paginated page would just look arbitrary.
            const feature = i === 0 && page === 0;
            return (
              <motion.article
                key={post.slug}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                transition={{ duration: reduced ? 0 : 0.45, ease: [0.16, 1, 0.3, 1], delay: reduced ? 0 : (i % 3) * 0.06 }}
                className={feature ? "md:col-span-2" : ""}
              >
                <Link href={`/journal/${post.slug}`} className="group block">
                  <div className={`relative w-full overflow-hidden rounded-2xl hover-lift ${feature ? "aspect-[16/9]" : "aspect-[16/11]"}`}>
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes={feature ? "(max-width:1024px) 100vw, 66vw" : "(max-width:768px) 100vw, 33vw"}
                      className="img-zoom object-cover"
                    />
                  </div>
                  {/* Ruled hairline + gold hover-sweep: the same card anatomy
                      ProjectsClient uses, so the two listing pages read as one
                      design system instead of each inventing its own card. */}
                  <div className="relative mt-5 border-t border-[var(--line-strong)] pt-4">
                    <span
                      aria-hidden="true"
                      className="absolute -top-px left-0 h-px w-0 bg-[var(--gold)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-full"
                    />
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      <span className="text-[var(--gold-ink)]">{post.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.readingTime} min</span>
                      <span aria-hidden="true">·</span>
                      <span>{fmt(post.date)}</span>
                    </div>
                    <h3
                      className={`mt-3 line-clamp-2 font-medium leading-snug transition-colors duration-300 group-hover:text-[var(--gold-ink)] ${feature ? "text-2xl md:text-3xl" : "text-xl"}`}
                    >
                      {post.title}
                    </h3>
                    <p className={`mt-2 text-sm text-[var(--muted)] ${feature ? "line-clamp-3 max-w-[60ch]" : "line-clamp-2"}`}>{post.excerpt}</p>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {list.length === 0 && (
        <p className="py-16 text-center text-[var(--muted)]">No articles in this category yet.</p>
      )}

      {pages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <span className="mr-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">See</span>
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              aria-label={`Page ${i + 1}`}
              aria-current={page === i}
              className={`h-9 w-9 rounded-full font-mono text-sm transition-colors duration-300 ${page === i ? "bg-[var(--gold)] text-[#17191c]" : "text-[var(--bone-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--bone)]"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
