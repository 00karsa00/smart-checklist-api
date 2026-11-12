import { addDays, AppError, deleteChecked, ERROR_CODES, validationError } from "../../common";

import { profileService, ProfileService } from "../profile/profile.service";
import { taskService, TaskService } from "../task/task.service";
import { workspaceService, WorkspaceService } from "../workspace/workspace.service";
import { LogTimeDto, StartTimerDto, UpdateTimeEntryDto } from "./dto/time.dto";
import { localDay, secondsBetween, timesheet, weekDays } from "./time.math";
import { TimeFields, timeRepository, TimeRepository, TimeRow } from "./time.repository";
import { Timesheet, TimeEntry, TimeEntryList } from "./types/time.type";

/** The longest one entry can be. */
const MAX_HOURS = 24;
/** Moments a local day can start or end at, across every time zone. */
const ZONE_SPREAD_HOURS = 15;

/**
 * Time spent: one running timer at a time (starting another stops it), focus
 * sessions with a planned length, and entries logged by hand; a week of it as
 * a timesheet. Each entry counts on the local day it started.
 */
export class TimeService {
  constructor(
    private readonly entries: TimeRepository = timeRepository,
    private readonly tasks: TaskService = taskService,
    private readonly workspaces: WorkspaceService = workspaceService,
    private readonly profiles: ProfileService = profileService,
  ) {}

  async running(userId: string): Promise<TimeEntry | null> {
    const row = await this.entries.findRunning(userId);
    return row ? (await this.shape(userId, [row]))[0] : null;
  }

  async start(userId: string, data: StartTimerDto): Promise<TimeEntry> {
    const about = await this.about(userId, data.taskId ?? null, data.description);
    const kind = data.kind ?? "work";
    if (kind === "focus" && !data.plannedMinutes) {
      throw validationError("A focus session needs 'plannedMinutes'.");
    }
    await this.entries.start(
      userId,
      {
        ...about,
        kind,
        plannedMinutes: kind === "focus" ? data.plannedMinutes! : null,
        startedAt: new Date(),
      },
      new Date(),
    );
    return (await this.running(userId))!;
  }

  async stop(userId: string): Promise<TimeEntry> {
    const row = await this.entries.findRunning(userId);
    if (!row) throw new AppError(409, ERROR_CODES.NO_TIMER_RUNNING, "No timer is running.");
    await this.entries.update(row.id, userId, { endedAt: new Date() });
    return this.get(row.id, userId);
  }

  async log(userId: string, data: LogTimeDto): Promise<TimeEntry> {
    const about = await this.about(userId, data.taskId ?? null, data.description);
    const startedAt = new Date(data.startedAt);
    const endedAt = new Date(data.endedAt);
    this.checkSpan(startedAt, endedAt);
    const id = await this.entries.create(userId, {
      ...about,
      kind: "work",
      plannedMinutes: null,
      startedAt,
      endedAt,
    });
    return this.get(id, userId);
  }

  async update(id: string, userId: string, data: UpdateTimeEntryDto): Promise<TimeEntry> {
    const current = await this.canUse(userId, id);
    const fields: TimeFields = {};
    if (data.taskId !== undefined || data.description !== undefined) {
      const taskId = data.taskId !== undefined ? data.taskId : current.taskId;
      Object.assign(
        fields,
        await this.about(userId, taskId, data.description ?? current.description),
      );
    }
    if (data.startedAt) fields.startedAt = new Date(data.startedAt);
    if (data.endedAt) {
      if (!current.endedAt) throw validationError("Stop the timer before changing when it ended.");
      fields.endedAt = new Date(data.endedAt);
    }
    const startedAt = fields.startedAt ?? current.startedAt;
    if (current.endedAt || fields.endedAt)
      this.checkSpan(startedAt, fields.endedAt ?? current.endedAt!);
    else if (startedAt > new Date()) throw validationError("A timer cannot start in the future.");
    await this.entries.update(id, userId, fields);
    return this.get(id, userId);
  }

