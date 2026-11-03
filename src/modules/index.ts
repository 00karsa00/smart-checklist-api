import { ApiModule } from "../infrastructure/http";

import { authModule } from "./auth/auth.module";
import { healthModule } from "./health/health.module";
import { itemModule } from "./item/item.module";

// Every feature the API serves. A new feature is one new line here.
export const modules: ApiModule[] = [healthModule, authModule, itemModule];
