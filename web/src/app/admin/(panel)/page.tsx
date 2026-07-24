import Link from "next/link";
import { db } from "@/lib/db";
import QuickDraft from "@/components/admin/QuickDraft";

export const metadata = { title: "Dashboard" };

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <h2 className="border-b border-[var(--line)] px-5 py-3 text-sm font-bold">{title}</h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default async function AdminDashboard() {
  const [posts, pages, projects, gallery, unread, recentMessages, recentPosts] = await Promise.all([
    db.post.count().catch(() => 0),
    db.page.count().catch(() => 0),
    db.project.count().catch(() => 0),
    db.galleryItem.count().catch(() => 0),
    db.contactMessage.count({ where: { read: false } }).catch(() => 0),
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }).catch(() => []),
    db.post.findMany({ where: { published: true }, orderBy: { date: "desc" }, take: 3 }).catch(() => []),
  ]);

  const glance = [
    { label: `${posts} Post${posts === 1 ? "" : "s"}`, href: "/admin/posts" },
    { label: `${pages} Page${pages === 1 ? "" : "s"}`, href: "/admin/pages" },
    { label: `${projects} Project${projects === 1 ? "" : "s"}`, href: "/admin/projects" },
    { label: `${gallery} Gallery item${gallery === 1 ? "" : "s"}`, href: "/admin/gallery" },
    { label: `${unread} unread message${unread === 1 ? "" : "s"}`, href: "/admin/messages" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Dashboard</h1>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Widget title="At a Glance">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {glance.map((g) => (
              <li key={g.href + g.label}>
                <Link href={g.href} className="text-sm text-[var(--gold-ink)] hover:underline">{g.label}</Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
            Studiodota theme · Studiodota CMS 1.0
          </p>
        </Widget>

        <Widget title="Quick Draft">
          <QuickDraft />
        </Widget>

        <Widget title="Activity">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--bone-dim)]">Recent enquiries</h3>
          {recentMessages.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">No enquiries yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-[var(--line)]">
              {recentMessages.map((m) => (
                <li key={m.id}>
                  <Link href="/admin/messages" className="flex items-center gap-3 py-2.5 transition-colors hover:text-[var(--gold-ink)]">
                    {!m.read && <span aria-label="Unread" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />}
                    <span className="w-28 shrink-0 truncate text-sm font-medium">{m.name}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-[var(--muted)]">{m.message.slice(0, 60)}</span>
                    <time className="shrink-0 text-xs text-[var(--muted)]">{m.createdAt.toISOString().slice(0, 10)}</time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--bone-dim)]">Recently published</h3>
          <ul className="mt-2 space-y-2">
            {recentPosts.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <time className="shrink-0 font-mono text-[0.65rem] text-[var(--muted)]">{p.date}</time>
                <Link href={`/admin/posts/${p.id}`} className="truncate text-sm text-[var(--gold-ink)] hover:underline">{p.title}</Link>
              </li>
            ))}
            {recentPosts.length === 0 && <li className="text-sm text-[var(--muted)]">Nothing published yet.</li>}
          </ul>
        </Widget>

        <Widget title="Edit the site">
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/admin/pages/home" className="text-[var(--gold-ink)] hover:underline">Homepage sections</Link></li>
            <li><Link href="/admin/pages/new" className="text-[var(--gold-ink)] hover:underline">Design a new page</Link></li>
            <li><Link href="/admin/appearance/menus" className="text-[var(--gold-ink)] hover:underline">Menus</Link></li>
            <li><Link href="/admin/plugins" className="text-[var(--gold-ink)] hover:underline">Plugins</Link></li>
            <li><Link href="/admin/settings/general" className="text-[var(--gold-ink)] hover:underline">Settings</Link></li>
          </ul>
        </Widget>
      </div>
    </div>
  );
}
