import { describe, expect, it } from "vitest";

import { fakeContext } from "../../test-support/fakes";
import { validateRegisterUser, validateUpdateOwnProfile } from "./user.validator";

describe("validateRegisterUser", () => {
  it("normalises the contact and fixes password sign-in", async () => {
    const ctx = fakeContext({
      body: { name: " Asha ", email: " Asha@Example.COM ", password: "Long#enough" },
    });
    await validateRegisterUser(ctx);
    expect(ctx.body).toMatchObject({
      name: "Asha",
      email: "asha@example.com",
      loginMethod: "password",
    });
  });

  it.each(["isActive", "isEmailVerified", "loginMethod"])("refuses %s", async (field) => {
    const ctx = fakeContext({
      body: { name: "A", email: "a@example.com", password: "Long#enough", [field]: true },
    });
    await expect(async () => validateRegisterUser(ctx)).rejects.toThrow(`'${field}'`);
  });

  it("needs an email or a phone", async () => {
    const ctx = fakeContext({ body: { name: "A", password: "Long#enough" } });
    await expect(async () => validateRegisterUser(ctx)).rejects.toThrow(/email or a phone/);
  });

  it("needs a long enough password", async () => {
    const ctx = fakeContext({ body: { name: "A", email: "a@example.com", password: "short" } });
    await expect(async () => validateRegisterUser(ctx)).rejects.toThrow(/password/);
  });
});

describe("validateUpdateOwnProfile", () => {
  it("accepts name, email and phone, normalised", async () => {
    const ctx = fakeContext({ body: { phone: "+91 98765-43210" } });
    await validateUpdateOwnProfile(ctx);
    expect(ctx.body).toEqual({ phone: "+919876543210" });
  });

  it.each(["isActive", "loginMethod", "isEmailVerified", "password"])(
    "refuses %s, even alongside allowed fields",
    async (field) => {
      const ctx = fakeContext({ body: { name: "A", [field]: true } });
      await expect(async () => validateUpdateOwnProfile(ctx)).rejects.toThrow(`'${field}'`);
    },
  );

  it("needs at least one field", async () => {
    await expect(async () => validateUpdateOwnProfile(fakeContext({ body: {} }))).rejects.toThrow(
      /at least one/,
    );
  });
});
