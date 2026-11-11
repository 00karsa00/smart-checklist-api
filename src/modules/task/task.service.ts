import {
  addDays,
  AppError,
  daysBetween,
  buildPaginatedData,
  ERROR_CODES,
  pageOffset,
  PageRequest,
  validationError,
} from "../../common";

import { categoryService, LabelService, tagService } from "../label/label.service";
import { profileService, ProfileService } from "../profile/profile.service";
import { workspaceService, WorkspaceService } from "../workspace/workspace.service";
import { CreateTaskDto, UpdateTaskDto } from "./dto/task.dto";
import { TaskFields, TaskFilter, taskRepository, TaskRepository, TaskRow } from "./task.repository";
import { nextDueDate, RepeatRule } from "./task.repeat";
import { dueRange, isOverdue, priorityFromNumber, priorityToNumber } from "./task.rules";
import { DayCount, DueFilter, Task, TaskDetail, TaskList, TaskStatus } from "./types/task.type";

export type TaskListOptions = Omit<TaskFilter, "placement" | "due"> & {
  workspaceId?: string;
  due?: DueFilter;
  /** Due dates in this range, e.g. the days a calendar shows. */
  from?: string;
  to?: string;
};

type Now = { date: string; time: string };
const SUBTASK_PLACEMENT = "A subtask stays with its task; move the task instead.";

/**
 * Tasks and subtasks (one level). A top-level task sits in a project or
 * directly in a workspace; projects, workspaces, categories and tags are
 * checked through their own modules' canUse, so sharing later changes only those.
 */
export class TaskService {
  constructor(
    private readonly tasks: TaskRepository = taskRepository,
    private readonly workspaces: WorkspaceService = workspaceService,
    private readonly categories: LabelService = categoryService,
    private readonly tags: LabelService = tagService,
    private readonly profiles: ProfileService = profileService,
  ) {}

  async list(userId: string, options: TaskListOptions, page: PageRequest): Promise<TaskList> {
    const { workspaceId, due, from, to, ...rest } = options;
    const now = await this.profiles.now(userId);
    const filter: TaskFilter = { ...rest };
    if (workspaceId) {
      await this.workspaces.canUseWorkspace(userId, workspaceId);
      const projects = await this.workspaces.listProjects(userId, {
        workspaceId,
        includeArchived: true,
      });
      filter.placement = { workspaceId, projectIds: projects.map((project) => project.id) };
    }
    if (due) filter.due = dueRange(due, now.date);
    else if (from || to) filter.due = { from, to };
    const { rows, count } = await this.tasks.findPage(userId, filter, pageOffset(page), page.limit);
    return buildPaginatedData(await this.shape(userId, rows, now), { ...page, total: count });
  }

  async get(id: string, userId: string): Promise<TaskDetail> {
    const row = await this.canUse(userId, id);
    const now = await this.profiles.now(userId);
    const [task] = await this.shape(userId, [row], now);
    const children = await this.shape(userId, await this.tasks.findChildren(id, userId), now);
    return { ...task, children };
  }

  async create(userId: string, data: CreateTaskDto): Promise<TaskDetail> {
    const { tagIds = [], parentId, projectId, workspaceId, ...rest } = data;
    await this.checkLabels(userId, rest.categoryId, tagIds);
    let place: Pick<TaskFields, "workspaceId" | "projectId" | "parentId">;
    if (parentId) {
      const parent = await this.canUse(userId, parentId);
      if (parent.parentId) throw validationError("A subtask cannot have subtasks of its own.");
      if (projectId !== undefined || workspaceId !== undefined) {
        throw validationError(SUBTASK_PLACEMENT);
      }
      place = { parentId, workspaceId: null, projectId: null };
    } else {
      place = await this.placement(userId, { projectId, workspaceId });
    }
    const fields = this.fields(rest);
    this.checkRepeat({ ...fields, parentId: parentId ?? null }, fields);
    const id = await this.tasks.create(userId, { ...fields, ...place, title: rest.title }, tagIds);
    return this.get(id, userId);
  }

