import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Journal posts" };

export default async function AdminPosts() {
  const posts = await db.post.findMany({ orderBy: { date: "desc" } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Journal posts</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Articles on /journal — the newest also features on the homepage.</p>
        </div>
        <Link href="/admin/posts/new" className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#17191c] hover:bg-[var(--gold-hi)]">
          + New article
        </Link>
      </div>

      <ul className="mt-6 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/posts/${p.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--surface-2)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="h-11 w-16 shrink-0 rounded-md border border-[var(--line)] object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p.title}</div>
                <div className="font-mono text-[0.65rem] text-[var(--muted)]">{p.date} · {p.category} · {p.readingTime} min</div>
              </div>
              {!p.published && <span className="rounded-full border border-[var(--line-strong)] px-2.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-[var(--muted)]">Draft</span>}
            </Link>
          </li>
        ))}
        {posts.length === 0 && <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">No articles yet.</li>}
      </ul>
    </div>
  );
}
