import { describe, it, expect } from "vitest";
import { insertIndexFor, reorderIndexFor } from "./dnd";

describe("insertIndexFor", () => {
  it("inserts before the hovered index", () => {
    expect(insertIndexFor(2, "before")).toBe(2);
    expect(insertIndexFor(0, "before")).toBe(0);
  });
  it("inserts after the hovered index", () => {
    expect(insertIndexFor(2, "after")).toBe(3);
    expect(insertIndexFor(0, "after")).toBe(1);
  });
});

describe("reorderIndexFor", () => {
  it("moving down: target shifts left by one after removal", () => {
    // drag item 0 to after item 3 -> lands at index 3
    expect(reorderIndexFor(0, 3, "after")).toBe(3);
    // drag item 1 to before item 4 -> insert idx 4, from<4 -> 3
    expect(reorderIndexFor(1, 4, "before")).toBe(3);
  });
  it("moving up: target unaffected by removal", () => {
    // drag item 5 to before item 2 -> 2
    expect(reorderIndexFor(5, 2, "before")).toBe(2);
    // drag item 4 to after item 1 -> insert idx 2, from(4)>=2 -> 2
    expect(reorderIndexFor(4, 1, "after")).toBe(2);
  });
  it("dropping onto itself is a no-op index", () => {
    expect(reorderIndexFor(2, 2, "before")).toBe(2);
    expect(reorderIndexFor(2, 2, "after")).toBe(2);
  });
});
