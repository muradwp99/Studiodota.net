import { db } from "@/lib/db";
import MediaManager from "@/components/admin/MediaManager";

export const metadata = { title: "Media" };

export default async function AdminMedia() {
  const rows = await db.media.findMany({ orderBy: { createdAt: "desc" } });
  const items = rows.map((m) => ({
    id: m.id,
    path: m.path,
    alt: m.alt,
    size: m.size,
    mime: m.mime,
    deletable: m.path.startsWith("/uploads/"),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Media</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Upload images here, then pick them anywhere with the Browse button (or paste the path).</p>
      </div>
      <MediaManager items={items} />
    </div>
  );
}
