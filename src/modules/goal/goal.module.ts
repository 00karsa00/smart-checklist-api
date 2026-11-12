import { currentUserId } from "../../common";
import { ApiModule, HttpContext, IdParams, NoParams } from "../../infrastructure/http";

import { userOnly } from "../user/user.module";
import {
  CreateGoalDto,
  CreateMilestoneDto,
  GoalListQuery,
  UpdateGoalDto,
  UpdateMilestoneDto,
} from "./dto/goal.dto";
// Registers goals with search.
import "./goal.search";
import { goalService } from "./goal.service";
import {
  validateCreateGoal,
  validateCreateMilestone,
  validateGoalIdParam,
  validateGoalListQuery,
  validateMilestoneParams,
  validateUpdateGoal,
  validateUpdateMilestone,
} from "./goal.validator";
import { GoalStatus } from "./types/goal.type";

type MilestoneParams = { id: string; milestoneId: string };

// Long-term goals with milestones, and projects working toward them.
export const goalModule: ApiModule = {
  path: "/goals",
  guards: userOnly,
  routes: [
    {
      method: "get",
      path: "/",
      guards: [validateGoalListQuery],
      handler: (ctx: HttpContext<NoParams, GoalListQuery>) =>
        goalService.list(currentUserId(ctx), {
          status: ctx.query.status as GoalStatus | undefined,
          workspaceId: ctx.query.workspaceId,
        }),
    },
    {
      method: "post",
      path: "/",
      guards: [validateCreateGoal],
      status: 201,
      handler: (ctx: HttpContext<NoParams, NoParams, CreateGoalDto>) =>
        goalService.create(currentUserId(ctx), ctx.body),
    },
    {
      method: "get",
      path: "/:id",
      guards: [validateGoalIdParam],
      handler: (ctx: HttpContext<IdParams>) => goalService.get(ctx.params.id, currentUserId(ctx)),
    },
    {
      method: "patch",
      path: "/:id",
      guards: [validateGoalIdParam, validateUpdateGoal],
      handler: (ctx: HttpContext<IdParams, NoParams, UpdateGoalDto>) =>
        goalService.update(ctx.params.id, currentUserId(ctx), ctx.body),
    },
    {
      method: "delete",
      path: "/:id",
      guards: [validateGoalIdParam],
      handler: (ctx: HttpContext<IdParams>) =>
        goalService.delete(ctx.params.id, currentUserId(ctx)),
    },
    {
      method: "post",
      path: "/:id/milestones",
      guards: [validateGoalIdParam, validateCreateMilestone],
      status: 201,
      handler: (ctx: HttpContext<IdParams, NoParams, CreateMilestoneDto>) =>
        goalService.addMilestone(ctx.params.id, currentUserId(ctx), ctx.body),
    },
    {
      method: "patch",
      path: "/:id/milestones/:milestoneId",
      guards: [validateMilestoneParams, validateUpdateMilestone],
      handler: (ctx: HttpContext<MilestoneParams, NoParams, UpdateMilestoneDto>) =>
        goalService.updateMilestone(
          ctx.params.id,
          ctx.params.milestoneId,
          currentUserId(ctx),
          ctx.body,
        ),
    },
    {
      method: "delete",
      path: "/:id/milestones/:milestoneId",
      guards: [validateMilestoneParams],
      handler: (ctx: HttpContext<MilestoneParams>) =>
        goalService.deleteMilestone(ctx.params.id, ctx.params.milestoneId, currentUserId(ctx)),
    },
  ],
};
