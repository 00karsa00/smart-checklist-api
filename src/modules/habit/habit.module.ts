import { currentUserId } from "../../common";
import { ApiModule, HttpContext, IdParams, NoParams } from "../../infrastructure/http";

import { userOnly } from "../user/user.module";
import { CreateHabitDto, UpdateHabitDto } from "./dto/habit.dto";
// Registers habit reminders with notifications, and habits with search.
import "./habit.sources";
import { habitService } from "./habit.service";
import {
  validateCreateHabit,
  validateHabitDayParams,
  validateHabitIdParam,
  validateHabitListQuery,
  validateUpdateHabit,
} from "./habit.validator";

type DayParams = { id: string; date: string };

// Habits: routines ticked off each day, with streaks and consistency.
export const habitModule: ApiModule = {
  path: "/habits",
  guards: userOnly,
  routes: [
    {
      method: "get",
      path: "/",
      guards: [validateHabitListQuery],
      handler: (ctx: HttpContext<NoParams, { includeArchived?: string }>) =>
        habitService.list(currentUserId(ctx), ctx.query.includeArchived === "true"),
    },
    {
      method: "post",
      path: "/",
      guards: [validateCreateHabit],
      status: 201,
      handler: (ctx: HttpContext<NoParams, NoParams, CreateHabitDto>) =>
        habitService.create(currentUserId(ctx), ctx.body),
    },
    {
      method: "get",
      path: "/:id",
      guards: [validateHabitIdParam],
      handler: (ctx: HttpContext<IdParams>) => habitService.get(ctx.params.id, currentUserId(ctx)),
    },
    {
      method: "patch",
      path: "/:id",
      guards: [validateHabitIdParam, validateUpdateHabit],
      handler: (ctx: HttpContext<IdParams, NoParams, UpdateHabitDto>) =>
        habitService.update(ctx.params.id, currentUserId(ctx), ctx.body),
    },
    {
      method: "delete",
      path: "/:id",
      guards: [validateHabitIdParam],
      handler: (ctx: HttpContext<IdParams>) =>
        habitService.delete(ctx.params.id, currentUserId(ctx)),
    },
    {
      method: "put",
      path: "/:id/days/:date",
      guards: [validateHabitDayParams],
      handler: (ctx: HttpContext<DayParams>) =>
        habitService.setDone(ctx.params.id, currentUserId(ctx), ctx.params.date, true),
    },
    {
      method: "delete",
      path: "/:id/days/:date",
      guards: [validateHabitDayParams],
      handler: (ctx: HttpContext<DayParams>) =>
        habitService.setDone(ctx.params.id, currentUserId(ctx), ctx.params.date, false),
    },
  ],
};
