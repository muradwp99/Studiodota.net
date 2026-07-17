import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { logoutAction } from "@/lib/actions/auth";
import AdminNav from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: { default: "Studiodota Admin", template: "%s · Studiodota Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const unread = await db.contactMessage.count({ where: { read: false } }).catch(() => 0);

  return (
    <div className="flex min-h-screen bg-[var(--ink-2)]">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--ink)] p-5 md:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--gold)] font-extrabold text-[#17191c]">S</span>
          <span className="text-sm font-extrabold uppercase tracking-[0.12em]">Studiodota</span>
        </Link>
        <AdminNav unread={unread} />
        <div className="mt-auto space-y-3 border-t border-[var(--line)] pt-4">
          <Link href="/" target="_blank" className="block text-sm text-[var(--bone-dim)] transition-colors hover:text-[var(--gold-ink)]">
            View site ↗
          </Link>
          <div className="truncate text-xs text-[var(--muted)]" title={user.email}>{user.email}</div>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-[var(--bone-dim)] transition-colors hover:text-[#a33]">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--ink)] px-6 py-4 md:hidden">
          <Link href="/admin" className="text-sm font-extrabold uppercase tracking-[0.12em]">Studiodota Admin</Link>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-[var(--bone-dim)]">Sign out</button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-4xl px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
