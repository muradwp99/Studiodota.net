import Link from "next/link";
import { db } from "@/lib/db";
import { PAGES } from "@/lib/pageRegistry";

export default async function AdminDashboard() {
  const [projects, posts, gallery, media, messages, unread] = await Promise.all([
    db.project.count().catch(() => 0),
    db.post.count().catch(() => 0),
    db.galleryItem.count().catch(() => 0),
    db.media.count().catch(() => 0),
    db.contactMessage.count().catch(() => 0),
    db.contactMessage.count({ where: { read: false } }).catch(() => 0),
  ]);
  const recent = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }).catch(() => []);

  const stats = [
    { label: "Projects", value: projects, href: "/admin/projects" },
    { label: "Journal posts", value: posts, href: "/admin/posts" },
    { label: "Gallery items", value: gallery, href: "/admin/gallery" },
    { label: "Media files", value: media, href: "/admin/media" },
    { label: "Messages", value: messages, href: "/admin/messages", badge: unread },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Everything on the public site is editable from here. Saves go live immediately.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--gold)]">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold">{s.value}</span>
              {s.badge ? <span className="rounded-full bg-[var(--gold)] px-2.5 py-1 text-xs font-bold text-[#17191c]">{s.badge} new</span> : null}
            </div>
            <div className="mt-1 text-sm text-[var(--bone-dim)]">{s.label}</div>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-bold">Edit a page</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PAGES.map((p) => (
            <Link key={p.slug} href={`/admin/pages/${p.slug}`} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4 transition-colors hover:border-[var(--gold)]">
              <div className="font-semibold">{p.title}</div>
              <div className="mt-0.5 text-xs text-[var(--muted)]">{p.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">Latest messages</h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">No enquiries yet — they'll appear here when the contact forms are submitted.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            {recent.map((m) => (
              <li key={m.id}>
                <Link href="/admin/messages" className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--surface-2)]">
                  {!m.read && <span aria-label="Unread" className="h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />}
                  <span className="w-40 shrink-0 truncate font-medium">{m.name}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--muted)]">{m.message}</span>
                  <time className="shrink-0 text-xs text-[var(--muted)]">{m.createdAt.toISOString().slice(0, 10)}</time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
