import { specFor } from "@/lib/pageRegistry";
import { getBlockAdmin } from "@/lib/content";
import { requireOwner } from "@/lib/auth";
import BlockEditor from "@/components/admin/BlockEditor";

export const metadata = { title: "Menus" };

export default async function AdminMenus() {
  await requireOwner();
  const { data, draft, snapshotAt, updatedAt } = await getBlockAdmin("menus");
  const spec = specFor("menus")!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Menus</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          The header navigation and the footer Pages column. Items linking to /services, /gallery, or /projects keep their
          dropdown panels automatically — add any other link (like a page you built, e.g. <code className="font-mono">/my-new-page</code>) as a plain menu item.
        </p>
      </div>
      <BlockEditor
        blockKey="menus"
        title={spec.title}
        description={spec.description}
        fields={spec.fields}
        initial={data as Record<string, unknown>}
        draft={draft as Record<string, unknown> | null}
        snapshotAt={snapshotAt}
        updatedAt={updatedAt}
      />
    </div>
  );
}
