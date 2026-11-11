import { describe, expect, it } from "vitest";

import { dueCandidates, reminderCandidates } from "./task.reminders";

const now = { date: "2026-11-12", time: "14:30" };
type TaskTimes = Parameters<typeof dueCandidates>[0][number];
const task = (id: string, parts: Partial<TaskTimes> = {}): TaskTimes => ({
  id,
  title: id,
  status: "todo",
  dueDate: null,
  dueTime: null,
  remindAt: null,
  ...parts,
});

describe("reminderCandidates", () => {
  it("reminds once the time has come, once per reminder time", () => {
    const list = reminderCandidates(
      [
        task("past", { remindAt: "2026-11-12T09:00" }),
        task("now", { remindAt: "2026-11-12T14:30" }),
        task("later", { remindAt: "2026-11-12T15:00" }),
        task("done", { remindAt: "2026-11-11T09:00", status: "done" }),
        task("none"),
      ],
      now,
    );
    expect(list.map((item) => item.subjectId)).toEqual(["past", "now"]);
    expect(list[0]).toMatchObject({
      kind: "task_reminder",
      subjectType: "task",
      dedupeKey: "task_reminder:past:2026-11-12T09:00",
    });
  });
});

describe("dueCandidates", () => {
  it("says due today, then overdue once the date or time has passed", () => {
    const list = dueCandidates(
      [
        task("today", { dueDate: "2026-11-12" }),
        task("today-later", { dueDate: "2026-11-12", dueTime: "18:00" }),
        task("today-passed", { dueDate: "2026-11-12", dueTime: "09:00" }),
        task("yesterday", { dueDate: "2026-11-11" }),
        task("tomorrow", { dueDate: "2026-11-13" }),
        task("done", { dueDate: "2026-11-10", status: "done" }),
      ],
      now,
    );
    expect(list.map((item) => [item.subjectId, item.kind])).toEqual([
      ["today", "task_due"],
      ["today-later", "task_due"],
      ["today-passed", "task_overdue"],
      ["yesterday", "task_overdue"],
    ]);
    expect(list[3].dedupeKey).toBe("task_overdue:yesterday:2026-11-11");
  });
});
