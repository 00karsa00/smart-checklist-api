import { HabitSchedule } from "../types/habit.type";

export type CreateHabitDto = {
  title: string;
  description?: string | null;
  color?: string | null;
  /** The user's first workspace when left out. */
  workspaceId?: string;
  schedule: HabitSchedule;
  reminderTime?: string | null;
  /** Today when left out. */
  startDate?: string;
};

export type UpdateHabitDto = Partial<CreateHabitDto> & { isArchived?: boolean };
