import { db } from "@/lib/db";
import GalleryManager, { type GalleryInput } from "@/components/admin/GalleryManager";
import { TrashBar, TrashRowActions } from "@/components/admin/TrashActions";

export const metadata = { title: "Gallery" };

export default async function AdminGallery({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const isTrash = view === "trash";
  const [rows, allCount, trashCount] = await Promise.all([
    db.galleryItem.findMany({ where: { deletedAt: isTrash ? { not: null } : null }, orderBy: { sort: "asc" } }),
    db.galleryItem.count({ where: { deletedAt: null } }),
    db.galleryItem.count({ where: { deletedAt: { not: null } } }),
  ]);

  const items: GalleryInput[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    sector: r.sector,
    image: r.image,
    category: r.category,
    type: r.type,
    youtubeId: r.youtubeId,
    tall: r.tall,
    published: r.published,
    sort: r.sort,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Gallery</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          The grid on /gallery. Video items autoplay muted in view and play with sound in the lightbox — paste the YouTube ID (the 11 characters after <code className="font-mono">watch?v=</code>).
        </p>
      </div>

      <TrashBar basePath="/admin/gallery" view={isTrash ? "trash" : "all"} allCount={allCount} trashCount={trashCount} />

      {isTrash ? (
        <ul className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-4 px-5 py-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.image} alt="" className="h-11 w-16 shrink-0 rounded-md border border-[var(--line)] object-cover" />
              <span className="min-w-0 flex-1 truncate font-medium">{r.title}</span>
              <TrashRowActions model="galleryItem" id={r.id} title={r.title} />
            </li>
          ))}
          {rows.length === 0 && <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">Trash is empty.</li>}
        </ul>
      ) : (
        <GalleryManager items={items} />
      )}
    </div>
  );
}