  async update(id: string, userId: string, data: UpdateTaskDto): Promise<TaskDetail> {
    const current = await this.canUse(userId, id);
    const { tagIds, projectId, workspaceId, ...rest } = data;
    await this.checkLabels(userId, rest.categoryId, tagIds ?? []);
    const fields = this.fields(rest, current);
    if (projectId !== undefined || workspaceId !== undefined) {
      if (current.parentId) throw validationError(SUBTASK_PLACEMENT);
      Object.assign(fields, await this.placement(userId, { projectId, workspaceId }, current));
    }
    // Clearing the date clears the time; a time on its own makes no sense.
    if (rest.dueDate === null && rest.dueTime === undefined) fields.dueTime = null;
    const after = { ...current, ...fields };
    if (after.dueTime && !after.dueDate) {
      throw validationError("Field 'dueTime' needs a due date.");
    }
    if (rest.repeat !== undefined || rest.dueDate !== undefined) this.checkRepeat(after, fields);
    await this.tasks.update(id, userId, fields, tagIds);
    // Completing a repeating task adds the next copy (once, even if reopened and done again).
    if (fields.status === "done" && current.status !== "done" && after.repeat && !after.nextId) {
      await this.addNext(userId, { ...after, id });
    }
    return this.get(id, userId);
  }

  async delete(id: string, userId: string): Promise<null> {
    await this.canUse(userId, id);
    await this.tasks.delete(id, userId);
    return null;
  }

  /** Tasks completed on each of the last `days` days (oldest first), in the user's time zone. */
  async completedPerDay(userId: string, days: number): Promise<DayCount[]> {
    const [{ timeZone }, today] = await Promise.all([
      this.profiles.getSettings(userId),
      this.profiles.today(userId),
    ]);
    const dates = Array.from({ length: days }, (_, index) => addDays(today, index - days + 1));
    const counts = await this.tasks.completedPerDay(userId, timeZone, dates[0]);
    return dates.map((date) => ({ date, count: counts.get(date) ?? 0 }));
  }

  /** Top-level tasks done and in all, per project id. */
  progressByProject(userId: string): Promise<Map<string, { done: number; total: number }>> {
    return this.tasks.progressByProject(userId);
  }

