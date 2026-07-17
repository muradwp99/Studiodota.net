import { db } from "@/lib/db";
import GalleryManager, { type GalleryInput } from "@/components/admin/GalleryManager";

export const metadata = { title: "Gallery" };

export default async function AdminGallery() {
  const rows = await db.galleryItem.findMany({ orderBy: { sort: "asc" } });
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
      <GalleryManager items={items} />
    </div>
  );
}
