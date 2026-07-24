"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
  badge?: number;
  separatorAfter?: boolean;
};

const I = (d: string) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const icons = {
  dashboard: I("M3 12 12 4l9 8M5 10v10h5v-6h4v6h5V10"),
  posts: I("M16 3l5 5-9 9H7v-5l9-9ZM4 21h16"),
  media: I("M3 5h18v14H3V5Zm3 10 4-4 3 3 3-3 3 4M8.5 9.5h.01"),
  pages: I("M7 3h8l4 4v14H7V3Zm8 0v4h4M10 12h6M10 16h6"),
  projects: I("M4 21V7l8-4 8 4v14M9 21v-6h6v6M9 10h.01M15 10h.01"),
  gallery: I("M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"),
  messages: I("M4 5h16v11H8l-4 4V5Z"),
  appearance: I("M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.6-1-2.6c0-1.2 1-2 2.3-2H18a4 4 0 0 0 4-4c0-4-4.5-7.4-10-7.4ZM7.5 10.5h.01M12 7h.01M16.5 10.5h.01"),
  plugins: I("M9 3v4M15 3v4M6 7h12v5a6 6 0 0 1-12 0V7Zm6 11v3"),
  users: I("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0"),
  settings: I("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3 2-1.2-2-3.6-2.3.7a7 7 0 0 0-1.7-1L15.6 4h-4.2L11 6.9a7 7 0 0 0-1.7 1l-2.3-.7-2 3.6L7 12l-2 1.2 2 3.6 2.3-.7a7 7 0 0 0 1.7 1l.4 2.9h4.2l.4-2.9a7 7 0 0 0 1.7-1l2.3.7 2-3.6L20 12Z"),
};

function buildItems(unread: number): Item[] {
  return [
    { label: "Dashboard", href: "/admin", icon: icons.dashboard, separatorAfter: true },
    {
      label: "Posts", href: "/admin/posts", icon: icons.posts,
      children: [
        { label: "All Posts", href: "/admin/posts" },
        { label: "Add New", href: "/admin/posts/new" },
        { label: "Categories", href: "/admin/posts/categories" },
      ],
    },
    { label: "Media", href: "/admin/media", icon: icons.media },
    {
      label: "Pages", href: "/admin/pages", icon: icons.pages,
      children: [
        { label: "All Pages", href: "/admin/pages" },
        { label: "Add New", href: "/admin/pages/new" },
      ],
    },
    {
      label: "Projects", href: "/admin/projects", icon: icons.projects,
      children: [
        { label: "All Projects", href: "/admin/projects" },
        { label: "Add New", href: "/admin/projects/new" },
      ],
    },
    { label: "Gallery", href: "/admin/gallery", icon: icons.gallery },
    { label: "Messages", href: "/admin/messages", icon: icons.messages, badge: unread, separatorAfter: true },
    {
      label: "Appearance", href: "/admin/appearance/themes", icon: icons.appearance,
      children: [
        { label: "Themes", href: "/admin/appearance/themes" },
        { label: "Homepage layout", href: "/admin/appearance/homepage" },
        { label: "Customize", href: "/admin/appearance/customize" },
        { label: "Menus", href: "/admin/appearance/menus" },
      ],
    },
    { label: "Plugins", href: "/admin/plugins", icon: icons.plugins },
    {
      label: "Users", href: "/admin/users/profile", icon: icons.users,
      children: [{ label: "Profile", href: "/admin/users/profile" }],
    },
    {
      label: "Settings", href: "/admin/settings/general", icon: icons.settings,
      children: [
        { label: "General", href: "/admin/settings/general" },
        { label: "SEO", href: "/admin/settings/seo" },
        { label: "Redirects", href: "/admin/settings/redirects" },
        { label: "Integrations", href: "/admin/settings/integrations" },
      ],
    },
  ];
}

function sectionOf(item: Item): string {
  // Treat /admin/<first-segment> (or the item's own href for Dashboard) as its section.
  return item.href === "/admin" ? "/admin" : "/admin/" + item.href.split("/")[2];
}

export default function AdminNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  const items = buildItems(unread);

  return (
    <nav aria-label="Admin" className="pb-6 text-[0.82rem]">
      {items.map((item) => {
        const section = sectionOf(item);
        const active = section === "/admin" ? pathname === "/admin" : pathname.startsWith(section);
        return (
          <div key={item.label}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 font-medium transition-colors ${
                active
                  ? "bg-[var(--gold)] text-[#17191c]"
                  : "text-[rgba(246,245,242,0.74)] hover:bg-[rgba(246,245,242,0.07)] hover:text-white"
              }`}
            >
              <span className={active ? "text-[#17191c]" : "text-[rgba(246,245,242,0.55)]"}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className={`rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold ${active ? "bg-[#17191c] text-[var(--gold-media)]" : "bg-[var(--gold)] text-[#17191c]"}`}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
            {active && item.children && (
              <div className="bg-[rgba(0,0,0,0.28)] py-1.5">
                {item.children.map((c) => {
                  const childActive = pathname === c.href;
                  return (
                    <Link
                      key={c.href + c.label}
                      href={c.href}
                      aria-current={childActive ? "page" : undefined}
                      className={`block py-1.5 pl-[42px] pr-3 transition-colors ${
                        childActive ? "font-semibold text-[var(--gold-media)]" : "text-[rgba(246,245,242,0.62)] hover:text-white"
                      }`}
                    >
                      {c.label}
                    </Link>
                  );
                })}
              </div>
            )}
            {item.separatorAfter && <div className="my-2 h-px bg-[rgba(246,245,242,0.08)]" />}
          </div>
        );
      })}
    </nav>
  );
}
