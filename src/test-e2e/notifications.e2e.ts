import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  candidate,
  registerNotificationSource,
} from "../modules/notification/notification.sources";
import { Api, startApi } from "./support";

let api: Api;
let token: string;
let userId: string;

// Two test sources stand in for real ones (task reminders, habits…): the API
// runs in this process, so they are asked on every read like any other.
const made: string[] = ["Pay rent", "Call mum"];
registerNotificationSource({
  group: "e2e-reminders",
  candidates: async (id, today) =>
    id === userId
      ? made.map((title, i) =>
          candidate(
            "task_due",
            { subjectType: "task", subjectId: uuid(i), title },
            { today },
            today,
          ),
        )
      : [],
});
registerNotificationSource({
  group: "e2e-habits",
  candidates: async (id) =>
    id === userId
      ? [candidate("habit_missed", { subjectType: "habit", subjectId: uuid(9), title: "Walk" }, {})]
      : [],
});
const uuid = (i: number) => `00000000-0000-4000-8000-00000000000${i}`;

beforeAll(async () => {
  api = await startApi();
  ({ token, id: userId } = await api.user());
});
afterAll(() => api.close());

const list = async (query = "") =>
  (await api.call("GET", `/notifications${query}`, undefined, token)).data;

describe("notifications", () => {
  it("adds what the sources report, once", async () => {
    const first = await list();
    expect(first.items.map((item: any) => item.title).sort()).toEqual([
      "Call mum",
      "Pay rent",
      "Walk",
    ]);
    expect(first.unreadCount).toBe(3);
    expect((await list()).pagination.total).toBe(3);
  });

  it("marks read, all read, and keeps deleted ones from coming back", async () => {
    const [item] = (await list()).items;
    expect(
      (await api.call("PATCH", `/notifications/${item.id}`, { read: true }, token)).data.readAt,
    ).not.toBeNull();
    expect((await list("?unread=true")).pagination.total).toBe(2);
    expect((await api.call("POST", "/notifications/read-all", undefined, token)).data.updated).toBe(
      2,
    );
    expect((await api.call("DELETE", `/notifications/${item.id}`, undefined, token)).status).toBe(
      200,
    );
    expect((await list()).pagination.total).toBe(2);
  });

  it("lists every group, and stops new ones for muted groups", async () => {
    const settings = await api.call("GET", "/notifications/settings", undefined, token);
    expect(settings.data.groups).toEqual(expect.arrayContaining(["e2e-reminders", "e2e-habits"]));
    const saved = await api.call(
      "PUT",
      "/notifications/settings",
      { muted: ["e2e-habits", "e2e-reminders", "e2e-habits"] },
      token,
    );
    expect(saved.data.muted).toEqual(["e2e-reminders", "e2e-habits"]);
    expect(
      (await api.call("PUT", "/notifications/settings", { muted: ["nope"] }, token)).status,
    ).toBe(400);
    made.push("Renew passport");
    expect((await list()).items.some((item: any) => item.title === "Renew passport")).toBe(false);
  });
});
