import { PageQuery, parsePageQuery } from "../../common/pagination";
import { HttpContext, IdParams, NoParams } from "../../infrastructure/http";

import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { userService } from "./user.service";

// Controllers translate the request into service arguments. No business rules.

export function getUsers(ctx: HttpContext<NoParams, PageQuery>) {
  return userService.listUsers(parsePageQuery(ctx.query));
}

export function getUser(ctx: HttpContext<IdParams>) {
  return userService.getUserById(ctx.params.id);
}

export function createUser(ctx: HttpContext<NoParams, NoParams, CreateUserDto>) {
  return userService.createUser(ctx.body);
}

export function updateUser(ctx: HttpContext<NoParams, UpdateUserDto>) {
  return userService.updateUser(ctx.params.id, ctx.body);
}

export function deleteUser(ctx: HttpContext<IdParams>) {
  return userService.deleteUser(ctx.params.id);
}
