import Link from "next/link";
import { PAGES } from "@/lib/pageRegistry";

export const metadata = { title: "Pages" };

export default function AdminPagesIndex() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Pages</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Every public page, section by section.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {PAGES.map((p) => (
          <Link key={p.slug} href={`/admin/pages/${p.slug}`} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4 transition-colors hover:border-[var(--gold)]">
            <div className="font-semibold">{p.title}</div>
            <div className="mt-0.5 text-xs text-[var(--muted)]">{p.blurb}</div>
            <div className="mt-2 font-mono text-[0.65rem] text-[var(--muted)]">{p.blocks.length} section{p.blocks.length === 1 ? "" : "s"}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
