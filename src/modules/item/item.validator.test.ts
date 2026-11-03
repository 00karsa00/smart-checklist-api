import { describe, expect, it } from "vitest";

import { fakeContext } from "../../test/fake-context";
import { validateCreateItem, validateUpdateItem } from "./item.validator";

describe("validateCreateItem", () => {
  it("accepts a name with an optional description", () => {
    expect(() => validateCreateItem(fakeContext({ body: { name: "A" } }))).not.toThrow();
    expect(() =>
      validateCreateItem(fakeContext({ body: { name: "A", description: null } })),
    ).not.toThrow();
  });

  it("requires a name of at most 100 characters", () => {
    expect(() => validateCreateItem(fakeContext())).toThrow(
      "Field 'name' is required and must be a non-empty string.",
    );
    expect(() => validateCreateItem(fakeContext({ body: { name: "x".repeat(101) } }))).toThrow(
      "Field 'name' must not exceed 100 characters.",
    );
  });

  it("refuses ownership fields from the client", () => {
    expect(() => validateCreateItem(fakeContext({ body: { name: "A", userId: "x" } }))).toThrow(
      "Field 'userId' cannot be set by the client.",
    );
  });
});

describe("validateUpdateItem", () => {
  it("needs at least one field", () => {
    expect(() => validateUpdateItem(fakeContext({ body: {} }))).toThrow(
      "Request body must include at least one of: 'name', 'description'.",
    );
  });

  it("refuses an empty name", () => {
    expect(() => validateUpdateItem(fakeContext({ body: { name: " " } }))).toThrow(
      "Field 'name' must be a non-empty string.",
    );
  });
});
