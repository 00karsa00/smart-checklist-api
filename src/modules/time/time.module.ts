import { currentUserId, idParamGuard } from "../../common";
import { ApiModule, HttpContext, IdParams, NoParams } from "../../infrastructure/http";

import { userOnly } from "../user/user.module";
import { LogTimeDto, StartTimerDto, UpdateTimeEntryDto } from "./dto/time.dto";
// Registers "focus session done" with notifications.
import "./time.sources";
import { timeService } from "./time.service";
import {
  validateLogTime,
  validateStartTimer,
  validateTimeRange,
  validateTimesheetQuery,
  validateUpdateTimeEntry,
} from "./time.validator";

const validateEntryId = idParamGuard("Time entry");

// Time spent: a timer, focus sessions, entries logged by hand, a weekly timesheet.
export const timeModule: ApiModule = {
  path: "/time",
  guards: userOnly,
  routes: [
    {
      method: "get",
      path: "/running",
      handler: (ctx: HttpContext) => timeService.running(currentUserId(ctx)),
    },
    {
      method: "post",
      path: "/start",
      guards: [validateStartTimer],
      status: 201,
      handler: (ctx: HttpContext<NoParams, NoParams, StartTimerDto>) =>
        timeService.start(currentUserId(ctx), ctx.body),
    },
    {
      method: "post",
      path: "/stop",
      handler: (ctx: HttpContext) => timeService.stop(currentUserId(ctx)),
    },
    {
      method: "get",
      path: "/entries",
      guards: [validateTimeRange],
      handler: (ctx: HttpContext<NoParams, { from: string; to: string }>) =>
        timeService.list(currentUserId(ctx), ctx.query.from, ctx.query.to),
    },
    {
      method: "post",
      path: "/entries",
      guards: [validateLogTime],
      status: 201,
      handler: (ctx: HttpContext<NoParams, NoParams, LogTimeDto>) =>
        timeService.log(currentUserId(ctx), ctx.body),
    },
    {
      method: "patch",
      path: "/entries/:id",
      guards: [validateEntryId, validateUpdateTimeEntry],
      handler: (ctx: HttpContext<IdParams, NoParams, UpdateTimeEntryDto>) =>
        timeService.update(ctx.params.id, currentUserId(ctx), ctx.body),
    },
    {
      method: "delete",
      path: "/entries/:id",
      guards: [validateEntryId],
      handler: (ctx: HttpContext<IdParams>) =>
        timeService.delete(ctx.params.id, currentUserId(ctx)),
    },
    {
      method: "get",
      path: "/timesheet",
      guards: [validateTimesheetQuery],
      handler: (ctx: HttpContext<NoParams, { date?: string }>) =>
        timeService.timesheet(currentUserId(ctx), ctx.query.date),
    },
  ],
};
