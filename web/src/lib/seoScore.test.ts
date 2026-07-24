import { describe, it, expect } from "vitest";
import { analyzeSeo, sanitizeSeo } from "./seoScore";

describe("analyzeSeo", () => {
  it("scores a well-optimized entry high", () => {
    const r = analyzeSeo({
      seoTitle: "Senior Housing Architect in Fontana, California",
      seoDescription: "We design accessible, shaded senior housing across Southern California — from massing to construction documents for developers and cities.",
      focusKeyword: "senior housing",
      slug: "senior-housing-fontana",
      content: "Senior housing designed around accessibility and community. ".repeat(12),
    });
    expect(r.score).toBeGreaterThanOrEqual(80);
    expect(r.checks.find((c) => c.id === "kw-title")?.status).toBe("good");
  });

  it("scores an empty entry poorly", () => {
    const r = analyzeSeo({});
    expect(r.score).toBeLessThan(50);
    expect(r.checks.find((c) => c.id === "title-set")?.status).toBe("bad");
  });
});

describe("sanitizeSeo", () => {
  it("keeps known keys, coerces bools, drops junk", () => {
    const s = sanitizeSeo({ title: "  Hi  ", noindex: true, nofollow: "yes", junk: 1 });
    expect(s.title).toBe("Hi");
    expect(s.noindex).toBe(true);
    expect(s.nofollow).toBe(false); // non-true → false
    expect((s as Record<string, unknown>).junk).toBeUndefined();
  });
});
