import { describe, expect, it } from "vitest";

import { fakeContext } from "../../test-support/fakes";
import { validateChangePassword } from "./account.validator";

const run = (body: Record<string, unknown>) => () => validateChangePassword(fakeContext({ body }));

describe("validateChangePassword", () => {
  it("accepts the current and a valid new password", () => {
    expect(run({ currentPassword: "anything", newPassword: "Long#enough" })).not.toThrow();
  });

  it("requires the current password", () => {
    expect(run({ newPassword: "Long#enough" })).toThrow(/currentPassword/);
  });

  it("names newPassword when it is too short", () => {
    expect(run({ currentPassword: "x", newPassword: "short" })).toThrow(/'newPassword'/);
  });
});
