import { configuration } from "./config/configuration";
import { createHttpApp, HttpApp } from "./infrastructure/http";
import { modules } from "./modules";

export function createApp(): HttpApp {
  return createHttpApp({
    apiPrefix: configuration.app.apiPrefix,
    corsOrigin: configuration.app.corsOrigin,
    modules,
  });
}
