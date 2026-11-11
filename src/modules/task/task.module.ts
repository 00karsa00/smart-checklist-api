import { ApiModule } from "../../infrastructure/http";

import { userOnly } from "../user/user.module";
import { createTask, deleteTask, getTask, getTasks, updateTask } from "./task.controller";
import {
  validateCreateTask,
  validateTaskIdParam,
  validateTaskListQuery,
  validateUpdateTask,
} from "./task.validator";

// Tasks and subtasks: what to do, where it belongs, when it is due.
export const taskModule: ApiModule = {
  path: "/tasks",
  guards: userOnly,
  routes: [
    { method: "get", path: "/", guards: [validateTaskListQuery], handler: getTasks },
    { method: "post", path: "/", guards: [validateCreateTask], status: 201, handler: createTask },
    { method: "get", path: "/:id", guards: [validateTaskIdParam], handler: getTask },
    {
      method: "patch",
      path: "/:id",
      guards: [validateTaskIdParam, validateUpdateTask],
      handler: updateTask,
    },
    { method: "delete", path: "/:id", guards: [validateTaskIdParam], handler: deleteTask },
  ],
};
