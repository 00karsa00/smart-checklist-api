import {
  between,
  containsText,
  notEqual,
  oneOf,
  requireAny,
  TaskModel,
  TaskTagModel,
  Where,
  withTransaction,
} from "../../infrastructure/database";

import { TaskStatus } from "./types/task.type";

/** A task as stored, before it is shaped for the API. */
export type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: number;
  dueDate: string | null;
  dueTime: string | null;
  remindAt: string | null;
  workspaceId: string | null;
  projectId: string | null;
  parentId: string | null;
  categoryId: string | null;
  tagIds: string[];
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** The stored columns a write may set. */
export type TaskFields = Partial<Omit<TaskRow, "id" | "tagIds" | "createdAt" | "updatedAt">>;

export type TaskFilter = {
  /** Tasks placed in this workspace directly, or in one of these projects. */
  placement?: { workspaceId: string; projectIds: string[] };
  projectId?: string;
  categoryId?: string;
  tagId?: string;
  status?: TaskStatus;
  /** Due dates in this inclusive range; `null` means no due date. */
  due?: { from?: string; to?: string } | null;
  search?: string;
  includeDone: boolean;
};

function toRow(row: TaskModel, tagIds: string[]): TaskRow {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    status: row.status as TaskStatus,
    priority: row.priority,
    dueDate: row.dueDate,
    dueTime: row.dueTime,
    remindAt: row.remindAt,
    workspaceId: row.workspaceId,
    projectId: row.projectId,
    parentId: row.parentId,
    categoryId: row.categoryId,
    tagIds,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Open first; then the nearest due date (none last), the highest priority, the oldest. */
const ORDER: [string, string][] = [
  ["completedAt", "DESC NULLS FIRST"],
  ["dueDate", "ASC NULLS LAST"],
  ["dueTime", "ASC NULLS LAST"],
  ["priority", "DESC"],
  ["createdAt", "ASC"],
];

/** Tasks, their subtasks and tags, always scoped by `userId`. */
export class TaskRepository {
  /** One page of top-level tasks. */
  async findPage(
    userId: string,
    filter: TaskFilter,
    offset: number,
    limit: number,
  ): Promise<{ rows: TaskRow[]; count: number }> {
    const where: Where = { userId, parentId: null };
    if (filter.placement) {
      const { workspaceId, projectIds } = filter.placement;
      requireAny(where, [{ workspaceId }, { projectId: oneOf(projectIds) }]);
    }
    if (filter.projectId) where.projectId = filter.projectId;
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.status) where.status = filter.status;
    else if (!filter.includeDone) where.status = notEqual("done");
    if (filter.due === null) where.dueDate = null;
    else if (filter.due) where.dueDate = between(filter.due.from, filter.due.to);
    if (filter.search) {
      requireAny(where, [
        { title: containsText(filter.search) },
        { notes: containsText(filter.search) },
      ]);
    }
    if (filter.tagId) {
      const tagged = await TaskTagModel.findAll({ where: { labelId: filter.tagId } });
      where.id = oneOf(tagged.map((link) => link.taskId));
    }
    const { rows, count } = await TaskModel.findAndCountAll({ where, order: ORDER, offset, limit });
    return { rows: await this.withTags(rows), count };
  }

  /**
   * Open tasks (subtasks too) due by `today`, or with a reminder at or before
   * `now` ("YYYY-MM-DDTHH:MM"): what reminders and due-date alerts look at.
   */
  async findNeedingAttention(userId: string, today: string, now: string): Promise<TaskRow[]> {
    const where: Where = { userId, status: notEqual("done") };
    requireAny(where, [
      { dueDate: between(undefined, today) },
      { remindAt: between(undefined, now) },
    ]);
    return this.withTags(await TaskModel.findAll({ where }));
  }

  async findById(id: string, userId: string): Promise<TaskRow | null> {
    const row = await TaskModel.findOne({ where: { id, userId } });
    return row ? (await this.withTags([row]))[0] : null;
  }

  async findChildren(parentId: string, userId: string): Promise<TaskRow[]> {
    const rows = await TaskModel.findAll({ where: { parentId, userId }, order: ORDER });
    return this.withTags(rows);
  }

  /** Subtasks done and in all, per parent. */
  async subtaskCounts(
    parentIds: readonly string[],
  ): Promise<Map<string, { done: number; total: number }>> {
    const counts = new Map<string, { done: number; total: number }>();
    if (parentIds.length === 0) return counts;
    const rows = await TaskModel.findAll({
      where: { parentId: oneOf(parentIds) },
      attributes: ["parentId", "status"],
    });
    for (const row of rows) {
      const count = counts.get(row.parentId!) ?? { done: 0, total: 0 };
      count.total += 1;
      if (row.status === "done") count.done += 1;
      counts.set(row.parentId!, count);
    }
    return counts;
  }

  /** Save a task and its tags together; returns its id. */
  create(
    userId: string,
    fields: TaskFields & { title: string },
    tagIds: string[],
  ): Promise<string> {
    return withTransaction(async (transaction) => {
      const row = await TaskModel.create({ ...fields, userId }, { transaction });
      await TaskTagModel.bulkCreate(
        tagIds.map((labelId) => ({ taskId: row.id, labelId })),
        { transaction },
      );
      return row.id;
    });
  }

  /** Update the columns and, when `tagIds` is given, replace the tags. */
  update(id: string, userId: string, fields: TaskFields, tagIds?: string[]): Promise<void> {
    return withTransaction(async (transaction) => {
      await TaskModel.update(fields, { where: { id, userId }, transaction });
      if (!tagIds) return;
      await TaskTagModel.destroy({ where: { taskId: id }, transaction });
      await TaskTagModel.bulkCreate(
        tagIds.map((labelId) => ({ taskId: id, labelId })),
        { transaction },
      );
    });
  }

  /** Its subtasks go with it. */
  async delete(id: string, userId: string): Promise<void> {
    await TaskModel.destroy({ where: { id, userId } });
  }

  private async withTags(rows: TaskModel[]): Promise<TaskRow[]> {
    if (rows.length === 0) return [];
    const links = await TaskTagModel.findAll({
      where: { taskId: oneOf(rows.map((row) => row.id)) },
    });
    const tags = new Map<string, string[]>();
    for (const link of links)
      tags.set(link.taskId, [...(tags.get(link.taskId) ?? []), link.labelId]);
    return rows.map((row) => toRow(row, tags.get(row.id) ?? []));
  }
}

export const taskRepository = new TaskRepository();
