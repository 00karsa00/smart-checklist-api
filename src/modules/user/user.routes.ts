import { Router } from "express";

import {
  RouteDefinition,
  registerRoutes,
} from "../../common/types/route-definition.type";

import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "./user.controller";
import {
  validateUserIdParam,
  validateUserListQuery,
  validateCreateUser,
  validateUpdateUser,
} from "./user.validator";

const router = Router();

const userRoutes: RouteDefinition[] = [
  {
    method: "get",
    path: "/",
    middlewares: [validateUserListQuery],
    handler: getUsers,
  },
  {
    method: "get",
    path: "/:id",
    middlewares: [validateUserIdParam],
    handler: getUser,
  },
  {
    method: "post",
    path: "/",
    middlewares: [validateCreateUser],
    handler: createUser,
  },
  {
    method: "patch",
    path: "/:id",
    middlewares: [validateUserIdParam, validateUpdateUser],
    handler: updateUser,
  },
  {
    method: "delete",
    path: "/:id",
    middlewares: [validateUserIdParam],
    handler: deleteUser,
  },
];

registerRoutes(router, userRoutes);

export default router;
