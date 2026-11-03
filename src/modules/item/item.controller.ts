import { currentUserId } from "../../common/guards/auth.guard";
import { parsePageQuery } from "../../common/pagination";
import { HttpContext, IdParams, NoParams } from "../../infrastructure/http";

import { CreateItemDto, ItemListQuery, UpdateItemDto } from "./dto/item.dto";
import { itemService } from "./item.service";

// Controllers translate the request into service arguments. No business rules.

export function getItems(ctx: HttpContext<NoParams, ItemListQuery>) {
  return itemService.listItems(currentUserId(ctx), parsePageQuery(ctx.query), ctx.query.search);
}

export function getItem(ctx: HttpContext<IdParams>) {
  return itemService.getItemById(ctx.params.id, currentUserId(ctx));
}

export function createItem(ctx: HttpContext<NoParams, NoParams, CreateItemDto>) {
  return itemService.createItem(ctx.body, currentUserId(ctx));
}

export function updateItem(ctx: HttpContext<IdParams, NoParams, UpdateItemDto>) {
  return itemService.updateItem(ctx.params.id, currentUserId(ctx), ctx.body);
}

export function deleteItem(ctx: HttpContext<IdParams>) {
  return itemService.deleteItem(ctx.params.id, currentUserId(ctx));
}
