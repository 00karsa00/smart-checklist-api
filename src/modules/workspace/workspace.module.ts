import { ApiModule } from "../../infrastructure/http";

import { userOnly } from "../user/user.module";
import {
  createProject,
  createWorkspace,
  deleteProject,
  deleteWorkspace,
  getProject,
  getProjects,
  getWorkspaces,
  updateProject,
  updateWorkspace,
} from "./workspace.controller";
import {
  validateCreateProject,
  validateCreateWorkspace,
  validateProjectIdParam,
  validateProjectListQuery,
  validateUpdateProject,
  validateUpdateWorkspace,
  validateWorkspaceIdParam,
} from "./workspace.validator";

// Workspaces (Personal, Work…) and the projects in them.
export const workspaceModule: ApiModule = {
  path: "/workspaces",
  guards: userOnly,
  routes: [
    { method: "get", path: "/", handler: getWorkspaces },
    {
      method: "post",
      path: "/",
      guards: [validateCreateWorkspace],
      status: 201,
      handler: createWorkspace,
    },
    {
      method: "patch",
      path: "/:id",
      guards: [validateWorkspaceIdParam, validateUpdateWorkspace],
      handler: updateWorkspace,
    },
    {
      method: "delete",
      path: "/:id",
      guards: [validateWorkspaceIdParam],
      handler: deleteWorkspace,
    },
  ],
};

export const projectModule: ApiModule = {
  path: "/projects",
  guards: userOnly,
  routes: [
    { method: "get", path: "/", guards: [validateProjectListQuery], handler: getProjects },
    {
      method: "post",
      path: "/",
      guards: [validateCreateProject],
      status: 201,
      handler: createProject,
    },
    { method: "get", path: "/:id", guards: [validateProjectIdParam], handler: getProject },
    {
      method: "patch",
      path: "/:id",
      guards: [validateProjectIdParam, validateUpdateProject],
      handler: updateProject,
    },
    { method: "delete", path: "/:id", guards: [validateProjectIdParam], handler: deleteProject },
  ],
};
