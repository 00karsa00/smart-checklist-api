import { between, TimeEntryModel, withTransaction } from "../../infrastructure/database";

import { TimeKind } from "./types/time.type";

/** A time entry as stored. */
export type TimeRow = {
  id: string;
  taskId: string | null;
  projectId: string | null;
  description: string;
  kind: TimeKind;
  plannedMinutes: number | null;
  startedAt: Date;
  endedAt: Date | null;
};

export type TimeFields = Partial<Omit<TimeRow, "id">>;

const toRow = (row: TimeEntryModel): TimeRow => ({
  id: row.id,
  taskId: row.taskId,
  projectId: row.projectId,
  description: row.description,
  kind: row.kind as TimeKind,
  plannedMinutes: row.plannedMinutes,
  startedAt: row.startedAt,
  endedAt: row.endedAt,
});

/** Time entries, always scoped by `userId`. */
export class TimeRepository {
  async findRunning(userId: string): Promise<TimeRow | null> {
    const row = await TimeEntryModel.findOne({ where: { userId, endedAt: null } });
    return row ? toRow(row) : null;
  }

  /** Entries started between two moments, newest first. */
  async findStartedBetween(userId: string, from: Date, to: Date): Promise<TimeRow[]> {
    const rows = await TimeEntryModel.findAll({
      where: { userId, startedAt: between(from, to) },
      order: [["startedAt", "DESC"]],
    });
    return rows.map(toRow);
  }

  async findById(id: string, userId: string): Promise<TimeRow | null> {
    const row = await TimeEntryModel.findOne({ where: { id, userId } });
    return row ? toRow(row) : null;
  }

  /** Stop what runs (at `now`) and start a new timer, together. */
  start(userId: string, fields: Omit<TimeRow, "id" | "endedAt">, now: Date): Promise<string> {
    return withTransaction(async (transaction) => {
      await TimeEntryModel.update(
        { endedAt: now },
        { where: { userId, endedAt: null }, transaction },
      );
      const row = await TimeEntryModel.create({ ...fields, userId }, { transaction });
      return row.id;
    });
  }

  async create(userId: string, fields: Omit<TimeRow, "id">): Promise<string> {
    return (await TimeEntryModel.create({ ...fields, userId })).id;
  }

  async update(id: string, userId: string, fields: TimeFields): Promise<void> {
    await TimeEntryModel.update(fields, { where: { id, userId } });
  }

  async delete(id: string, userId: string): Promise<void> {
    await TimeEntryModel.destroy({ where: { id, userId } });
  }
}

export const timeRepository = new TimeRepository();
