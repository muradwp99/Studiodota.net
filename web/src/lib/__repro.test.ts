import { describe, it, expect } from "vitest";
import { validateFields } from "./validateFields";
import { specFor } from "./pageRegistry";
import { BLOCK_DEFAULTS } from "@/content/defaults";

describe("repro: 700-char paragraph in featured[].paragraphs", () => {
  it("shows what publishBlock stores", () => {
    const spec = specFor("page.clientVoices")!;
    const defaults = BLOCK_DEFAULTS["page.clientVoices" as keyof typeof BLOCK_DEFAULTS] as Record<string, unknown>;
    const long = "A".repeat(700);
    const ok = "B".repeat(400);
    const input = {
      ...(defaults as object),
      featured: [{ name: "Julio Vargas", role: "President", image: "", paragraphs: [long, ok] }],
    };
    const out = validateFields(spec.fields, input, defaults) as any;
    console.log("paragraph count in:", 2, "out:", out.featured[0].paragraphs.length);
    console.log("lengths out:", out.featured[0].paragraphs.map((p: string) => p.length));

    const onlyLong = { ...(defaults as object), featured: [{ name: "Julio Vargas", role: "P", image: "", paragraphs: [long] }] };
    const out2 = validateFields(spec.fields, onlyLong, defaults) as any;
    console.log("only-long entry paragraphs:", JSON.stringify(out2.featured[0].paragraphs));
    expect(true).toBe(true);
  });
});
