import { currentUserId, rejectUnknownFields, validationError } from "../../common";
import { ApiModule, Guard, HttpContext, NoParams } from "../../infrastructure/http";

import { userOnly } from "../user/user.module";
import { searchService } from "./search.service";

const validateSearchQuery: Guard = (ctx) => {
  const query = ctx.query as Record<string, unknown>;
  rejectUnknownFields(query, ["q"], (field) => `Query param '${field}' is not supported.`);
  // The query is read-only: the handler trims `q` again.
  const text = typeof query.q === "string" ? query.q.trim() : "";
  if (text.length < 2 || text.length > 100) {
    throw validationError("Query param 'q' must be 2 to 100 characters.");
  }
};

// One search over everything a user keeps; modules add their records as sources.
export const searchModule: ApiModule = {
  path: "/search",
  guards: userOnly,
  routes: [
    {
      method: "get",
      path: "/",
      guards: [validateSearchQuery],
      handler: (ctx: HttpContext<NoParams, { q: string }>) =>
        searchService.search(currentUserId(ctx), ctx.query.q.trim()),
    },
  ],
};
