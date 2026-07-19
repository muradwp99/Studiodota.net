import { db } from "@/lib/db";
import { getBlock } from "@/lib/content";
import CategoriesManager from "@/components/admin/CategoriesManager";

export const metadata = { title: "Categories" };

export default async function AdminCategories() {
  const [{ postCategories }, grouped] = await Promise.all([
    getBlock("taxonomies"),
    db.post.groupBy({ by: ["category"], _count: { category: true } }).catch(() => []),
  ]);
  const counts: Record<string, number> = {};
  for (const g of grouped) counts[g.category] = g._count.category;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Categories</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Organise journal posts. Renaming a category updates every post that uses it.</p>
      </div>
      <CategoriesManager categories={postCategories} counts={counts} />
    </div>
  );
}
