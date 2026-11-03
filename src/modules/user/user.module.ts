import { authenticate } from "../../common/guards/auth.guard";
import { ApiModule } from "../../infrastructure/http";

import { createUser, deleteUser, getUser, getUsers, updateUser } from "./user.controller";
import {
  validateCreateUser,
  validateUpdateUser,
  validateUserIdParam,
  validateUserListQuery,
} from "./user.validator";

export const userModule: ApiModule = {
  path: "/users",
  guards: [authenticate],
  routes: [
    { method: "get", path: "/", guards: [validateUserListQuery], handler: getUsers },
    { method: "get", path: "/:id", guards: [validateUserIdParam], handler: getUser },
    { method: "post", path: "/", guards: [validateCreateUser], status: 201, handler: createUser },
    {
      method: "patch",
      path: "/:id",
      guards: [validateUserIdParam, validateUpdateUser],
      handler: updateUser,
    },
    { method: "delete", path: "/:id", guards: [validateUserIdParam], handler: deleteUser },
  ],
};
