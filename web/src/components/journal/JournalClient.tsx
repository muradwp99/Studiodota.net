"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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

export default function JournalClient({ posts }: { posts: JournalCard[] }) {
  const reduced = useReducedMotion();
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const p of posts) if (p.category && !seen.includes(p.category)) seen.push(p.category);
    return seen;
  }, [posts]);
  const [cat, setCat] = useState<string>("all");

  const showFeatured = cat === "all";
  const list = cat === "all" ? posts.slice(1) : posts.filter((p) => p.category === cat);
  const featured = posts[0];

  return (
    <>
      {categories.length > 1 && (
        <div className="mb-10 flex flex-wrap gap-2 border-y border-[var(--line)] py-6">
          {[{ key: "all", label: "All" }, ...categories.map((c) => ({ key: c, label: c }))].map((f) => {
            const on = f.key === cat;
            return (
              <button
                key={f.key}
                onClick={() => setCat(f.key)}
                aria-pressed={on}
                className={`rounded-full px-4 py-2 text-sm transition-colors duration-300 ${on ? "bg-[var(--bone)] text-[var(--ink)]" : "text-[var(--bone-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--bone)]"}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {showFeatured && featured && (
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
      )}

      <motion.div layout={!reduced} className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((post, i) => (
            <motion.article
              key={post.slug}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
              transition={{ duration: reduced ? 0 : 0.45, ease: [0.16, 1, 0.3, 1], delay: reduced ? 0 : (i % 3) * 0.06 }}
            >
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
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>

      {list.length === 0 && (
        <p className="py-16 text-center text-[var(--muted)]">No articles in this category yet.</p>
      )}
    </>
  );
}
