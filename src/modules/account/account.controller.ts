import { currentUserId } from "../../common/guards/auth.guard";
import { parsePageQuery } from "../../common/pagination";
import { HttpContext } from "../../infrastructure/http";

import {
  AccountIdParams,
  AccountListQuery,
  CreateAccountDto,
  UpdateAccountDto,
} from "./dto/account.dto";
import { accountService } from "./account.service";

// Controllers translate the request into service arguments. No business rules.

type NoParams = Record<string, never>;

export function getAccounts(ctx: HttpContext<NoParams, AccountListQuery>) {
  const { page, limit } = parsePageQuery(ctx.query);
  const { status, type, bank, search } = ctx.query;
  return accountService.getAllAccounts(currentUserId(ctx), page, limit, {
    status,
    type,
    bank,
    search,
  });
}

export function getAccount(ctx: HttpContext<AccountIdParams>) {
  return accountService.getAccountById(ctx.params.id, currentUserId(ctx));
}

export function createAccount(ctx: HttpContext<NoParams, NoParams, CreateAccountDto>) {
  return accountService.createAccount(ctx.body, currentUserId(ctx));
}

export function updateAccount(ctx: HttpContext<AccountIdParams, NoParams, UpdateAccountDto>) {
  return accountService.updateAccount(ctx.params.id, currentUserId(ctx), ctx.body);
}

export function deleteAccount(ctx: HttpContext<AccountIdParams>) {
  return accountService.deleteAccount(ctx.params.id, currentUserId(ctx));
}

export function getActiveAccountDropdownList(ctx: HttpContext<NoParams, AccountListQuery>) {
  const { page, limit } = parsePageQuery(ctx.query, 100);
  return accountService.getActiveAccountDropdownList(currentUserId(ctx), {
    page,
    limit,
    search: ctx.query.search ?? null,
  });
}
