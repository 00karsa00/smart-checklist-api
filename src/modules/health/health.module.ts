import { configuration } from "../../config/configuration";
import { ApiModule } from "../../infrastructure/http";

export const healthModule: ApiModule = {
  path: "/health",
  routes: [
    {
      method: "get",
      path: "/",
      handler: async () => ({
        status: "ok",
        service: configuration.app.name,
        timestamp: new Date().toISOString(),
      }),
    },
  ],
};
