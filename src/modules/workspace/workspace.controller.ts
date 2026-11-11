import { currentUserId } from "../../common";
import { HttpContext, IdParams, NoParams } from "../../infrastructure/http";

import {
  CreateProjectDto,
  CreateWorkspaceDto,
  ProjectListQuery,
  UpdateProjectDto,
  UpdateWorkspaceDto,
} from "./dto/workspace.dto";
import { ProjectStatus } from "./types/workspace.type";
import { workspaceService } from "./workspace.service";

export function getWorkspaces(ctx: HttpContext) {
  return workspaceService.listWorkspaces(currentUserId(ctx));
}

export function createWorkspace(ctx: HttpContext<NoParams, NoParams, CreateWorkspaceDto>) {
  return workspaceService.createWorkspace(currentUserId(ctx), ctx.body);
}

export function updateWorkspace(ctx: HttpContext<IdParams, NoParams, UpdateWorkspaceDto>) {
  return workspaceService.updateWorkspace(ctx.params.id, currentUserId(ctx), ctx.body);
}

export function deleteWorkspace(ctx: HttpContext<IdParams>) {
  return workspaceService.deleteWorkspace(ctx.params.id, currentUserId(ctx));
}

export function getProjects(ctx: HttpContext<NoParams, ProjectListQuery>) {
  const { workspaceId, status, includeArchived } = ctx.query;
  return workspaceService.listProjects(currentUserId(ctx), {
    workspaceId,
    status: status as ProjectStatus | undefined,
    includeArchived: includeArchived === "true",
  });
}

export function getProject(ctx: HttpContext<IdParams>) {
  return workspaceService.getProject(ctx.params.id, currentUserId(ctx));
}

export function createProject(ctx: HttpContext<NoParams, NoParams, CreateProjectDto>) {
  return workspaceService.createProject(currentUserId(ctx), ctx.body);
}

export function updateProject(ctx: HttpContext<IdParams, NoParams, UpdateProjectDto>) {
  return workspaceService.updateProject(ctx.params.id, currentUserId(ctx), ctx.body);
}

export function deleteProject(ctx: HttpContext<IdParams>) {
  return workspaceService.deleteProject(ctx.params.id, currentUserId(ctx));
}
