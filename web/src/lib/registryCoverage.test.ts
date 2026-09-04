import { describe, it, expect } from "vitest";
import { BLOCK_SPECS, specFor } from "./pageRegistry";
import { validateFields, ValidationError, MAX_TEXT, MAX_TEXTAREA, MAX_LIST } from "./validateFields";
import { BLOCK_DEFAULTS } from "@/content/defaults";

const keysOf = (fields: { key: string }[]) => new Set(fields.map((f) => f.key));

describe("registry covers defaults", () => {
  for (const spec of BLOCK_SPECS) {
    it(`${spec.key}`, () => {
      const defaults = BLOCK_DEFAULTS[spec.key as keyof typeof BLOCK_DEFAULTS] as Record<string, unknown>;
      const covered = keysOf(spec.fields);
      const missing = Object.keys(defaults ?? {}).filter((k) => !covered.has(k));
      expect(missing, `${spec.key} defaults keys with no spec field (dropped on save): ${missing.join(", ")}`).toEqual([]);
    });
  }
});

/* The validator used to lose stringList content silently: entries over
   MAX_TEXT were dropped by a .filter and entries past MAX_LIST by a .slice, so
   a save reported success with the text already gone. */
describe("stringList does not silently lose content", () => {
  const spec = [{ kind: "stringList" as const, key: "list", label: "List" }];
  const prose = [{ kind: "stringList" as const, key: "list", label: "Prose", maxLength: MAX_TEXTAREA }];
  const run = (fields: typeof spec, list: string[]) => validateFields(fields, { list }, { list: [] });

  it("rejects an over-length entry instead of dropping it", () => {
    expect(() => run(spec, ["ok", "x".repeat(MAX_TEXT + 1)])).toThrow(ValidationError);
  });

  it("rejects too many entries instead of truncating", () => {
    expect(() => run(spec, Array.from({ length: MAX_LIST + 1 }, (_, i) => `item ${i}`))).toThrow(ValidationError);
  });

  it("still drops blank entries — an empty admin row is not an error", () => {
    expect(run(spec, ["a", "   ", "b"]).list).toEqual(["a", "b"]);
  });

  it("keeps prose lists under the textarea cap", () => {
    const para = "p".repeat(MAX_TEXT + 200);
    expect((run(prose, [para]).list as string[])[0]).toHaveLength(para.length);
  });

  it("the shipped Client Voices paragraphs all validate", () => {
    const cv = BLOCK_DEFAULTS["page.clientVoices"] as { featured: { paragraphs: string[] }[] };
    const out = validateFields(specFor("page.clientVoices")!.fields, cv, cv) as { featured: { paragraphs: string[] }[] };
    expect(out.featured.map((f) => f.paragraphs.length)).toEqual(cv.featured.map((f) => f.paragraphs.length));
  });
});
