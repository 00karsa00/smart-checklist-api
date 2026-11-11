import { currentUserId, idParamGuard } from "../../common";
import { ApiModule, HttpContext, IdParams, NoParams } from "../../infrastructure/http";

import { userOnly } from "../user/user.module";
import { CreateLabelDto, LabelListQuery, UpdateLabelDto } from "./dto/label.dto";
import { categoryService, LabelService, tagService } from "./label.service";
import {
  validateCreateLabel,
  validateLabelListQuery,
  validateUpdateLabel,
} from "./label.validator";

/** The routes of one kind of label: list, add, change, delete (and the suggested set). */
function labelModule(service: LabelService): ApiModule {
  const { path, noun, suggested } = service.config;
  const validateId = idParamGuard(noun);
  return {
    path,
    guards: userOnly,
    routes: [
      {
        method: "get",
        path: "/",
        guards: [validateLabelListQuery],
        handler: (ctx: HttpContext<NoParams, LabelListQuery>) =>
          service.list(currentUserId(ctx), ctx.query.includeArchived === "true"),
      },
      {
        method: "post",
        path: "/",
        guards: [validateCreateLabel],
        status: 201,
        handler: (ctx: HttpContext<NoParams, NoParams, CreateLabelDto>) =>
          service.create(currentUserId(ctx), ctx.body),
      },
      ...(suggested.length > 0
        ? [
            {
              method: "post" as const,
              path: "/suggested",
              handler: (ctx: HttpContext) => service.addSuggested(currentUserId(ctx)),
            },
          ]
        : []),
      {
        method: "patch",
        path: "/:id",
        guards: [validateId, validateUpdateLabel],
        handler: (ctx: HttpContext<IdParams, NoParams, UpdateLabelDto>) =>
          service.update(ctx.params.id, currentUserId(ctx), ctx.body),
      },
      {
        method: "delete",
        path: "/:id",
        guards: [validateId],
        handler: (ctx: HttpContext<IdParams>) => service.delete(ctx.params.id, currentUserId(ctx)),
      },
    ],
  };
}

// Categories (one per task) and tags (any number per task).
export const categoryModule = labelModule(categoryService);
export const tagModule = labelModule(tagService);
