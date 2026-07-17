import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import PostForm, { type PostInput, type PostSectionInput } from "@/components/admin/PostForm";

export const metadata = { title: "Edit article" };

const EMPTY: PostInput = {
  slug: "",
  title: "",
  excerpt: "",
  category: "Craft",
  date: new Date().toISOString().slice(0, 10),
  readingTime: 5,
  image: "",
  inlineImage: "",
  authorName: "Studiodota Team",
  authorRole: "Architecture & Design",
  intro: "",
  sections: [{ id: "", heading: "", body: [""] }],
  published: true,
};

export default async function AdminPostEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const post = isNew ? null : await db.post.findUnique({ where: { id } });
  if (!isNew && !post) notFound();

  const initial: PostInput = post
    ? {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        date: post.date,
        readingTime: post.readingTime,
        image: post.image,
        inlineImage: post.inlineImage,
        authorName: post.authorName,
        authorRole: post.authorRole,
        intro: post.intro,
        sections: (Array.isArray(post.sections) ? post.sections : []) as PostSectionInput[],
        published: post.published,
      }
    : EMPTY;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/posts" className="text-xs text-[var(--muted)] hover:text-[var(--gold-ink)]">← All articles</Link>
        <h1 className="mt-1 text-2xl font-extrabold">{isNew ? "New article" : `Edit — ${post!.title}`}</h1>
        {!isNew && (
          <Link href={`/journal/${post!.slug}`} target="_blank" className="text-sm text-[var(--gold-ink)] hover:underline">
            View live ↗
          </Link>
        )}
      </div>
      <PostForm id={isNew ? null : id} initial={initial} />
    </div>
  );
}
