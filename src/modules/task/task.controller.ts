import { currentUserId, parsePageQuery } from "../../common";
import { HttpContext, IdParams, NoParams } from "../../infrastructure/http";

import { CreateTaskDto, TaskListQuery, UpdateTaskDto } from "./dto/task.dto";
import { taskService } from "./task.service";

export function getTasks(ctx: HttpContext<NoParams, TaskListQuery>) {
  const { page, limit, includeDone, q, ...filter } = ctx.query;
  return taskService.list(
    currentUserId(ctx),
    // The query is read-only, so `q` is trimmed here.
    { ...filter, search: q?.trim() || undefined, includeDone: includeDone === "true" },
    parsePageQuery({ page, limit }, 50),
  );
}

export function getTask(ctx: HttpContext<IdParams>) {
  return taskService.get(ctx.params.id, currentUserId(ctx));
}

export function createTask(ctx: HttpContext<NoParams, NoParams, CreateTaskDto>) {
  return taskService.create(currentUserId(ctx), ctx.body);
}

export function updateTask(ctx: HttpContext<IdParams, NoParams, UpdateTaskDto>) {
  return taskService.update(ctx.params.id, currentUserId(ctx), ctx.body);
}

export function deleteTask(ctx: HttpContext<IdParams>) {
  return taskService.delete(ctx.params.id, currentUserId(ctx));
}
