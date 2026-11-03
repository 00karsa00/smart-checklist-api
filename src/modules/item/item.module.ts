import { authenticate } from "../../common/guards/auth.guard";
import { ApiModule } from "../../infrastructure/http";

import { createItem, deleteItem, getItem, getItems, updateItem } from "./item.controller";
import {
  validateCreateItem,
  validateItemIdParam,
  validateItemListQuery,
  validateUpdateItem,
} from "./item.validator";

// Reference module: copy this folder to start a new feature.
// The signed-in user is the only source of ownership; clients never send userId.
export const itemModule: ApiModule = {
  path: "/items",
  guards: [authenticate],
  routes: [
    { method: "get", path: "/", guards: [validateItemListQuery], handler: getItems },
    { method: "get", path: "/:id", guards: [validateItemIdParam], handler: getItem },
    { method: "post", path: "/", guards: [validateCreateItem], status: 201, handler: createItem },
    {
      method: "patch",
      path: "/:id",
      guards: [validateItemIdParam, validateUpdateItem],
      handler: updateItem,
    },
    { method: "delete", path: "/:id", guards: [validateItemIdParam], handler: deleteItem },
  ],
};
