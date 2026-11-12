import { addDays, AppError, ERROR_CODES, validationError } from "../../common";

import { profileService, ProfileService } from "../profile/profile.service";
import { workspaceService, WorkspaceService } from "../workspace/workspace.service";
import { CreateHabitDto, UpdateHabitDto } from "./dto/habit.dto";
import {
  HabitFields,
  habitRepository,
  HabitRepository,
  HabitRow,
  historyStart,
} from "./habit.repository";
import { habitStats } from "./habit.stats";
import { Habit } from "./types/habit.type";

/** How far back a day can be ticked or unticked. */
const EDITABLE_DAYS = 366;

/**
 * Habits: routines to tick off each day they are done, with streaks and
 * consistency (habit.stats.ts) counted in the user's time zone and week.
 */
export class HabitService {
  constructor(
    private readonly habits: HabitRepository = habitRepository,
    private readonly workspaces: WorkspaceService = workspaceService,
    private readonly profiles: ProfileService = profileService,
  ) {}

  async list(userId: string, includeArchived = false): Promise<Habit[]> {
    return this.shape(userId, await this.habits.findAll(userId, includeArchived));
  }

  async get(id: string, userId: string): Promise<Habit> {
    const [habit] = await this.shape(userId, [await this.canUse(userId, id)]);
    return habit;
  }

  async create(userId: string, data: CreateHabitDto): Promise<Habit> {
    const { workspaceId, ...rest } = data;
    const place = await this.workspaces.resolvePlace(userId, { workspaceId });
    const habit = await this.habits.create(userId, {
      ...rest,
      workspaceId: place.workspaceId!,
      startDate: data.startDate ?? (await this.profiles.today(userId)),
    });
    return this.get(habit.id, userId);
  }

  async update(id: string, userId: string, data: UpdateHabitDto): Promise<Habit> {
    await this.canUse(userId, id);
    if (data.workspaceId) await this.workspaces.canUseWorkspace(userId, data.workspaceId);
    await this.habits.update(id, userId, data as HabitFields);
    return this.get(id, userId);
  }

  async delete(id: string, userId: string): Promise<null> {
    await this.canUse(userId, id);
    await this.habits.delete(id, userId);
    return null;
  }

  /** Mark `date` done (`done`) or not. Not in the future, nor more than a year back. */
  async setDone(id: string, userId: string, date: string, done: boolean): Promise<Habit> {
    await this.canUse(userId, id);
    const today = await this.profiles.today(userId);
    if (date > today) throw validationError("A day in the future cannot be ticked yet.");
    if (date < addDays(today, -EDITABLE_DAYS)) throw validationError("That day is too long ago.");
    if (done) await this.habits.check(id, date);
    else await this.habits.uncheck(id, date);
    return this.get(id, userId);
  }

  /** The habit, when the user may use it; 404 otherwise. */
  async canUse(userId: string, id: string): Promise<HabitRow> {
    const habit = await this.habits.findById(id, userId);
    if (!habit) throw new AppError(404, ERROR_CODES.HABIT_NOT_FOUND, "Habit not found.");
    return habit;
  }

  /** API shape: the habit with its streaks, consistency and last 7 days. */
  async shape(userId: string, rows: HabitRow[]): Promise<Habit[]> {
    if (rows.length === 0) return [];
    const [today, settings] = await Promise.all([
      this.profiles.today(userId),
      this.profiles.getSettings(userId),
    ]);
    const checks = await this.habits.checks(
      rows.map((row) => row.id),
      historyStart(today),
      today,
    );
    return rows.map((row) => ({
      ...row,
      ...habitStats(
        row.schedule,
        checks.get(row.id) ?? [],
        row.startDate,
        today,
        settings.weekStartsOn,
      ),
    }));
  }
}

export const habitService = new HabitService();
