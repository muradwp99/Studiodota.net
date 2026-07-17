import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBlock } from "@/lib/content";
import AdminBar from "@/components/admin/AdminBar";
import AdminNav from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: { default: "Studiodota Admin", template: "%s · Studiodota Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [site, unread] = await Promise.all([
    getBlock("site"),
    db.contactMessage.count({ where: { read: false } }).catch(() => 0),
  ]);

  return (
    <div className="min-h-screen bg-[var(--ink)]">
      <AdminBar siteName={site.name} userName={user.name} />
      <div className="flex min-h-[calc(100vh-2.25rem)]">
        <aside className="sticky top-9 hidden h-[calc(100vh-2.25rem)] w-44 shrink-0 overflow-y-auto bg-[#1d2023] md:block">
          <AdminNav unread={unread} />
        </aside>
        {/* Mobile: horizontal section nav */}
        <div className="min-w-0 flex-1">
          <div className="flex gap-1 overflow-x-auto bg-[#1d2023] px-2 py-2 md:hidden">
            {[
              ["Dashboard", "/admin"], ["Posts", "/admin/posts"], ["Media", "/admin/media"], ["Pages", "/admin/pages"],
              ["Projects", "/admin/projects"], ["Gallery", "/admin/gallery"], ["Messages", "/admin/messages"],
              ["Appearance", "/admin/appearance/themes"], ["Plugins", "/admin/plugins"], ["Users", "/admin/users/profile"], ["Settings", "/admin/settings/general"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="shrink-0 rounded-full px-3 py-1.5 text-xs text-[rgba(246,245,242,0.75)] hover:bg-[rgba(246,245,242,0.08)]">
                {label}
              </a>
            ))}
          </div>
          <main className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
