"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";

const NEW_ITEMS = [
  { label: "Post", href: "/admin/posts/new" },
  { label: "Page", href: "/admin/pages/new" },
  { label: "Project", href: "/admin/projects/new" },
  { label: "Media", href: "/admin/media" },
  { label: "Gallery item", href: "/admin/gallery" },
];

function Drop({ label, children, alignRight }: { label: React.ReactNode; children: React.ReactNode; alignRight?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative h-full">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-full items-center gap-1.5 px-3 text-[0.8rem] transition-colors ${open ? "bg-[rgba(246,245,242,0.12)] text-white" : "text-[rgba(246,245,242,0.82)] hover:bg-[rgba(246,245,242,0.08)] hover:text-white"}`}
      >
        {label}
      </button>
      {open && (
        <div className={`absolute top-full z-[95] min-w-44 border border-[rgba(246,245,242,0.12)] bg-[#17191c] py-1.5 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)] ${alignRight ? "right-0" : "left-0"}`}>
          {children}
        </div>
      )}
    </div>
  );
}

const dropItemCls =
  "block w-full px-4 py-2 text-left text-[0.8rem] text-[rgba(246,245,242,0.78)] transition-colors hover:bg-[rgba(246,245,242,0.08)] hover:text-[var(--gold-media)]";

export default function AdminBar({ siteName, userName }: { siteName: string; userName: string }) {
  return (
    <div className="sticky top-0 z-[90] flex h-9 items-stretch justify-between bg-[#17191c] text-white">
      <div className="flex items-stretch">
        <Link href="/" target="_blank" className="flex items-center gap-2 px-3 text-[0.8rem] text-[rgba(246,245,242,0.82)] transition-colors hover:bg-[rgba(246,245,242,0.08)] hover:text-white">
          <span className="grid h-5 w-5 place-items-center rounded bg-[var(--gold)] text-[0.65rem] font-extrabold text-[#17191c]">{siteName.charAt(0)}</span>
          <span className="hidden sm:inline">{siteName}</span>
          <span className="text-[0.65rem] text-[rgba(246,245,242,0.5)]">↗</span>
        </Link>
        <Drop label={<><span className="text-base leading-none" aria-hidden="true">＋</span> New</>}>
          {NEW_ITEMS.map((it) => (
            <Link key={it.label} href={it.href} className={dropItemCls}>{it.label}</Link>
          ))}
        </Drop>
      </div>
      <div className="flex items-stretch">
        <Drop alignRight label={<>Howdy, <strong className="font-semibold">{userName}</strong><span className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--gold)] text-[0.6rem] font-bold text-[#17191c]">{userName.charAt(0).toUpperCase()}</span></>}>
          <Link href="/admin/users/profile" className={dropItemCls}>Edit profile</Link>
          <form action={logoutAction}>
            <button type="submit" className={dropItemCls}>Sign out</button>
          </form>
        </Drop>
      </div>
    </div>
  );
}
