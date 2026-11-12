import { addDays } from "../../common";
import { between, HabitCheckModel, HabitModel, oneOf } from "../../infrastructure/database";

import { HabitSchedule } from "./types/habit.type";

/** A habit as stored. */
export type HabitRow = {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  schedule: HabitSchedule;
  reminderTime: string | null;
  startDate: string;
  isArchived: boolean;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type HabitFields = Partial<Omit<HabitRow, "id" | "createdAt" | "updatedAt">>;

const toRow = (row: HabitModel): HabitRow => ({
  id: row.id,
  title: row.title,
  description: row.description,
  color: row.color,
  schedule: row.schedule as HabitSchedule,
  reminderTime: row.reminderTime,
  startDate: row.startDate,
  isArchived: row.isArchived,
  workspaceId: row.workspaceId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/** Habits and the days they were done, always scoped by `userId` (checks through their habit). */
export class HabitRepository {
  /** Oldest first, so the list keeps its order. */
  async findAll(userId: string, includeArchived: boolean): Promise<HabitRow[]> {
    const rows = await HabitModel.findAll({
      where: includeArchived ? { userId } : { userId, isArchived: false },
      order: [["createdAt", "ASC"]],
    });
    return rows.map(toRow);
  }

  async findById(id: string, userId: string): Promise<HabitRow | null> {
    const row = await HabitModel.findOne({ where: { id, userId } });
    return row ? toRow(row) : null;
  }

  /** Days ticked from `since` to `until`, by habit. */
  async checks(
    habitIds: readonly string[],
    since: string,
    until: string,
  ): Promise<Map<string, string[]>> {
    const byHabit = new Map<string, string[]>();
    if (habitIds.length === 0) return byHabit;
    const rows = await HabitCheckModel.findAll({
      where: { habitId: oneOf(habitIds), date: between(since, until) },
    });
    for (const row of rows)
      byHabit.set(row.habitId, [...(byHabit.get(row.habitId) ?? []), row.date]);
    return byHabit;
  }

  async create(
    userId: string,
    fields: HabitFields & Pick<HabitRow, "title" | "schedule" | "startDate" | "workspaceId">,
  ) {
    return toRow(await HabitModel.create({ ...fields, userId }));
  }

  async update(id: string, userId: string, fields: HabitFields): Promise<void> {
    await HabitModel.update(fields, { where: { id, userId } });
  }

  async delete(id: string, userId: string): Promise<void> {
    await HabitModel.destroy({ where: { id, userId } });
  }

  /** Tick a day; ticking it again changes nothing. */
  async check(habitId: string, date: string): Promise<void> {
    await HabitCheckModel.bulkCreate([{ habitId, date }], { ignoreDuplicates: true });
  }

  async uncheck(habitId: string, date: string): Promise<void> {
    await HabitCheckModel.destroy({ where: { habitId, date } });
  }
}

export const habitRepository = new HabitRepository();

/** How far back checks are read for streaks. */
export const historyStart = (today: string) => addDays(today, -2 * 366);