  /** The task, when the user may use it; 404 otherwise. Other modules call this. */
  async canUse(userId: string, id: string): Promise<TaskRow> {
    const task = await this.tasks.findById(id, userId);
    if (!task) throw new AppError(404, ERROR_CODES.TASK_NOT_FOUND, "Task not found.");
    return task;
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  /**
   * A repeat rule needs a due date and a top-level task. Monthly and yearly
   * rules keep to the due date's day of the month (set in `fields`).
   */
  private checkRepeat(
    task: { dueDate?: string | null; parentId?: string | null; repeat?: RepeatRule | null },
    fields: TaskFields,
  ) {
    if (!task.repeat) return;
    if (task.parentId) throw validationError("A subtask cannot repeat; make its task repeat.");
    if (!task.dueDate) throw validationError("A repeating task needs a due date.");
    const { anchorDay: _old, ...rule } = task.repeat;
    fields.repeat =
      rule.frequency === "monthly" || rule.frequency === "yearly"
        ? { ...rule, anchorDay: Number(task.dueDate.slice(8, 10)) }
        : rule;
  }

  /**
   * The next copy of a repeating task just completed: the same details, due
   * on the rule's next date (today or later), its reminder moved by as many
   * days, and its subtasks again, not done.
   */
  private async addNext(userId: string, task: TaskRow): Promise<void> {
    const dueDate = nextDueDate(task.repeat!, task.dueDate!, await this.profiles.today(userId));
    const shift = daysBetween(task.dueDate!, dueDate);
    const remindAt = task.remindAt
      ? `${addDays(task.remindAt.slice(0, 10), shift)}${task.remindAt.slice(10)}`
      : null;
    const nextId = await this.tasks.create(
      userId,
      {
        title: task.title,
        notes: task.notes,
        priority: task.priority,
        dueDate,
        dueTime: task.dueTime,
        remindAt,
        repeat: task.repeat,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        categoryId: task.categoryId,
      },
      task.tagIds,
    );
    for (const child of await this.tasks.findChildren(task.id, userId)) {
      await this.tasks.create(
        userId,
        { title: child.title, notes: child.notes, priority: child.priority, parentId: nextId },
        child.tagIds,
      );
    }
    await this.tasks.update(task.id, userId, { nextId });
  }

  /** Columns from the request; `completedAt` follows the status. */
  private fields(
    data: Omit<UpdateTaskDto, "tagIds" | "projectId" | "workspaceId">,
    current?: TaskRow,
  ): TaskFields {
    const { priority, status, ...rest } = data;
    const fields: TaskFields = { ...rest };
    if (priority !== undefined) fields.priority = priorityToNumber(priority);
    if (status !== undefined) {
      fields.status = status;
      if (status === "done" && current?.status !== "done") fields.completedAt = new Date();
      if (status !== "done") fields.completedAt = null;
    }
    return fields;
  }

  /**
   * Where a top-level task goes: a project (its workspace comes from it), or a
   * workspace. With neither, it stays where it was, or (new) goes to the first workspace.
   */
  private async placement(
    userId: string,
    wanted: { projectId?: string | null; workspaceId?: string },
    current?: TaskRow,
  ): Promise<{ projectId: string | null; workspaceId: string | null }> {
    if (wanted.projectId) {
      await this.workspaces.canUseProject(userId, wanted.projectId);
      return { projectId: wanted.projectId, workspaceId: null };
    }
    if (wanted.workspaceId) {
      await this.workspaces.canUseWorkspace(userId, wanted.workspaceId);
      return { projectId: null, workspaceId: wanted.workspaceId };
    }
    // Taken out of its project (projectId: null): it stays in that project's workspace.
    if (current?.projectId) {
      const project = await this.workspaces.canUseProject(userId, current.projectId);
      return { projectId: null, workspaceId: project.workspaceId };
    }
    if (current) return { projectId: null, workspaceId: current.workspaceId };
    const [first] = await this.workspaces.listWorkspaces(userId);
    return { projectId: null, workspaceId: first.id };
  }

  private async checkLabels(
    userId: string,
    categoryId: string | null | undefined,
    tagIds: readonly string[],
  ) {
    if (categoryId) await this.categories.canUse(userId, categoryId);
    for (const tagId of tagIds) await this.tags.canUse(userId, tagId);
  }

  /** API shape: priority as a word, the workspace filled in, overdue and subtask counts. */
  private async shape(userId: string, rows: TaskRow[], now: Now): Promise<Task[]> {
    if (rows.length === 0) return [];
    const [projects, counts] = await Promise.all([
      this.workspaces.listProjects(userId, { includeArchived: true }),
      this.tasks.subtaskCounts(rows.filter((row) => !row.parentId).map((row) => row.id)),
    ]);
    const projectWorkspace = new Map(projects.map((project) => [project.id, project.workspaceId]));
    const parentWorkspace = new Map<string, string>();
    for (const row of rows) {
      if (row.parentId && !parentWorkspace.has(row.parentId)) {
        const parent = await this.canUse(userId, row.parentId);
        parentWorkspace.set(row.parentId, this.workspaceOf(parent, projectWorkspace));
      }
    }
    return rows.map((row) => ({
      ...row,
      priority: priorityFromNumber(row.priority),
      status: row.status as TaskStatus,
      workspaceId: row.parentId
        ? parentWorkspace.get(row.parentId)!
        : this.workspaceOf(row, projectWorkspace),
      tagIds: [...row.tagIds].sort(),
      overdue: isOverdue(row, now),
      subtasks: counts.get(row.id) ?? { done: 0, total: 0 },
    }));
  }

  private workspaceOf(row: TaskRow, projectWorkspace: ReadonlyMap<string, string>): string {
    return row.projectId ? projectWorkspace.get(row.projectId)! : row.workspaceId!;
  }
}

export const taskService = new TaskService();
