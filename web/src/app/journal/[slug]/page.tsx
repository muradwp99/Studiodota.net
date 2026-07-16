import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
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

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <article className="shell pb-24 pt-40 md:pt-52">
      <Reveal>
        <Link href="/journal" className="eyebrow eyebrow-muted link-underline">
          ← Journal
        </Link>
      </Reveal>
      <Reveal delay={70}>
        <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-xs text-[var(--muted)]">
          <span className="text-[var(--gold)]">{post.category}</span>
          <span>{fmt(post.date)}</span>
          <span>{post.readingTime} min read</span>
        </div>
      </Reveal>
      <Reveal delay={110}>
        <h1 className="display-l mt-6 max-w-[22ch]">{post.title}</h1>
      </Reveal>

      <div className="mt-14 max-w-[68ch] space-y-6 text-lg leading-relaxed text-[var(--bone-dim)]">
        <p className="text-[var(--bone)]">{post.excerpt}</p>
        <p>
          At Studiodota, every decision has to hold up once a building is lived
          in. That standard shapes how we plan, detail, and resolve a project —
          long before anyone breaks ground.
        </p>
        <p>
          Good architecture earns trust through restraint: the right proportion,
          honest materials, and daylight used with intent let a space feel
          settled rather than styled. When the fundamentals are right, everything
          else follows.
        </p>
        <p>
          The craft is in knowing which moves carry the idea and which merely add
          noise. That editorial eye is what separates a building people tolerate
          from one they genuinely love.
        </p>
      </div>

      <div className="mt-16 border-t border-[var(--line)] pt-10">
        <Link href="/contact" className="btn btn-primary">
          Start your project
          <span className="btn-icon" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
