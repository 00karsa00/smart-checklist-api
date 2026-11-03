import { createApp } from "./app";
import { configuration } from "./config/configuration";
import { connectDatabase } from "./infrastructure/database";
import { logger } from "./infrastructure/logger";

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
    logger.info("PostgreSQL connected successfully");

    const server = await createApp().listen(configuration.app.port);
    logger.info(`Personal Finance API running on http://localhost:${server.port}`);
  } catch (error) {
    logger.error("Failed to start application", { error: String(error) });
    process.exit(1);
  }
}

void bootstrap();
