import { describe, expect, it } from "vitest";

import { configuration } from "../../config/configuration";
import { UserService } from "../user/user.service";
import { ProfileService } from "./profile.service";
import { SettingsRepository } from "./settings.repository";
import { UserSettings } from "./types/profile.type";

function setup() {
  const saved = new Map<string, UserSettings>();
  const repo = {
    find: async (userId: string) => saved.get(userId) ?? null,
    save: async (userId: string, settings: UserSettings) => {
      saved.set(userId, settings);
      return settings;
    },
  } as unknown as SettingsRepository;
  return { service: new ProfileService({} as UserService, repo), saved };
}

describe("ProfileService settings", () => {
  it("answers with the defaults until the user changes something", async () => {
    const { service, saved } = setup();
    await expect(service.getSettings("u1")).resolves.toEqual(configuration.userDefaults);
    expect(saved.size).toBe(0);
  });

  it("changes only the settings sent", async () => {
    const { service } = setup();
    await service.updateSettings("u1", { currency: "USD" });
    const settings = await service.updateSettings("u1", { weekStartsOn: 0 });

    expect(settings).toEqual({ ...configuration.userDefaults, currency: "USD", weekStartsOn: 0 });
  });

  it("keeps each user's settings apart, and never changes the defaults", async () => {
    const { service } = setup();
    await service.updateSettings("u1", { currency: "USD" });

    await expect(service.getSettings("u2")).resolves.toMatchObject({ currency: "INR" });
    expect(configuration.userDefaults.currency).toBe("INR");
  });
});
