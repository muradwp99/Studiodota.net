import { describe, it, expect } from "vitest";
import { resolveAt, writeSlot, clearSlot, hasSlot } from "./responsive";

describe("resolveAt (cascaded)", () => {
  it("scalar applies at every breakpoint", () => {
    expect(resolveAt(10, "base")).toBe(10);
    expect(resolveAt(10, "tablet")).toBe(10);
    expect(resolveAt(10, "mobile")).toBe(10);
  });
  it("cascades base -> tablet -> mobile", () => {
    const v = { base: 10, tablet: 8 };
    expect(resolveAt(v, "base")).toBe(10);
    expect(resolveAt(v, "tablet")).toBe(8);
    expect(resolveAt(v, "mobile")).toBe(8); // inherits tablet
  });
  it("mobile-only value is invisible at base/tablet", () => {
    const v = { mobile: 4 };
    expect(resolveAt(v, "base")).toBeUndefined();
    expect(resolveAt(v, "tablet")).toBeUndefined();
    expect(resolveAt(v, "mobile")).toBe(4);
  });
  it("treats a non-slot object (e.g. a padding box) as a scalar", () => {
    const box = { top: 10, unit: "px" };
    expect(resolveAt(box, "mobile")).toEqual(box);
  });
});

describe("writeSlot", () => {
  it("base write on empty/scalar stays scalar", () => {
    expect(writeSlot(undefined, "base", 20)).toBe(20);
    expect(writeSlot(10, "base", 20)).toBe(20);
  });
  it("base write on a slot object updates .base", () => {
    expect(writeSlot({ base: 10, mobile: 4 }, "base", 20)).toEqual({ base: 20, mobile: 4 });
  });
  it("non-base write on a scalar preserves it as base", () => {
    expect(writeSlot(10, "mobile", 4)).toEqual({ base: 10, mobile: 4 });
  });
  it("non-base write on empty creates a slot-only object", () => {
    expect(writeSlot(undefined, "tablet", 8)).toEqual({ tablet: 8 });
    expect(writeSlot("", "tablet", 8)).toEqual({ tablet: 8 });
  });
  it("non-base write on a slot object sets the slot", () => {
    expect(writeSlot({ base: 10 }, "mobile", 4)).toEqual({ base: 10, mobile: 4 });
  });
});

describe("clearSlot", () => {
  it("clears a slot and keeps the rest", () => {
    expect(clearSlot({ base: 10, mobile: 4 }, "mobile")).toBe(10); // collapses {base:10}
    expect(clearSlot({ base: 10, tablet: 8, mobile: 4 }, "mobile")).toEqual({ base: 10, tablet: 8 });
  });
  it("clearing the last slot removes the value", () => {
    expect(clearSlot({ mobile: 4 }, "mobile")).toBeUndefined();
  });
  it("base-clear on a scalar clears it", () => {
    expect(clearSlot(10, "base")).toBeUndefined();
  });
  it("non-base clear on a scalar is a no-op", () => {
    expect(clearSlot(10, "mobile")).toBe(10);
  });
});

describe("hasSlot", () => {
  it("reports explicit slots only", () => {
    expect(hasSlot({ base: 10, mobile: 4 }, "mobile")).toBe(true);
    expect(hasSlot({ base: 10 }, "mobile")).toBe(false);
    expect(hasSlot(10, "mobile")).toBe(false);
    expect(hasSlot(10, "base")).toBe(true);
    expect(hasSlot(undefined, "base")).toBe(false);
  });
});

describe("falsy values (0 and empty string)", () => {
  it("an explicit 0 slot resolves as 0, not the parent value", () => {
    expect(resolveAt({ base: 10, mobile: 0 }, "mobile")).toBe(0);
    expect(resolveAt(0, "tablet")).toBe(0);
  });
  it("writeSlot preserves a scalar 0 as base", () => {
    expect(writeSlot(0, "mobile", 4)).toEqual({ base: 0, mobile: 4 });
  });
  it("hasSlot: scalar 0 counts as base-set", () => {
    expect(hasSlot(0, "base")).toBe(true);
  });
  it("a raw empty-string scalar resolves as unset", () => {
    expect(resolveAt("", "base")).toBeUndefined();
    expect(resolveAt("", "mobile")).toBeUndefined();
  });
});
