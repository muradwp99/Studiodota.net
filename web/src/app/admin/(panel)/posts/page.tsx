import Link from "next/link";
import { db } from "@/lib/db";
import { getBlock } from "@/lib/content";
import { inputCls } from "@/components/admin/ui";

export const metadata = { title: "Posts" };

export default async function AdminPosts({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; category?: string }>;
}) {
  const { s = "", category = "" } = await searchParams;
  const [{ postCategories }, posts] = await Promise.all([
    getBlock("taxonomies"),
    db.post.findMany({
      where: {
        ...(s ? { title: { contains: s } } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { date: "desc" },
    }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Posts</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Journal articles — the newest also features on the homepage.</p>
        </div>
        <Link href="/admin/posts/new" className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#17191c] hover:bg-[var(--gold-hi)]">
          + Add New
        </Link>
      </div>

      <form method="GET" className="mt-5 flex flex-wrap items-center gap-3">
        <input name="s" defaultValue={s} placeholder="Search posts…" aria-label="Search posts" className={`${inputCls} max-w-56`} />
        <select name="category" defaultValue={category} aria-label="Filter by category" className={`${inputCls} w-auto`}>
          <option value="">All categories</option>
          {postCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-medium hover:border-[var(--gold)] hover:text-[var(--gold-ink)]">
          Filter
        </button>
        <span className="text-xs text-[var(--muted)]">{posts.length} item{posts.length === 1 ? "" : "s"}</span>
      </form>

      <ul className="mt-4 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        {posts.map((p) => (
          <li key={p.id} className="flex items-center gap-4 px-5 py-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt="" className="h-11 w-16 shrink-0 rounded-md border border-[var(--line)] object-cover" />
            <Link href={`/admin/posts/${p.id}`} className="min-w-0 flex-1 transition-colors hover:text-[var(--gold-ink)]">
              <span className="font-medium">{p.title}</span>
              {!p.published && <span className="ml-2 text-sm text-[var(--muted)]">— Draft</span>}
              <div className="font-mono text-[0.65rem] text-[var(--muted)]">{p.date} · {p.category} · {p.readingTime} min</div>
            </Link>
            {p.published && (
              <Link href={`/journal/${p.slug}`} target="_blank" className="shrink-0 text-xs text-[var(--gold-ink)] hover:underline">View ↗</Link>
            )}
          </li>
        ))}
        {posts.length === 0 && <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">No posts match.</li>}
      </ul>
    </div>
  );
}
