import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BLOCK_DEFAULTS, PROJECT_VIDEOS } from "@/content/defaults";

const PUBLIC = path.join(process.cwd(), "public");
const SRC = path.join(process.cwd(), "src");

/** Every `/media/....mp4` literal referenced anywhere under src/. */
function referencedVideos(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry) || entry.endsWith(".test.ts")) continue;
      for (const [, url] of readFileSync(full, "utf8").matchAll(/["'`](\/media\/[^"'`]+\.mp4)["'`]/g)) {
        found.set(url, [...(found.get(url) ?? []), path.relative(SRC, full)]);
      }
    }
  };
  walk(SRC);
  return found;
}

describe("video wiring", () => {
  it("every /media mp4 referenced in src/ exists in public/", () => {
    const missing = [...referencedVideos()]
      .filter(([url]) => !existsSync(path.join(PUBLIC, url)))
      .map(([url, files]) => `${url} <- ${files.join(", ")}`);
    expect(missing).toEqual([]);
  });

  it("every PROJECT_VIDEOS file exists", () => {
    const missing = Object.entries(PROJECT_VIDEOS).filter(([, url]) => !existsSync(path.join(PUBLIC, url)));
    expect(missing).toEqual([]);
  });

  it("no delivered flythrough sits unused in public/media", () => {
    const referenced = new Set(referencedVideos().keys());
    const orphans = readdirSync(path.join(PUBLIC, "media"))
      .filter((f) => f.endsWith(".mp4") && !referenced.has(`/media/${f}`));
    expect(orphans).toEqual([]);
  });

  it("showreel defaults ship with motion wired, not empty mp4 fields", () => {
    const items = BLOCK_DEFAULTS["home.showreel"].items;
    expect(items.length).toBeGreaterThan(0);
    expect(items.filter((i) => !i.mp4 && !i.youtubeId).map((i) => i.title)).toEqual([]);
  });
});
