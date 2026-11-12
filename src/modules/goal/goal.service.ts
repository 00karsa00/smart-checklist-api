import { AppError, ERROR_CODES } from "../../common";

import { profileService, ProfileService } from "../profile/profile.service";
import { taskService, TaskService } from "../task/task.service";
import { workspaceService, WorkspaceService } from "../workspace/workspace.service";
import {
  CreateGoalDto,
  CreateMilestoneDto,
  UpdateGoalDto,
  UpdateMilestoneDto,
} from "./dto/goal.dto";
import { goalOverdue, goalProgress } from "./goal.progress";
import { GoalFields, goalRepository, GoalRepository, GoalRow } from "./goal.repository";
import { Goal, GoalDetail, GoalStatus } from "./types/goal.type";

/**
 * Long-term goals: milestones to tick off and projects working toward them,
 * whose tasks count in the progress. Links to projects live here, so the
 * workspace and task modules know nothing of goals.
 */
export class GoalService {
  constructor(
    private readonly goals: GoalRepository = goalRepository,
    private readonly workspaces: WorkspaceService = workspaceService,
    private readonly tasks: TaskService = taskService,
    private readonly profiles: ProfileService = profileService,
  ) {}

  async list(
    userId: string,
    filter: { status?: GoalStatus; workspaceId?: string },
  ): Promise<Goal[]> {
    if (filter.workspaceId) await this.workspaces.canUseWorkspace(userId, filter.workspaceId);
    return this.shape(userId, await this.goals.findAll(userId, filter));
  }

  async get(id: string, userId: string): Promise<GoalDetail> {
    const row = await this.canUse(userId, id);
    const [goal] = await this.shape(userId, [row]);
    const milestones = await this.goals.milestones([id]);
    return { ...goal, milestoneList: milestones.get(id) ?? [] };
  }

  async create(userId: string, data: CreateGoalDto): Promise<GoalDetail> {
    const { milestones = [], projectIds = [], workspaceId, ...rest } = data;
    const place = await this.workspaces.resolvePlace(userId, { workspaceId });
    await this.checkProjects(userId, projectIds);
    const id = await this.goals.create(
      userId,
      { ...rest, workspaceId: place.workspaceId! },
      milestones,
      projectIds,
    );
    return this.get(id, userId);
  }

  async update(id: string, userId: string, data: UpdateGoalDto): Promise<GoalDetail> {
    const current = await this.canUse(userId, id);
    const { projectIds, ...rest } = data;
    if (rest.workspaceId) await this.workspaces.canUseWorkspace(userId, rest.workspaceId);
    if (projectIds) await this.checkProjects(userId, projectIds);
    const fields: GoalFields = { ...rest };
    if (rest.status && rest.status !== current.status) {
      fields.achievedAt = rest.status === "achieved" ? new Date() : null;
    }
    await this.goals.update(id, userId, fields, projectIds);
    return this.get(id, userId);
  }

  async delete(id: string, userId: string): Promise<null> {
    await this.canUse(userId, id);
    await this.goals.delete(id, userId);
    return null;
  }

  // ── Milestones ────────────────────────────────────────────────────────────

  async addMilestone(id: string, userId: string, data: CreateMilestoneDto): Promise<GoalDetail> {
    await this.canUse(userId, id);
    await this.goals.addMilestone(id, data.title, data.dueDate ?? null);
    return this.get(id, userId);
  }

  async updateMilestone(
    id: string,
    milestoneId: string,
    userId: string,
    data: UpdateMilestoneDto,
  ): Promise<GoalDetail> {
    const milestone = await this.milestone(id, milestoneId, userId);
    const { done, ...rest } = data;
    const changes: { title?: string; dueDate?: string | null; doneAt?: Date | null } = { ...rest };
    if (done !== undefined && done !== milestone.done) changes.doneAt = done ? new Date() : null;
    await this.goals.updateMilestone(milestoneId, id, changes);
    return this.get(id, userId);
  }

  async deleteMilestone(id: string, milestoneId: string, userId: string): Promise<GoalDetail> {
    await this.milestone(id, milestoneId, userId);
    await this.goals.deleteMilestone(milestoneId, id);
    return this.get(id, userId);
  }

  /** The goal, when the user may use it; 404 otherwise. */
  async canUse(userId: string, id: string): Promise<GoalRow> {
    const goal = await this.goals.findById(id, userId);
    if (!goal) throw new AppError(404, ERROR_CODES.GOAL_NOT_FOUND, "Goal not found.");
    return goal;
  }

  private async milestone(id: string, milestoneId: string, userId: string) {
    await this.canUse(userId, id);
    const milestone = await this.goals.findMilestone(milestoneId, id);
    if (!milestone) {
      throw new AppError(404, ERROR_CODES.MILESTONE_NOT_FOUND, "Milestone not found.");
    }
    return milestone;
  }

  private async checkProjects(userId: string, projectIds: readonly string[]) {
    for (const projectId of projectIds) await this.workspaces.canUseProject(userId, projectId);
  }

  /** API shape: links, counts, progress, overdue and the next milestone. */
  private async shape(userId: string, rows: GoalRow[]): Promise<Goal[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);
    const [milestones, links, taskProgress, today] = await Promise.all([
      this.goals.milestones(ids),
      this.goals.projectIds(ids),
      this.tasks.progressByProject(userId),
      this.profiles.today(userId),
    ]);
    return rows.map((row) => {
      const steps = milestones.get(row.id) ?? [];
      const projectIds = (links.get(row.id) ?? []).sort();
      const tasks = projectIds.reduce(
        (sum, projectId) => {
          const count = taskProgress.get(projectId) ?? { done: 0, total: 0 };
          return { done: sum.done + count.done, total: sum.total + count.total };
        },
        { done: 0, total: 0 },
      );
      const milestoneCount = {
        done: steps.filter((step) => step.done).length,
        total: steps.length,
      };
      const next = steps.find((step) => !step.done);
      return {
        ...row,
        projectIds,
        milestones: milestoneCount,
        tasks,
        progress: goalProgress(row.status, milestoneCount, tasks),
        overdue: goalOverdue(row, today),
        nextMilestone: next ? { id: next.id, title: next.title, dueDate: next.dueDate } : null,
      };
    });
  }
}

export const goalService = new GoalService();