  async get(id: string, userId: string): Promise<TimeEntry> {
    return (await this.shape(userId, [await this.canUse(userId, id)]))[0];
  }

  delete(id: string, userId: string): Promise<null> {
    return deleteChecked(
      () => this.canUse(userId, id),
      () => this.entries.delete(id, userId),
    );
  }

  /** Entries that started on the local days `from` to `to`, newest first. */
  async list(userId: string, from: string, to: string): Promise<TimeEntryList> {
    const items = await this.between(userId, from, to);
    return { items, totalSeconds: items.reduce((sum, entry) => sum + entry.seconds, 0) };
  }

  /** The week `date` is in, by task, from the user's first day of the week. */
  async timesheet(userId: string, date?: string): Promise<Timesheet> {
    const [settings, today] = await Promise.all([
      this.profiles.getSettings(userId),
      this.profiles.today(userId),
    ]);
    const days = weekDays(date ?? today, settings.weekStartsOn);
    const [items, projects] = await Promise.all([
      this.between(userId, days[0], days[6]),
      this.workspaces.listProjects(userId, { includeArchived: true }),
    ]);
    const taskTitles = new Map<string, string>();
    for (const taskId of new Set(items.flatMap((item) => (item.taskId ? [item.taskId] : [])))) {
      taskTitles.set(taskId, (await this.tasks.canUse(userId, taskId)).title);
    }
    const projectNames = new Map(projects.map((project) => [project.id, project.name]));
    return timesheet(items, days, {
      task: (id) => taskTitles.get(id),
      project: (id) => projectNames.get(id),
    });
  }

  async canUse(userId: string, id: string): Promise<TimeRow> {
    const row = await this.entries.findById(id, userId);
    if (!row) throw new AppError(404, ERROR_CODES.TIME_ENTRY_NOT_FOUND, "Time entry not found.");
    return row;
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  /** What the time is about: a task (its title and project), or a description. */
  private async about(userId: string, taskId: string | null, description?: string) {
    if (taskId) {
      const task = await this.tasks.canUse(userId, taskId);
      return {
        taskId,
        projectId: task.projectId,
        description: description?.trim() || task.title,
      };
    }
    if (!description?.trim()) throw validationError("Say what the time was for, or pick a task.");
    return { taskId: null, projectId: null, description: description.trim() };
  }

  private checkSpan(startedAt: Date, endedAt: Date) {
    if (endedAt <= startedAt) throw validationError("The end must be after the start.");
    if (endedAt > new Date()) throw validationError("Time cannot be logged in the future.");
    if (endedAt.getTime() - startedAt.getTime() > MAX_HOURS * 3_600_000) {
      throw validationError(`One entry can be at most ${MAX_HOURS} hours.`);
    }
  }

  /** Entries that started on the local days `from` to `to` (in the user's time zone). */
  private async between(userId: string, from: string, to: string): Promise<TimeEntry[]> {
    const { timeZone } = await this.profiles.getSettings(userId);
    // A wide net in UTC (every zone's day fits in it), then the exact local days.
    const spread = ZONE_SPREAD_HOURS * 3_600_000;
    const rows = await this.entries.findStartedBetween(
      userId,
      new Date(Date.parse(`${from}T00:00:00Z`) - spread),
      new Date(Date.parse(`${addDays(to, 1)}T00:00:00Z`) + spread),
    );
    const items = await this.shape(userId, rows, timeZone);
    return items.filter((item) => item.date >= from && item.date <= to);
  }

  private async shape(userId: string, rows: TimeRow[], zone?: string): Promise<TimeEntry[]> {
    const timeZone = zone ?? (await this.profiles.getSettings(userId)).timeZone;
    const now = new Date();
    return rows.map((row) => ({
      ...row,
      running: row.endedAt === null,
      seconds: secondsBetween(row.startedAt, row.endedAt, now),
      date: localDay(row.startedAt, timeZone),
    }));
  }
}

export const timeService = new TimeService();
