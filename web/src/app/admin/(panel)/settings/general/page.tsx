import { specFor } from "@/lib/pageRegistry";
import { getBlock } from "@/lib/content";
import { requireOwner } from "@/lib/auth";
import BlockEditor from "@/components/admin/BlockEditor";

export const metadata = { title: "Settings" };

export default async function AdminSettings() {
  await requireOwner();
  const site = await getBlock("site");
  const nav = await getBlock("nav");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Brand, contact details, SEO, footer, and navigation labels — used across every page.</p>
      </div>
      <BlockEditor blockKey="site" title={specFor("site")!.title} description={specFor("site")!.description} fields={specFor("site")!.fields} initial={site as Record<string, unknown>} />
      <BlockEditor blockKey="nav" title={specFor("nav")!.title} fields={specFor("nav")!.fields} initial={nav as Record<string, unknown>} />
    </div>
  );
}
