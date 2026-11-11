import { AppError, ERROR_CODES } from "../../common";

import { isForeignKeyViolation } from "../../infrastructure/database";

import { withUniqueColumns } from "../accounts";
import { profileService, ProfileService } from "../profile/profile.service";
import {
  CreateProjectDto,
  CreateWorkspaceDto,
  UpdateProjectDto,
  UpdateWorkspaceDto,
} from "./dto/workspace.dto";
import { compareProjects, isOverdue } from "./project.order";
import { ProjectFilter, workspaceRepository, WorkspaceRepository } from "./workspace.repository";
import { Project, ProjectSummary, Workspace, WorkspaceSummary } from "./types/workspace.type";

/** What a new user starts with; they can rename or remove them. */
export const STARTER_WORKSPACES: readonly CreateWorkspaceDto[] = [
  { name: "Personal", color: "#2563EB" },
  { name: "Work", color: "#16A34A" },
];

const WORKSPACE_TAKEN = {
  name: () =>
    new AppError(
      409,
      ERROR_CODES.WORKSPACE_NAME_TAKEN,
      "You already have a workspace with this name.",
    ),
};
const PROJECT_TAKEN = {
  name: () =>
    new AppError(
      409,
      ERROR_CODES.PROJECT_NAME_TAKEN,
      "This workspace already has a project with this name.",
    ),
};

/**
 * Workspaces (areas of life or work) and the projects in them. Every read and
 * write checks the user may use the workspace or project (canUseWorkspace /
 * canUseProject): today that means owning it; sharing later changes only those.
 */
export class WorkspaceService {
  constructor(
    private readonly workspaces: WorkspaceRepository = workspaceRepository,
    private readonly profiles: ProfileService = profileService,
  ) {}

  // ── Workspaces ────────────────────────────────────────────────────────────

  /** The user's workspaces, oldest first. A user with none gets the starter set. */
  async listWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
    let list = await this.workspaces.findWorkspaces(userId);
    if (list.length === 0) {
      await this.workspaces.addWorkspaces(userId, STARTER_WORKSPACES);
      list = await this.workspaces.findWorkspaces(userId);
    }
    const counts = await this.workspaces.openProjectCounts(userId);
    return list.map((item) => ({ ...item, openProjects: counts.get(item.id) ?? 0 }));
  }

  async createWorkspace(userId: string, data: CreateWorkspaceDto): Promise<Workspace> {
    return withUniqueColumns(this.workspaces.createWorkspace(userId, data), WORKSPACE_TAKEN);
  }

  async updateWorkspace(id: string, userId: string, data: UpdateWorkspaceDto): Promise<Workspace> {
    await this.canUseWorkspace(userId, id);
    await withUniqueColumns(this.workspaces.updateWorkspace(id, userId, data), WORKSPACE_TAKEN);
    return this.canUseWorkspace(userId, id);
  }

  /**
   * Only an empty workspace, and never the last one. What it holds (projects,
   * tasks) is found by the database, so modules that add things to workspaces
   * need no change here.
   */
  async deleteWorkspace(id: string, userId: string): Promise<null> {
    await this.canUseWorkspace(userId, id);
    if ((await this.workspaces.findWorkspaces(userId)).length <= 1) {
      throw new AppError(409, ERROR_CODES.WORKSPACE_LAST, "You need at least one workspace.");
    }
    try {
      await this.workspaces.deleteWorkspace(id, userId);
    } catch (error) {
      if (!isForeignKeyViolation(error)) throw error;
      throw new AppError(
        409,
        ERROR_CODES.WORKSPACE_NOT_EMPTY,
        "This workspace has projects or tasks. Move or delete them first.",
      );
    }
    return null;
  }

  /** The workspace, when the user may use it; 404 otherwise. Other modules call this. */
  async canUseWorkspace(userId: string, workspaceId: string): Promise<Workspace> {
    const workspace = await this.workspaces.findWorkspace(workspaceId, userId);
    if (!workspace) {
      throw new AppError(404, ERROR_CODES.WORKSPACE_NOT_FOUND, "Workspace not found.");
    }
    return workspace;
  }

  // ── Projects ──────────────────────────────────────────────────────────────

  async listProjects(userId: string, filter: ProjectFilter): Promise<ProjectSummary[]> {
    const [projects, today] = await Promise.all([
      this.workspaces.findProjects(userId, filter),
      this.profiles.today(userId),
    ]);
    return projects.map((project) => this.summarize(project, today)).sort(compareProjects);
  }

  async getProject(id: string, userId: string): Promise<ProjectSummary> {
    const project = await this.canUseProject(userId, id);
    return this.summarize(project, await this.profiles.today(userId));
  }

  async createProject(userId: string, data: CreateProjectDto): Promise<ProjectSummary> {
    await this.canUseWorkspace(userId, data.workspaceId);
    const project = await withUniqueColumns(
      this.workspaces.createProject(userId, data),
      PROJECT_TAKEN,
    );
    return this.getProject(project.id, userId);
  }

  async updateProject(id: string, userId: string, data: UpdateProjectDto): Promise<ProjectSummary> {
    await this.canUseProject(userId, id);
    if (data.workspaceId) await this.canUseWorkspace(userId, data.workspaceId);
    await withUniqueColumns(this.workspaces.updateProject(id, userId, data), PROJECT_TAKEN);
    return this.getProject(id, userId);
  }

  async deleteProject(id: string, userId: string): Promise<null> {
    await this.canUseProject(userId, id);
    await this.workspaces.deleteProject(id, userId);
    return null;
  }

  /** The project, when the user may use it; 404 otherwise. Other modules call this. */
  async canUseProject(userId: string, projectId: string): Promise<Project> {
    const project = await this.workspaces.findProject(projectId, userId);
    if (!project) throw new AppError(404, ERROR_CODES.PROJECT_NOT_FOUND, "Project not found.");
    return project;
  }

  private summarize(project: Project, today: string): ProjectSummary {
    return { ...project, overdue: isOverdue(project, today) };
  }
}

export const workspaceService = new WorkspaceService();
