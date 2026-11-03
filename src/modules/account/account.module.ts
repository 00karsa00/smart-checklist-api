import { authenticate } from "../../common/guards/auth.guard";
import { ApiModule } from "../../infrastructure/http";

import {
  createAccount,
  deleteAccount,
  getAccount,
  getAccounts,
  getActiveAccountDropdownList,
  updateAccount,
} from "./account.controller";
import {
  validateAccountIdParam,
  validateAccountListQuery,
  validateCreateAccount,
  validateUpdateAccount,
} from "./account.validator";

// The authenticated user is the only source of ownership; clients never send userId.
export const accountModule: ApiModule = {
  path: "/accounts",
  guards: [authenticate],
  routes: [
    { method: "get", path: "/", guards: [validateAccountListQuery], handler: getAccounts },
    {
      method: "get",
      path: "/active-dropdown",
      guards: [validateAccountListQuery],
      handler: getActiveAccountDropdownList,
    },
    { method: "get", path: "/:id", guards: [validateAccountIdParam], handler: getAccount },
    {
      method: "post",
      path: "/",
      guards: [validateCreateAccount],
      status: 201,
      handler: createAccount,
    },
    {
      method: "patch",
      path: "/:id",
      guards: [validateAccountIdParam, validateUpdateAccount],
      handler: updateAccount,
    },
    { method: "delete", path: "/:id", guards: [validateAccountIdParam], handler: deleteAccount },
  ],
};
