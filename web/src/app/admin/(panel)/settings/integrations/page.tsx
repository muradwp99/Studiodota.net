import { specFor } from "@/lib/pageRegistry";
import { getBlockAdmin } from "@/lib/content";
import { requireOwner } from "@/lib/auth";
import BlockEditor from "@/components/admin/BlockEditor";

export const metadata = { title: "Integrations" };

export default async function AdminIntegrations() {
  await requireOwner();
  const { data, draft, snapshotAt, updatedAt } = await getBlockAdmin("integrations");
  const spec = specFor("integrations")!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Integrations &amp; tracking</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Analytics, marketing pixels, and custom code — added to the public site automatically. Paste an ID and it just works.
        </p>
      </div>
      <BlockEditor
        blockKey="integrations"
        title={spec.title}
        description={spec.description}
        fields={spec.fields}
        initial={data as Record<string, unknown>}
        draft={draft as Record<string, unknown> | null}
        snapshotAt={snapshotAt}
        updatedAt={updatedAt}
      />
      <p className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-xs text-[var(--muted)]">
        Enquiry email notifications also need SMTP details in the server&rsquo;s environment
        (<code className="font-mono">SMTP_HOST</code>, <code className="font-mono">SMTP_USER</code>, <code className="font-mono">SMTP_PASS</code>…). Until then, enquiries are still saved to Messages.
      </p>
    </div>
  );
}
