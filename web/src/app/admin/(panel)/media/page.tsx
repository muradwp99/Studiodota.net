import { db } from "@/lib/db";
import MediaManager from "@/components/admin/MediaManager";
import { TrashBar, TrashRowActions } from "@/components/admin/TrashActions";

export const metadata = { title: "Media" };

export default async function AdminMedia({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const isTrash = view === "trash";
  const [rows, allCount, trashCount] = await Promise.all([
    db.media.findMany({ where: { deletedAt: isTrash ? { not: null } : null }, orderBy: { createdAt: "desc" } }),
    db.media.count({ where: { deletedAt: null } }),
    db.media.count({ where: { deletedAt: { not: null } } }),
  ]);

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

      <TrashBar basePath="/admin/media" view={isTrash ? "trash" : "all"} allCount={allCount} trashCount={trashCount} />

      {isTrash ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((m) => (
            <figure key={m.id} className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.path} alt={m.alt} className="aspect-[4/3] w-full object-cover opacity-60" loading="lazy" />
              <figcaption className="space-y-2 p-3">
                <div className="truncate font-mono text-[0.62rem] text-[var(--muted)]" title={m.path}>{m.path}</div>
                <TrashRowActions model="media" id={m.id} title={m.path} />
              </figcaption>
            </figure>
          ))}
          {rows.length === 0 && <p className="col-span-full py-8 text-center text-sm text-[var(--muted)]">Trash is empty.</p>}
        </div>
      ) : (
        <MediaManager items={items} />
      )}
    </div>
  );
}
