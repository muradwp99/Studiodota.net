import { specFor } from "@/lib/pageRegistry";
import { getBlockAdmin } from "@/lib/content";
import { requireOwner } from "@/lib/auth";
import BlockEditor from "@/components/admin/BlockEditor";

export const metadata = { title: "SEO" };

export default async function AdminSeo() {
  await requireOwner();
  const { data, draft, snapshotAt, updatedAt } = await getBlockAdmin("seo");
  const spec = specFor("seo")!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">SEO</h1>
        <p className="mt-1 max-w-[60ch] text-sm text-[var(--muted)]">
          Site-wide search &amp; social defaults. Each page, project, and post can override its own
          title, description, and share image in its own editor.
        </p>
      </div>
      <BlockEditor
        blockKey="seo"
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
