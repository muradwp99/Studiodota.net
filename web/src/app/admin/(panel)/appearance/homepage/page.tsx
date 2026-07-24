import Link from "next/link";
import { getBlock } from "@/lib/content";
import HomeLayoutManager from "@/components/admin/HomeLayoutManager";

export const metadata = { title: "Homepage layout" };

export default async function AdminHomepageLayout() {
  const layout = await getBlock("home.layout");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Homepage layout</h1>
        <p className="mt-1 max-w-[60ch] text-sm text-[var(--muted)]">
          Show, hide, and reorder the sections of the homepage. The hero always stays at the top.
          Edit the content of each section under{" "}
          <Link href="/admin/pages/home" className="text-[var(--gold-ink)] hover:underline">Pages → Homepage</Link>.
        </p>
      </div>
      <HomeLayoutManager initial={layout.sections} />
    </div>
  );
}
