import { describe, expect, it } from "vitest";

import { compareProjects, isOverdue } from "./project.order";
import { ProjectSummary } from "./types/workspace.type";

const project = (name: string, parts: Partial<ProjectSummary> = {}): ProjectSummary => ({
  id: name,
  workspaceId: "w",
  name,
  description: null,
  color: null,
  status: "active",
  dueDate: null,
  isArchived: false,
  overdue: false,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  ...parts,
});

describe("compareProjects", () => {
  it("lists open work first, soonest due first, archived last", () => {
    const list = [
      project("Old", { isArchived: true }),
      project("Done", { status: "completed", dueDate: "2026-01-01" }),
      project("Paused", { status: "on_hold" }),
      project("No date"),
      project("Later", { dueDate: "2026-12-01" }),
      project("Soon", { dueDate: "2026-11-20" }),
      project("Also no date"),
    ];
    expect(list.sort(compareProjects).map((item) => item.name)).toEqual([
      "Soon",
      "Later",
      "Also no date",
      "No date",
      "Paused",
      "Done",
      "Old",
    ]);
  });
});

describe("isOverdue", () => {
  it("is past due and not completed", () => {
    const today = "2026-11-12";
    expect(isOverdue({ dueDate: "2026-11-11", status: "active" }, today)).toBe(true);
    expect(isOverdue({ dueDate: "2026-11-12", status: "active" }, today)).toBe(false);
    expect(isOverdue({ dueDate: "2026-11-11", status: "completed" }, today)).toBe(false);
    expect(isOverdue({ dueDate: null, status: "on_hold" }, today)).toBe(false);
  });
});
