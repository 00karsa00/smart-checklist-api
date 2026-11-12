import { currentUserId, parsePageQuery } from "../../common";
import { ApiModule, HttpContext, IdParams, NoParams } from "../../infrastructure/http";

import { userOnly } from "../user/user.module";
import {
  CreateNoteDto,
  CreateNoteItemDto,
  NoteListQuery,
  UpdateNoteDto,
  UpdateNoteItemDto,
} from "./dto/note.dto";
// Registers notes with search.
import "./note.search";
import { noteService } from "./note.service";
import {
  validateCreateNote,
  validateCreateNoteItem,
  validateNoteIdParam,
  validateNoteItemParams,
  validateNoteListQuery,
  validateUpdateNote,
  validateUpdateNoteItem,
} from "./note.validator";

type ItemParams = { id: string; itemId: string };

// Notes and checklists, in a project or workspace, optionally about a task.
export const noteModule: ApiModule = {
  path: "/notes",
  guards: userOnly,
  routes: [
    {
      method: "get",
      path: "/",
      guards: [validateNoteListQuery],
      handler: (ctx: HttpContext<NoParams, NoteListQuery>) => {
        const { page, limit, q, includeArchived, ...filter } = ctx.query;
        return noteService.list(
          currentUserId(ctx),
          {
            ...filter,
            search: q?.trim() || undefined,
            includeArchived: includeArchived === "true",
          },
          parsePageQuery({ page, limit }, 50),
        );
      },
    },
    {
      method: "post",
      path: "/",
      guards: [validateCreateNote],
      status: 201,
      handler: (ctx: HttpContext<NoParams, NoParams, CreateNoteDto>) =>
        noteService.create(currentUserId(ctx), ctx.body),
    },
    {
      method: "get",
      path: "/:id",
      guards: [validateNoteIdParam],
      handler: (ctx: HttpContext<IdParams>) => noteService.get(ctx.params.id, currentUserId(ctx)),
    },
    {
      method: "patch",
      path: "/:id",
      guards: [validateNoteIdParam, validateUpdateNote],
      handler: (ctx: HttpContext<IdParams, NoParams, UpdateNoteDto>) =>
        noteService.update(ctx.params.id, currentUserId(ctx), ctx.body),
    },
    {
      method: "delete",
      path: "/:id",
      guards: [validateNoteIdParam],
      handler: (ctx: HttpContext<IdParams>) =>
        noteService.delete(ctx.params.id, currentUserId(ctx)),
    },
    {
      method: "post",
      path: "/:id/items",
      guards: [validateNoteIdParam, validateCreateNoteItem],
      status: 201,
      handler: (ctx: HttpContext<IdParams, NoParams, CreateNoteItemDto>) =>
        noteService.addItem(ctx.params.id, currentUserId(ctx), ctx.body),
    },
    {
      method: "patch",
      path: "/:id/items/:itemId",
      guards: [validateNoteItemParams, validateUpdateNoteItem],
      handler: (ctx: HttpContext<ItemParams, NoParams, UpdateNoteItemDto>) =>
        noteService.updateItem(ctx.params.id, ctx.params.itemId, currentUserId(ctx), ctx.body),
    },
    {
      method: "delete",
      path: "/:id/items/:itemId",
      guards: [validateNoteItemParams],
      handler: (ctx: HttpContext<ItemParams>) =>
        noteService.deleteItem(ctx.params.id, ctx.params.itemId, currentUserId(ctx)),
    },
  ],
};
