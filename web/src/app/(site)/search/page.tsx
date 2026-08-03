import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { searchSite } from "@/lib/content";

// Internal results page — kept out of search engines, but still linkable/shareable.
export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const { projects, posts, pages } = await searchSite(q);
  const total = projects.length + posts.length + pages.length;

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title="Search the site"
        lede={query ? `${total} result${total === 1 ? "" : "s"} for "${query}"` : "Find projects, journal articles, and pages."}
      />
      <div className="shell pb-28">
        <form className="flex max-w-[52ch] gap-3">
          {/* A placeholder is not a label - it disappears on input and screen
              readers are not required to announce it. This one is visually
              hidden but read out, so the field still announces its purpose. */}
          <label htmlFor="site-search" className="sr-only">
            Search projects, articles, and pages
          </label>
          <input
            id="site-search"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search projects, articles, pages…"
            className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-3 text-[var(--bone)] outline-none transition-colors duration-300 placeholder:text-[var(--muted)] focus:border-[var(--gold)]"
          />
          <button type="submit" className="btn btn-primary shrink-0">Search</button>
        </form>

        {query && total === 0 && (
          <p className="py-16 text-center text-[var(--muted)]">No results for &ldquo;{query}&rdquo;.</p>
        )}

        {projects.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl text-[var(--bone)]">Projects</h2>
            <ul className="mt-6 space-y-5">
              {projects.map((p) => (
                <li key={p.slug}>
                  <Link href={`/projects/${p.slug}`} className="group block">
                    <div className="text-lg font-medium text-[var(--bone)] transition-colors duration-300 group-hover:text-[var(--gold-ink)]">{p.title}</div>
                    <p className="mt-1 text-sm text-[var(--muted)]">{p.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {posts.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl text-[var(--bone)]">Journal</h2>
            <ul className="mt-6 space-y-5">
              {posts.map((p) => (
                <li key={p.slug}>
                  <Link href={`/journal/${p.slug}`} className="group block">
                    <div className="text-lg font-medium text-[var(--bone)] transition-colors duration-300 group-hover:text-[var(--gold-ink)]">{p.title}</div>
                    <p className="mt-1 text-sm text-[var(--muted)]">{p.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {pages.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl text-[var(--bone)]">Pages</h2>
            <ul className="mt-6 space-y-5">
              {pages.map((p) => (
                <li key={p.slug}>
                  <Link href={`/${p.slug}`} className="text-lg font-medium text-[var(--bone)] transition-colors duration-300 hover:text-[var(--gold-ink)]">{p.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
