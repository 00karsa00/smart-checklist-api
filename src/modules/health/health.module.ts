import { ApiModule } from "../../infrastructure/http";

export const healthModule: ApiModule = {
  path: "/health",
  routes: [
    {
      method: "get",
      path: "/",
      handler: async () => ({
        status: "ok",
        service: "personal-finance-backend",
        timestamp: new Date().toISOString(),
      }),
    },
  ],
};
