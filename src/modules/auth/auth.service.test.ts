import { afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODES } from "../../common";
import { configuration } from "../../config/configuration";
import { verifyToken } from "../../infrastructure/token";
import { CLIENT, fakeSecrets } from "../../test-support/fakes";
import { UserRepository } from "../user/user.repository";
import { UserService } from "../user/user.service";
import { AppUser } from "../user/types/user.type";
import { AuthService } from "./auth.service";

function setup() {
  const users = new Map<string, AppUser>();
  const fakes = fakeSecrets();
  const repo = {
    // Like the real repository: the account and its password hash are saved together.
    create: async ({ passwordHash, ...data }: Omit<AppUser, "id"> & { passwordHash?: string }) => {
      const user = { ...data, id: `user-${users.size + 1}` } as AppUser;
      users.set(user.id, user);
      if (passwordHash) fakes.passwords.hashes.set(user.id, passwordHash);
      return user;
    },
    findById: async (id: string) => users.get(id) ?? null,
    findBySignInIdentifier: async (identifier: string) =>
      [...users.values()].find((user) => user.email === identifier) ?? null,
  } as unknown as UserRepository;
  return { auth: new AuthService(), directory: new UserService(repo, fakes.secrets), fakes, users };
}

const NEW_USER = { name: "Asha", email: "asha@example.com", password: "Long#enough" };

describe("AuthService", () => {
  const allowRegistration = configuration.auth.allowRegistration;
  afterEach(() => {
    configuration.auth.allowRegistration = allowRegistration;
  });

  it("registers a user and signs them in", async () => {
    const { auth, directory, fakes } = setup();
    const result = await auth.register(directory, NEW_USER, CLIENT);

    expect(result.user).toMatchObject({ name: "Asha", loginMethod: "password" });
    expect(result.refreshToken).toBeTruthy();
    expect(await fakes.secrets.passwordMatches(result.user.id, NEW_USER.password)).toBe(true);
  });

  it("refuses registration when it is turned off", async () => {
    configuration.auth.allowRegistration = false;
    const { auth, directory } = setup();
    await expect(auth.register(directory, NEW_USER, CLIENT)).rejects.toMatchObject({
      statusCode: 403,
      code: ERROR_CODES.REGISTRATION_DISABLED,
    });
  });

  it("issues access tokens that name their session, and logs the sign-in", async () => {
    const { auth, directory, fakes, users } = setup();
    const { user } = await auth.register(directory, NEW_USER, CLIENT);

    const login = await auth.login(directory, NEW_USER.email, NEW_USER, CLIENT);
    const check = verifyToken(login.accessToken);

    expect(check.ok && check.claims).toMatchObject({ sub: user.id, kind: "user" });
    expect(check.ok && check.claims.sid).toBeTruthy();
    expect(fakes.logins.at(-1)).toMatchObject({ accountId: user.id, isSuccess: true });
    expect(users.size).toBe(1);
  });

  it("refreshes into a new pair, then refuses the old refresh token once the grace period ends", async () => {
    vi.useFakeTimers();
    try {
      const { auth, directory } = setup();
      const first = await auth.register(directory, NEW_USER, CLIENT);

      const second = await auth.refresh(directory, first.refreshToken, CLIENT);
      expect(second.refreshToken).not.toBe(first.refreshToken);
      expect(second.user.id).toBe(first.user.id);

      vi.advanceTimersByTime(2 * 60 * 1000);
      await expect(auth.refresh(directory, first.refreshToken, CLIENT)).rejects.toMatchObject({
        statusCode: 401,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("refuses to refresh a deactivated account", async () => {
    const { auth, directory, users } = setup();
    const first = await auth.register(directory, NEW_USER, CLIENT);
    users.get(first.user.id)!.isActive = false;

    await expect(auth.refresh(directory, first.refreshToken, CLIENT)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("logs out, and logging out again still succeeds", async () => {
    const { auth, directory } = setup();
    const session = await auth.register(directory, NEW_USER, CLIENT);

    await expect(auth.logout(directory, session.refreshToken)).resolves.toBeNull();
    await expect(auth.logout(directory, session.refreshToken)).resolves.toBeNull();
    await expect(auth.refresh(directory, session.refreshToken, CLIENT)).rejects.toBeTruthy();
  });
});
