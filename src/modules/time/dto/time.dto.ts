import { TimeKind } from "../types/time.type";

/** POST /time/start */
export type StartTimerDto = {
  taskId?: string | null;
  /** Defaults to the task's title. */
  description?: string;
  kind?: TimeKind;
  /** Focus sessions: how long, in minutes. */
  plannedMinutes?: number | null;
};

/** POST /time/entries: time logged by hand. */
export type LogTimeDto = {
  taskId?: string | null;
  description?: string;
  startedAt: string;
  endedAt: string;
};

export type UpdateTimeEntryDto = {
  taskId?: string | null;
  description?: string;
  startedAt?: string;
  endedAt?: string;
};
