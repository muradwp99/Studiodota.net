import { describe, it, expect } from "vitest";

describe("vitest wiring", () => {
  it("runs and resolves basic assertions", () => {
    expect(1 + 1).toBe(2);
  });
});
