import { ProjectModel, WorkspaceModel } from "../../infrastructure/database";

import {
  CreateProjectDto,
  CreateWorkspaceDto,
  UpdateProjectDto,
  UpdateWorkspaceDto,
} from "./dto/workspace.dto";
import { Project, ProjectStatus, Workspace } from "./types/workspace.type";

const OPEN_STATUSES: ProjectStatus[] = ["active", "on_hold"];

function toWorkspace(row: WorkspaceModel): Workspace {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toProject(row: ProjectModel): Project {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    description: row.description,
    color: row.color,
    status: row.status as ProjectStatus,
    dueDate: row.dueDate,
    isArchived: row.isArchived,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type ProjectFilter = {
  workspaceId?: string;
  status?: ProjectStatus;
  includeArchived: boolean;
};

/** Workspaces and projects, always scoped by `userId`. */
export class WorkspaceRepository {
  async findWorkspaces(userId: string): Promise<Workspace[]> {
    const rows = await WorkspaceModel.findAll({ where: { userId }, order: [["createdAt", "ASC"]] });
    return rows.map(toWorkspace);
  }

  async findWorkspace(id: string, userId: string): Promise<Workspace | null> {
    const row = await WorkspaceModel.findOne({ where: { id, userId } });
    return row ? toWorkspace(row) : null;
  }

  /** Add workspaces; names the user already has are skipped (safe when two requests race). */
  async addWorkspaces(userId: string, items: readonly CreateWorkspaceDto[]): Promise<void> {
    await WorkspaceModel.bulkCreate(
      items.map((item) => ({ ...item, userId })),
      { ignoreDuplicates: true },
    );
  }

  async createWorkspace(userId: string, data: CreateWorkspaceDto): Promise<Workspace> {
    return toWorkspace(await WorkspaceModel.create({ ...data, userId }));
  }

  async updateWorkspace(id: string, userId: string, changes: UpdateWorkspaceDto): Promise<void> {
    await WorkspaceModel.update(changes, { where: { id, userId } });
  }

  async deleteWorkspace(id: string, userId: string): Promise<void> {
    await WorkspaceModel.destroy({ where: { id, userId } });
  }

  /** Open (not archived, not completed) projects per workspace. */
  async openProjectCounts(userId: string): Promise<Map<string, number>> {
    const rows = (await ProjectModel.count({
      where: { userId, isArchived: false, status: OPEN_STATUSES },
      group: ["workspaceId"],
    })) as unknown as { workspaceId: string; count: number }[];
    return new Map(rows.map((row) => [row.workspaceId, Number(row.count)]));
  }

  async findProjects(userId: string, filter: ProjectFilter): Promise<Project[]> {
    const rows = await ProjectModel.findAll({
      where: {
        userId,
        ...(filter.workspaceId && { workspaceId: filter.workspaceId }),
        ...(filter.status && { status: filter.status }),
        ...(!filter.includeArchived && { isArchived: false }),
      },
    });
    return rows.map(toProject);
  }

  async findProject(id: string, userId: string): Promise<Project | null> {
    const row = await ProjectModel.findOne({ where: { id, userId } });
    return row ? toProject(row) : null;
  }

  async createProject(userId: string, data: CreateProjectDto): Promise<Project> {
    return toProject(await ProjectModel.create({ ...data, userId }));
  }

  async updateProject(id: string, userId: string, changes: UpdateProjectDto): Promise<void> {
    await ProjectModel.update(changes, { where: { id, userId } });
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    await ProjectModel.destroy({ where: { id, userId } });
  }
}

export const workspaceRepository = new WorkspaceRepository();
