import { ApiModule } from "../infrastructure/http";

import { accountModule } from "./account/account.module";
import { authModule } from "./auth/auth.module";
import { healthModule } from "./health/health.module";
import { transactionModule } from "./transaction/transaction.module";
import { userModule } from "./user/user.module";

// Every feature the API serves. A new feature is one new line here.
export const modules: ApiModule[] = [
  healthModule,
  authModule,
  userModule,
  accountModule,
  transactionModule,
];
