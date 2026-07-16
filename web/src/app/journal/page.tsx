import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { posts } from "@/content/site";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Notes on architectural visualisation — craft, process, and the industry, from the Studiodota team.",
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function JournalPage() {
  return (
    <>
      <PageHeader
        eyebrow="Journal"
        title="Notes from the studio."
        lede="Craft, process, and the industry — what we're learning while we render the unbuilt."
      />

      <div className="shell section pt-6">
        <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {posts.map((post, i) => (
            <li key={post.slug}>
              <Reveal delay={(i % 3) * 60}>
                <Link
                  href={`/journal/${post.slug}`}
                  className="group grid gap-4 py-10 md:grid-cols-[1fr_2fr] md:gap-10"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-xs text-[var(--gold)]">
                      {post.category}
                    </span>
                    <span className="font-mono text-xs text-[var(--muted)]">
                      {fmt(post.date)}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-display text-2xl leading-tight transition-colors duration-300 group-hover:text-[var(--gold)] md:text-3xl">
                      {post.title}
                    </h2>
                    <p className="mt-3 max-w-[60ch] text-[var(--muted)]">
                      {post.excerpt}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--bone-dim)]">
                      {post.readingTime} min read
                      <span className="transition-transform duration-500 group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
