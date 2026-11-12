import {
  GoalMilestoneModel,
  GoalModel,
  GoalProjectModel,
  oneOf,
  Where,
  withTransaction,
} from "../../infrastructure/database";

import { GoalStatus, Milestone } from "./types/goal.type";

/** A goal as stored. */
export type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  status: GoalStatus;
  targetDate: string | null;
  achievedAt: Date | null;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GoalFields = Partial<Omit<GoalRow, "id" | "createdAt" | "updatedAt">>;

const toRow = (row: GoalModel): GoalRow => ({
  id: row.id,
  title: row.title,
  description: row.description,
  color: row.color,
  status: row.status as GoalStatus,
  targetDate: row.targetDate,
  achievedAt: row.achievedAt,
  workspaceId: row.workspaceId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const toMilestone = (row: GoalMilestoneModel): Milestone => ({
  id: row.id,
  title: row.title,
  dueDate: row.dueDate,
  done: row.doneAt !== null,
  doneAt: row.doneAt,
  position: row.position,
});

/** Goals, their milestones and linked projects, always scoped by `userId`. */
export class GoalRepository {
  /** Soonest target date first (none last), then the newest. */
  async findAll(userId: string, filter: { status?: GoalStatus; workspaceId?: string }) {
    const where: Where = { userId };
    if (filter.status) where.status = filter.status;
    if (filter.workspaceId) where.workspaceId = filter.workspaceId;
    const rows = await GoalModel.findAll({
      where,
      order: [
        ["targetDate", "ASC NULLS LAST"],
        ["createdAt", "DESC"],
      ],
    });
    return rows.map(toRow);
  }

  async findById(id: string, userId: string): Promise<GoalRow | null> {
    const row = await GoalModel.findOne({ where: { id, userId } });
    return row ? toRow(row) : null;
  }

  /** Milestones of these goals, in order, by goal. */
  async milestones(goalIds: readonly string[]): Promise<Map<string, Milestone[]>> {
    const byGoal = new Map<string, Milestone[]>();
    if (goalIds.length === 0) return byGoal;
    const rows = await GoalMilestoneModel.findAll({
      where: { goalId: oneOf(goalIds) },
      order: [["position", "ASC"]],
    });
    for (const row of rows)
      byGoal.set(row.goalId, [...(byGoal.get(row.goalId) ?? []), toMilestone(row)]);
    return byGoal;
  }

  /** Linked project ids, by goal. */
  async projectIds(goalIds: readonly string[]): Promise<Map<string, string[]>> {
    const byGoal = new Map<string, string[]>();
    if (goalIds.length === 0) return byGoal;
    const rows = await GoalProjectModel.findAll({ where: { goalId: oneOf(goalIds) } });
    for (const row of rows)
      byGoal.set(row.goalId, [...(byGoal.get(row.goalId) ?? []), row.projectId]);
    return byGoal;
  }

  /** Save a goal with its first milestones and project links; returns its id. */
  create(
    userId: string,
    fields: GoalFields & { title: string; workspaceId: string },
    milestones: string[],
    projectIds: string[],
  ) {
    return withTransaction(async (transaction) => {
      const goal = await GoalModel.create({ ...fields, userId }, { transaction });
      await GoalMilestoneModel.bulkCreate(
        milestones.map((title, position) => ({ goalId: goal.id, title, position })),
        { transaction },
      );
      await GoalProjectModel.bulkCreate(
        projectIds.map((projectId) => ({ goalId: goal.id, projectId })),
        { transaction },
      );
      return goal.id;
    });
  }

  /** Update the columns and, when `projectIds` is given, replace the links. */
  update(id: string, userId: string, fields: GoalFields, projectIds?: string[]) {
    return withTransaction(async (transaction) => {
      await GoalModel.update(fields, { where: { id, userId }, transaction });
      if (!projectIds) return;
      await GoalProjectModel.destroy({ where: { goalId: id }, transaction });
      await GoalProjectModel.bulkCreate(
        projectIds.map((projectId) => ({ goalId: id, projectId })),
        { transaction },
      );
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    await GoalModel.destroy({ where: { id, userId } });
  }

  async addMilestone(goalId: string, title: string, dueDate: string | null): Promise<void> {
    const last = (await GoalMilestoneModel.max("position", { where: { goalId } })) as number | null;
    await GoalMilestoneModel.create({ goalId, title, dueDate, position: (last ?? -1) + 1 });
  }

  async findMilestone(id: string, goalId: string): Promise<Milestone | null> {
    const row = await GoalMilestoneModel.findOne({ where: { id, goalId } });
    return row ? toMilestone(row) : null;
  }

  async updateMilestone(
    id: string,
    goalId: string,
    changes: { title?: string; dueDate?: string | null; doneAt?: Date | null },
  ): Promise<void> {
    await GoalMilestoneModel.update(changes, { where: { id, goalId } });
  }

  async deleteMilestone(id: string, goalId: string): Promise<void> {
    await GoalMilestoneModel.destroy({ where: { id, goalId } });
  }
}

export const goalRepository = new GoalRepository();
