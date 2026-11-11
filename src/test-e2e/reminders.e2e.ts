import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { addDays } from "../common";
import { Api, startApi, todayIn } from "./support";

let api: Api;
beforeAll(async () => {
  api = await startApi();
});
afterAll(() => api.close());

// New users have the default time zone.
const today = todayIn("Asia/Kolkata");

describe("task reminders and due dates", () => {
  it("notifies reminders that have come, tasks due today and overdue ones, once", async () => {
    const { token } = await api.user();
    const add = (body: object) => api.send("POST", "/tasks", body, token);
    await add({ title: "Call the bank", remindAt: `${today}T00:00` });
    await add({ title: "Not yet", remindAt: `${addDays(today, 1)}T09:00` });
    await add({ title: "Pay rent", dueDate: today });
    await add({ title: "Send report", dueDate: addDays(today, -1) });
    await add({ title: "Already done", dueDate: addDays(today, -1), status: "done" });
    await add({ title: "Next week", dueDate: addDays(today, 7) });

    const list = await api.send("GET", "/notifications", undefined, token);
    const kinds = list.items.map((item: any) => `${item.kind}:${item.title}`).sort();
    expect(kinds).toEqual([
      "task_due:Pay rent",
      "task_overdue:Send report",
      "task_reminder:Call the bank",
    ]);
    const reminder = list.items.find((item: any) => item.kind === "task_reminder");
    expect(reminder).toMatchObject({ subjectType: "task", data: { remindAt: `${today}T00:00` } });
    expect((await api.send("GET", "/notifications", undefined, token)).pagination.total).toBe(3);
  });

  it("lists both groups in settings, and muting one stops it", async () => {
    const { token } = await api.user();
    const settings = await api.send("GET", "/notifications/settings", undefined, token);
    expect(settings.groups).toEqual(expect.arrayContaining(["reminders", "due_dates"]));
    await api.send("PUT", "/notifications/settings", { muted: ["due_dates"] }, token);

    await api.send("POST", "/tasks", { title: "Late", dueDate: addDays(today, -2) }, token);
    await api.send("POST", "/tasks", { title: "Ping", remindAt: `${today}T00:00` }, token);
    const list = await api.send("GET", "/notifications", undefined, token);
    expect(list.items.map((item: any) => item.kind)).toEqual(["task_reminder"]);
  });

  it("moving a reminder later reminds again at the new time", async () => {
    const { token } = await api.user();
    const task = await api.send(
      "POST",
      "/tasks",
      { title: "Water plants", remindAt: `${addDays(today, -1)}T08:00` },
      token,
    );
    await api.send("GET", "/notifications", undefined, token);
    await api.send("PATCH", `/tasks/${task.id}`, { remindAt: `${today}T00:00` }, token);
    const list = await api.send("GET", "/notifications", undefined, token);
    expect(list.items.filter((item: any) => item.kind === "task_reminder")).toHaveLength(2);
  });
});
