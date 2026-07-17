/* Seeds the CMS with the site's current content. Idempotent: existing rows
 * (i.e. content already edited in the admin) are left untouched.
 * Run: npx prisma db seed   (env: ADMIN_EMAIL / ADMIN_PASSWORD for the login) */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BLOCK_DEFAULTS, SEED_PROJECTS, SEED_GALLERY, SEED_MEDIA } from "../src/content/defaults";
import { posts } from "../src/content/site";

const db = new PrismaClient();
const R = (n: string) => `/media/renders/${n}.jpg`;

async function main() {
  // 1) Admin user
  const email = (process.env.ADMIN_EMAIL ?? "admin@studiodota.net").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "studiodota-admin-2026";
  const existing = await db.user.findUnique({ where: { email } });
  if (!existing) {
    await db.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 12), name: "Studiodota Admin" },
    });
    console.log(`Admin user created: ${email} (password from ADMIN_PASSWORD in web/.env)`);
  } else {
    console.log(`Admin user already exists: ${email}`);
  }

  // 2) Blocks (create only when missing — never clobber edits)
  for (const [key, data] of Object.entries(BLOCK_DEFAULTS)) {
    const found = await db.block.findUnique({ where: { key } });
    if (!found) await db.block.create({ data: { key, data: structuredClone(data) } });
  }
  console.log(`Blocks ensured: ${Object.keys(BLOCK_DEFAULTS).length}`);

  // 3) Projects
  for (const p of SEED_PROJECTS) {
    const found = await db.project.findUnique({ where: { slug: p.slug } });
    if (!found) await db.project.create({ data: { ...p, interiorImage: p.slug === "atelier-house" ? R("interior") : "" } });
  }

  // 4) Posts (from the typed content layer)
  for (const p of posts) {
    const found = await db.post.findUnique({ where: { slug: p.slug } });
    if (!found) {
      await db.post.create({
        data: {
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          category: p.category,
          date: p.date,
          readingTime: p.readingTime,
          image: R(p.image),
          inlineImage: p.inlineImage ? R(p.inlineImage) : "",
          authorName: p.author.name,
          authorRole: p.author.role,
          intro: p.intro,
          sections: p.sections,
        },
      });
    }
  }

  // 5) Gallery
  const galleryCount = await db.galleryItem.count();
  if (galleryCount === 0) {
    for (const g of SEED_GALLERY) await db.galleryItem.create({ data: g });
  }

  // 6) Media registry (existing public assets, so pickers can browse them)
  for (const m of SEED_MEDIA) {
    await db.media.upsert({ where: { path: m.path }, update: {}, create: { ...m, mime: m.path.endsWith(".png") ? "image/png" : "image/jpeg" } });
  }

  const counts = {
    projects: await db.project.count(),
    posts: await db.post.count(),
    gallery: await db.galleryItem.count(),
    media: await db.media.count(),
    blocks: await db.block.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
