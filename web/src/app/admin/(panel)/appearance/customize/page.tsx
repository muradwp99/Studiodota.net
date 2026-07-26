import Link from "next/link";
import { specFor } from "@/lib/pageRegistry";
import { getBlockAdmin } from "@/lib/content";
import { requireOwner } from "@/lib/auth";
import BlockEditor from "@/components/admin/BlockEditor";

export const metadata = { title: "Customize" };

export default async function AdminCustomize() {
  await requireOwner();
  const site = await getBlockAdmin("site");
  const spec = specFor("site")!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Customize</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Site identity — name, contact details, SEO, footer.</p>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/appearance/menus" className="rounded-full border border-[var(--line-strong)] px-4 py-2 hover:border-[var(--gold)] hover:text-[var(--gold-ink)]">Menus →</Link>
        <Link href="/admin/pages/home" className="rounded-full border border-[var(--line-strong)] px-4 py-2 hover:border-[var(--gold)] hover:text-[var(--gold-ink)]">Homepage sections →</Link>
        <Link href="/admin/settings/general" className="rounded-full border border-[var(--line-strong)] px-4 py-2 hover:border-[var(--gold)] hover:text-[var(--gold-ink)]">Settings →</Link>
      </div>
      <BlockEditor
        blockKey="site"
        title={spec.title}
        description={spec.description}
        fields={spec.fields}
        initial={site.data as Record<string, unknown>}
        draft={site.draft as Record<string, unknown> | null}
        snapshotAt={site.snapshotAt}
        updatedAt={site.updatedAt}
      />
    </div>
  );
}
