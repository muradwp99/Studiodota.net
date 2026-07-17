"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/posts", label: "Journal posts" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-1">
      {items.map((it) => {
        const active = it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-[var(--gold)]/14 text-[var(--gold-ink)]" : "text-[var(--bone-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--bone)]"
            }`}
          >
            {it.label}
            {it.label === "Messages" && unread > 0 && (
              <span className="rounded-full bg-[var(--gold)] px-2 py-0.5 text-[0.65rem] font-bold text-[#17191c]">{unread}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
