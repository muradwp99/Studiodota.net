import { describe, it, expect } from "vitest";
import { validateFields } from "./validateFields";
import type { FieldSpec } from "./pageRegistry";

const fields: FieldSpec[] = [
  { kind: "select", key: "direction", label: "Direction", options: [{ value: "column", label: "Stack" }, { value: "row", label: "Row" }] },
];

describe("validateFields select", () => {
  it("keeps an allowed value", () => {
    expect(validateFields(fields, { direction: "row" }, { direction: "column" })).toEqual({ direction: "row" });
  });
  it("falls back to the default for a disallowed value", () => {
    expect(validateFields(fields, { direction: "diagonal" }, { direction: "column" })).toEqual({ direction: "column" });
  });
  it("falls back to the first option when no default is valid", () => {
    expect(validateFields(fields, {}, {})).toEqual({ direction: "column" });
  });
});
