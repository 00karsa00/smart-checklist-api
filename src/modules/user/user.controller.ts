import { parsePageQuery } from "../../common/pagination";
import { HttpContext } from "../../infrastructure/http";

import { CreateUserDto, UpdateUserDto, UserIdParams, UserListQuery } from "./dto/user.dto";
import { userService } from "./user.service";

// Controllers translate the request into service arguments. No business rules.

type NoParams = Record<string, never>;

export function getUsers(ctx: HttpContext<NoParams, UserListQuery>) {
  return userService.listUsers(parsePageQuery(ctx.query));
}

export function getUser(ctx: HttpContext<UserIdParams>) {
  return userService.getUserById(ctx.params.id);
}

export function createUser(ctx: HttpContext<NoParams, NoParams, CreateUserDto>) {
  return userService.createUser(ctx.body);
}

export function updateUser(ctx: HttpContext<UserIdParams, NoParams, UpdateUserDto>) {
  return userService.updateUser(ctx.params.id, ctx.body);
}

export function deleteUser(ctx: HttpContext<UserIdParams>) {
  return userService.deleteUser(ctx.params.id);
}
