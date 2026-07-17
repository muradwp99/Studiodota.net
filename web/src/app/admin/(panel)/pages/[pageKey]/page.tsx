import Link from "next/link";
import { notFound } from "next/navigation";
import { PAGES, specFor } from "@/lib/pageRegistry";
import { getBlock } from "@/lib/content";
import BlockEditor from "@/components/admin/BlockEditor";

export async function generateMetadata({ params }: { params: Promise<{ pageKey: string }> }) {
  const { pageKey } = await params;
  const page = PAGES.find((p) => p.slug === pageKey);
  return { title: page ? `Edit — ${page.title}` : "Page not found" };
}

export default async function AdminPageEditor({ params }: { params: Promise<{ pageKey: string }> }) {
  const { pageKey } = await params;
  const page = PAGES.find((p) => p.slug === pageKey);
  if (!page) notFound();

  const blocks = await Promise.all(
    page.blocks.map(async (key) => ({ key, spec: specFor(key)!, data: await getBlock(key) })),
  );
  const publicPath = page.slug === "home" ? "/" : `/${page.slug}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/pages" className="text-xs text-[var(--muted)] hover:text-[var(--gold-ink)]">← All pages</Link>
          <h1 className="mt-1 text-2xl font-extrabold">{page.title}</h1>
        </div>
        <Link href={publicPath} target="_blank" className="text-sm text-[var(--gold-ink)] hover:underline">
          View live page ↗
        </Link>
      </div>

      {blocks.length > 1 && (
        <nav aria-label="Sections" className="flex flex-wrap gap-2">
          {blocks.map(({ key, spec }) => (
            <a key={key} href={`#${key}`} className="rounded-full border border-[var(--line-strong)] px-3.5 py-1.5 text-xs font-medium text-[var(--bone-dim)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold-ink)]">
              {spec.title}
            </a>
          ))}
        </nav>
      )}

      <div className="space-y-8">
        {blocks.map(({ key, spec, data }) => (
          <BlockEditor
            key={key}
            blockKey={key}
            title={spec.title}
            description={spec.description}
            fields={spec.fields}
            initial={data as Record<string, unknown>}
          />
        ))}
      </div>
    </div>
  );
}
